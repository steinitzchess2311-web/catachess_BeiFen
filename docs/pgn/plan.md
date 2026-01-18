0）核心原则（先定死，后面才不会返工）

数据真相源（source of truth）只有一个：Node Tree（走法树）

任何“走棋/加评论/加变化/改注释/删注释”都先变成对走法树的修改。

PGN 只是走法树的序列化输出（随时可再生成）。

R2 存两类东西：

current.pgn（完整 PGN 快照，方便加载/导出/分享）

events/xxxx.jsonl（可选：事件流，便于回放、协作冲突解决、审计）

FEN 不是算一次就完：你要“每个节点一个 FEN”

这样前端点任何一步，都能瞬间跳局面。

Stockfish / tagger 也只需要吃 node_id + fen。

1）目录结构（按你要求：pgn_display / pgn_show / pgn_storage / pgn_fen）
backend/core/real_pgn/
  __init__.py

  pgn_display/
    __init__.py
    models.py          # NodeTree 数据结构（节点、评论、变例、NAG）
    builder.py         # 把 NodeTree -> PGN string（标准PGN含{}()等）
    parser.py          # (可选) 读入 PGN -> NodeTree（导入/兼容）
  
  pgn_show/
    __init__.py
    dto.py             # 给前端的“干净分割格式”
    serializer.py      # NodeTree -> ShowDTO（像 lichess 那样分段/嵌套）
  
  pgn_storage/
    __init__.py
    r2_client.py       # S3兼容R2：put/get + version/etag
    keys.py            # 统一 key 命名
    repo.py            # save_snapshot_pgn / save_event / load_current
  
  pgn_fen/
    __init__.py
    fen_index.py       # node_id -> fen
    calculator.py      # python-chess: 从起始局面沿节点算fen
    publish.py         # 写入R2 + 推送给分析层

2）你要的“实时录入 PGN”：Node Tree（走法树）怎么长
Node（最小但够用）

每一步是一个节点，支持：

主线 / 变化（variation）

注释（comment）

NAG（$1 $2 …）可选

# pgn_display/models.py（结构示意）
class PgnNode:
    node_id: str
    parent_id: str | None

    # 走法信息
    san: str | None          # 例如 "Nf3" / "O-O" / "dxc4"
    uci: str | None          # 可选：用于稳定落子（前端/引擎对接更稳）
    ply: int                 # 半回合数，从起始局面算
    move_number: int         # 回合数（白走=1，黑走=1...）

    # 注释与标记
    comment_before: str | None   # { ... } 出现在该步之前（可选）
    comment_after: str | None    # { ... } 出现在该步之后（常用）
    nags: list[int]              # [5, 14] => "$5 $14"

    # 走法树结构
    main_child: str | None       # 主线下一步
    variations: list[str]        # 每个是“变化分支的第一步 node_id”


你的 UI（像 lichess）本质就是把这个树序列化成带括号的 PGN 展示。

3）pgn_display：NodeTree -> 完整 PGN string（含 headers + {} + ()）
headers（从你的 sample 兼容）

放在 “GameMeta” 里（Event/Site/Date/White/Black/Result/SetUp/FEN 等）

注意：你 sample 里有 SetUp "1" + FEN "..."，表示不是初始局面。

PGN 输出规则（要做到“标准能被 ChessBase/lichess 读”）：

注释用 {...}

变化用 (...)

NAG 用 $5 这种

终局 1-0/0-1/1/2-1/2

4）real_pgn/pgn_show：给前端的“干净分割格式”（像 lichess 一样）

你前端不要直接吃 raw PGN 文本（不好渲染/不好点击定位）。
你要一个 ShowDTO：把 PGN 分成“可渲染 token 流 + 树结构”。

建议返回结构（前端渲染最爽）
{
  "headers": [{"k":"Event","v":"..."}, ...],
  "root_fen": "startpos 或 指定FEN",
  "result": "1-0",
  "nodes": {
    "n0": {
      "node_id":"n0",
      "ply":0,
      "move_number":0,
      "side":"w",
      "san":null,
      "comment_after":"开局大段注释(如果有)",
      "main_child":"n1",
      "variations":["v1","v2"]
    },
    "n1": { "san":"Nf3", "comment_after":"...", "main_child":"n2", ... },
    "v1": { "san":"c4", "main_child":"v1_2", ... }
  },

  "render": [
    {"t":"comment","node":"n0","text":"..."},
    {"t":"move","node":"n1","label":"1.","san":"Nf3"},
    {"t":"comment","node":"n1","text":"..."},
    {"t":"move","node":"n2","san":"d5"},
    {"t":"variation_start","from":"n1"},
      {"t":"move","node":"v1","label":"(2.","san":"c4"},
      {"t":"move","node":"v1_2","san":"d4"},
      {"t":"comment","node":"v1_2","text":"..."},
    {"t":"variation_end"},
    ...
  ]
}

前端展示要求（你说“像 lichess 一样”）

你可以按下面规则写给前端同学/自己实现：

主线连续排版：1. Nf3 d5 2. g3 Nf6 ...

变化是缩进块/括号块：在触发点（某步之后）插入一段括号内容

注释可折叠：默认只显示首句/前 120 字，点开展开

点击 move token：调用 /fen?node_id=... 或直接用 DTO 里的 fen（推荐直接带）让棋盘跳转

hover 高亮：hover 某步，棋盘临时预览（不改变主状态）


5）real_pgn/pgn_storage：任何变动都即时写入 R2（你要的“提交即上传”）
你要定义“变动事件”（最低限度）

MOVE_ADD

COMMENT_SET

VARIATION_ADD

NODE_DELETE（可选）

NAG_SET（可选）

事件结构示意：

{
  "study_id":"...",
  "game_id":"...",
  "version": 183,
  "ts": 1737171717,
  "type":"COMMENT_SET",
  "node_id":"n17",
  "payload":{"comment_after":"text..."}
}

R2 Key 命名（建议）
pgn/{study_id}/{game_id}/current.pgn
pgn/{study_id}/{game_id}/tree.json
pgn/{study_id}/{game_id}/fen_index.json
pgn/{study_id}/{game_id}/events.jsonl   (可选)

写入策略（你要“即时” + 不想冲突）

每次变动：

更新树（内存/DB都行，但至少要有 version）

生成 current.pgn

写 R2：tree.json + current.pgn + fen_index.json

comment：点击提交才算一个事件（你要求的）

协作编辑以后你一定会遇到冲突，所以现在就加 version（乐观锁）。前端提交带 version，后端不匹配就返回 409，让前端 reload。

6）real_pgn/pgn_fen：点击走法跳局面 + 给分析层/标签器喂 FEN
两种实现方式（推荐第 1）

每次变动后增量刷新 fen_index（推荐）

新增一步：只从 parent 的 fen 推出 child fen

改变分支结构：只重算受影响子树

每次点击再现场算（简单但慢，且分析层不好对接）

给 Stockfish & tagger 的对接点

你后端统一提供一个“发布接口”：

当某 node 的 fen 生成/更新：

写入 fen_index.json

追加一个 analysis_queue 事件（你可以先写 R2，再由 worker 拉取）

最小可行：

分析层只需要轮询 pgn/{study}/{game}/fen_index.json，拿到新增 node_id 就跑。

7）对外 API（建议你放在 backend/modules/study 或 games 下，但内部调用 real_pgn）
写接口（前端操作）

POST /api/study/{study_id}/game/{game_id}/move

body: {parent_node_id, uci|san, version}

POST /api/study/{study_id}/game/{game_id}/comment

body: {node_id, comment_after, version}（提交才触发事件 + 上传）

POST /api/study/{study_id}/game/{game_id}/variation

body: {from_node_id, moves:[...], version}

读接口（前端加载/刷新）

GET /api/study/{study_id}/game/{game_id}/pgn -> 直接返回 current.pgn

GET /api/study/{study_id}/game/{game_id}/show -> 返回 ShowDTO（前端 lichess 风格渲染）

GET /api/study/{study_id}/game/{game_id}/fen?node_id=... -> 返回 {fen}
（或者 show 直接附带 fen，点击不再请求）

8）实现库（强烈建议）

后端用 Python 的话，直接用 python-chess：

SAN/合法性校验

PGN 生成/解析

FEN 推演

你现在这套“注释 + 变化 + NAG + SetUp/FEN”都能稳吃。

9）你下一步怎么干（最小实现优先级）

先把 NodeTree + version 机制写出来（不写这个，后面全乱）

MOVE_ADD + COMMENT_SET 两个事件先跑通

builder.py 能输出一个可被 lichess/import 的 PGN

show 输出 token 流（前端先能渲染 + 点击跳 fen）

fen_index 跑通（先全量算，后面再做增量优化）

R2 snapshot：current.pgn + tree.json + fen_index.json

