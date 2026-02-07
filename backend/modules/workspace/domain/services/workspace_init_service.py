"""
Workspace initialization service.

Creates default workspace content for new users:
- Two folders: "White Repertoire", "Black Repertoire"
- One study: "Ding Liren - Jan-Krzysztof Duda" with sample game
"""

import json
import logging
from datetime import datetime, timezone
from ulid import ULID

from sqlalchemy.ext.asyncio import AsyncSession

from modules.workspace.db.repos.node_repo import NodeRepository
from modules.workspace.db.repos.study_repo import StudyRepository
from modules.workspace.db.tables.nodes import Node
from modules.workspace.db.tables.studies import Chapter, Study
from modules.workspace.domain.models.types import NodeType, Visibility
from modules.workspace.storage.r2_client import R2Client
from modules.workspace.storage.keys import R2Keys
from modules.workspace.events.bus import EventBus, publish_chapter_created

logger = logging.getLogger(__name__)


class WorkspaceInitService:
    """Service for initializing default workspace content for new users."""

    def __init__(
        self,
        session: AsyncSession,
        node_repo: NodeRepository,
        study_repo: StudyRepository,
        r2_client: R2Client,
        event_bus: EventBus,
    ):
        self.session = session
        self.node_repo = node_repo
        self.study_repo = study_repo
        self.r2_client = r2_client
        self.event_bus = event_bus

    async def initialize_workspace_for_user(self, user_id: str) -> None:
        """
        Create default workspace content for a new user.

        Creates:
        - Root workspace node
        - Two folders: "White Repertoire", "Black Repertoire"
        - One study: "Ding Liren - Jan-Krzysztof Duda" with one chapter

        Args:
            user_id: User ID to create workspace for
        """
        try:
            logger.info(f"Initializing workspace for user {user_id}")

            # Get or create root workspace node
            root_nodes = await self.node_repo.get_root_nodes(user_id)
            if root_nodes:
                workspace_node = root_nodes[0]
                logger.info(f"Using existing workspace node {workspace_node.id}")
            else:
                workspace_node = await self._create_workspace_node(user_id)
                logger.info(f"Created new workspace node {workspace_node.id}")

            # Create two folders
            white_folder = await self._create_folder(
                user_id, workspace_node.id, "White Repertoire"
            )
            black_folder = await self._create_folder(
                user_id, workspace_node.id, "Black Repertoire"
            )

            # Create sample study in white folder
            study_node = await self._create_sample_study(
                user_id, white_folder.id, workspace_node.id
            )

            await self.session.commit()
            logger.info(
                f"Workspace initialization complete for user {user_id}: "
                f"workspace={workspace_node.id}, "
                f"folders=[{white_folder.id}, {black_folder.id}], "
                f"study={study_node.id}"
            )

        except Exception as e:
            logger.error(f"Failed to initialize workspace for user {user_id}: {e}", exc_info=True)
            await self.session.rollback()
            # Don't fail registration if workspace init fails
            # User can create their own workspace content

    async def _create_workspace_node(self, user_id: str) -> Node:
        """Create root workspace node."""
        node_id = str(ULID())
        node = Node(
            id=node_id,
            node_type=NodeType.WORKSPACE,
            title=f"My Workspace",
            description="My chess studies workspace",
            owner_id=user_id,
            visibility=Visibility.PRIVATE,
            parent_id=None,
            path=f"/{node_id}/",
            depth=0,
            layout={},
            version=1,
        )
        return await self.node_repo.create(node)

    async def _create_folder(self, user_id: str, parent_id: str, title: str) -> Node:
        """Create a folder node."""
        node_id = str(ULID())
        parent = await self.node_repo.get_by_id(parent_id)
        if not parent:
            raise ValueError(f"Parent node {parent_id} not found")

        node = Node(
            id=node_id,
            node_type=NodeType.FOLDER,
            title=title,
            description=f"{title} folder",
            owner_id=user_id,
            visibility=Visibility.PRIVATE,
            parent_id=parent_id,
            path=f"{parent.path}{node_id}/",
            depth=parent.depth + 1,
            layout={},
            version=1,
        )
        return await self.node_repo.create(node)

    async def _create_sample_study(
        self, user_id: str, parent_id: str, workspace_id: str
    ) -> Node:
        """
        Create sample study "Ding Liren - Jan-Krzysztof Duda".

        Args:
            user_id: Owner user ID
            parent_id: Parent folder ID
            workspace_id: Root workspace ID

        Returns:
            Created study node
        """
        # Create study node
        study_id = str(ULID())
        parent = await self.node_repo.get_by_id(parent_id)
        if not parent:
            raise ValueError(f"Parent node {parent_id} not found")

        study_node = Node(
            id=study_id,
            node_type=NodeType.STUDY,
            title="Ding Liren - Jan-Krzysztof Duda",
            description="Sample study from 2025 World Championship",
            owner_id=user_id,
            visibility=Visibility.PRIVATE,
            parent_id=parent_id,
            path=f"{parent.path}{study_id}/",
            depth=parent.depth + 1,
            layout={},
            version=1,
        )
        study_node = await self.node_repo.create(study_node)

        # Create study metadata
        study = Study(
            id=study_id,
            description="Sample game from 2025 World Championship",
            chapter_count=1,
            is_public=False,
            tags="World Championship,2025,Ding Liren,Jan-Krzysztof Duda",
        )
        await self.study_repo.create_study(study)

        # Create chapter with tree.json
        chapter_id = str(ULID())
        r2_key = R2Keys.chapter_tree_json(chapter_id)

        # Load tree.json content
        tree_content = self._get_sample_tree_json()

        # Upload to R2
        upload_result = self.r2_client.upload_json(
            key=r2_key,
            content=json.dumps(tree_content),
            metadata={
                "study_id": study_id,
                "chapter_id": chapter_id,
                "order": "0",
            },
        )

        # Create chapter record
        chapter = Chapter(
            id=chapter_id,
            study_id=study_id,
            title="Ding Liren - Jan-Krzysztof Duda, 2025",
            order=0,
            white="Ding Liren",
            black="Jan-Krzysztof Duda",
            event="World Chess Championship 2025",
            date="2025.01.01",
            result="1-0",
            r2_key=r2_key,
            pgn_hash=upload_result.content_hash,
            pgn_size=upload_result.size,
            pgn_status="ready",
            r2_etag=upload_result.etag,
            last_synced_at=datetime.now(timezone.utc),
        )
        await self.study_repo.create_chapter(chapter)
        await self.study_repo.update_chapter_count(study_id)

        # Publish event
        await publish_chapter_created(
            self.event_bus,
            actor_id=user_id,
            study_id=study_id,
            chapter_id=chapter_id,
            title=chapter.title,
            order=0,
            r2_key=r2_key,
            workspace_id=workspace_id,
        )

        return study_node

    def _get_sample_tree_json(self) -> dict:
        """Get the sample tree.json for Ding Liren vs Duda game."""
        return {
            "version": "v1",
            "rootId": "root",
            "nodes": {
                "root": {"id": "root", "parentId": None, "san": "", "children": ["n1"], "comment": None, "nags": []},
                "n1": {"id": "n1", "parentId": "root", "san": "d4", "children": ["n2"], "comment": None, "nags": []},
                "n2": {"id": "n2", "parentId": "n1", "san": "Nf6", "children": ["n3"], "comment": None, "nags": []},
                "n3": {"id": "n3", "parentId": "n2", "san": "c4", "children": ["n4"], "comment": None, "nags": []},
                "n4": {"id": "n4", "parentId": "n3", "san": "e6", "children": ["n5"], "comment": None, "nags": []},
                "n5": {"id": "n5", "parentId": "n4", "san": "Nc3", "children": ["n6"], "comment": None, "nags": []},
                "n6": {"id": "n6", "parentId": "n5", "san": "Bb4", "children": ["n7"], "comment": None, "nags": []},
                "n7": {"id": "n7", "parentId": "n6", "san": "e3", "children": ["n8"], "comment": None, "nags": []},
                "n8": {"id": "n8", "parentId": "n7", "san": "O-O", "children": ["n9"], "comment": None, "nags": []},
                "n9": {"id": "n9", "parentId": "n8", "san": "Bd3", "children": ["n10"], "comment": None, "nags": []},
                "n10": {"id": "n10", "parentId": "n9", "san": "d5", "children": ["n11"], "comment": None, "nags": []},
                "n11": {"id": "n11", "parentId": "n10", "san": "Nf3", "children": ["n12"], "comment": None, "nags": []},
                "n12": {"id": "n12", "parentId": "n11", "san": "c5", "children": ["n13"], "comment": None, "nags": []},
                "n13": {"id": "n13", "parentId": "n12", "san": "O-O", "children": ["n14"], "comment": None, "nags": []},
                "n14": {"id": "n14", "parentId": "n13", "san": "Nc6", "children": ["n15"], "comment": None, "nags": []},
                "n15": {"id": "n15", "parentId": "n14", "san": "a3", "children": ["n16"], "comment": None, "nags": []},
                "n16": {"id": "n16", "parentId": "n15", "san": "Bxc3", "children": ["n17"], "comment": None, "nags": []},
                "n17": {"id": "n17", "parentId": "n16", "san": "bxc3", "children": ["n18"], "comment": None, "nags": []},
                "n18": {"id": "n18", "parentId": "n17", "san": "dxc4", "children": ["n19"], "comment": None, "nags": []},
                "n19": {"id": "n19", "parentId": "n18", "san": "Bxc4", "children": ["n20"], "comment": None, "nags": []},
                "n20": {"id": "n20", "parentId": "n19", "san": "Qc7", "children": ["n21"], "comment": None, "nags": []},
                "n21": {"id": "n21", "parentId": "n20", "san": "Bb2", "children": ["n22"], "comment": None, "nags": []},
                "n22": {"id": "n22", "parentId": "n21", "san": "b6", "children": ["n23"], "comment": None, "nags": []},
                "n23": {"id": "n23", "parentId": "n22", "san": "Rc1", "children": ["n24"], "comment": None, "nags": []},
                "n24": {"id": "n24", "parentId": "n23", "san": "Bb7", "children": ["n25"], "comment": None, "nags": []},
                "n25": {"id": "n25", "parentId": "n24", "san": "Bd3", "children": ["n26"], "comment": None, "nags": []},
                "n26": {"id": "n26", "parentId": "n25", "san": "Rfd8", "children": ["n27"], "comment": None, "nags": []},
                "n27": {"id": "n27", "parentId": "n26", "san": "Qe2", "children": ["n28"], "comment": None, "nags": []},
                "n28": {"id": "n28", "parentId": "n27", "san": "Rac8", "children": ["n29"], "comment": None, "nags": []},
                "n29": {"id": "n29", "parentId": "n28", "san": "dxc5", "children": ["n30"], "comment": None, "nags": []},
                "n30": {"id": "n30", "parentId": "n29", "san": "bxc5", "children": ["n31"], "comment": None, "nags": []},
                "n31": {"id": "n31", "parentId": "n30", "san": "c4", "children": ["n32"], "comment": None, "nags": []},
                "n32": {"id": "n32", "parentId": "n31", "san": "Qb6", "children": ["n33"], "comment": None, "nags": []},
                "n33": {"id": "n33", "parentId": "n32", "san": "Rfd1", "children": ["n34"], "comment": None, "nags": []},
                "n34": {"id": "n34", "parentId": "n33", "san": "h6", "children": ["n35"], "comment": None, "nags": []},
                "n35": {"id": "n35", "parentId": "n34", "san": "Bb1", "children": ["n36"], "comment": None, "nags": []},
                "n36": {"id": "n36", "parentId": "n35", "san": "Nb4", "children": ["n37"], "comment": None, "nags": []},
                "n37": {"id": "n37", "parentId": "n36", "san": "Rxd8+", "children": ["n38"], "comment": None, "nags": []},
                "n38": {"id": "n38", "parentId": "n37", "san": "Rxd8", "children": ["n39"], "comment": None, "nags": []},
                "n39": {"id": "n39", "parentId": "n38", "san": "Nd2", "children": ["n40"], "comment": None, "nags": []},
                "n40": {"id": "n40", "parentId": "n39", "san": "Qc7", "children": ["n41"], "comment": None, "nags": []},
                "n41": {"id": "n41", "parentId": "n40", "san": "Qg4", "children": ["n42"], "comment": None, "nags": []},
                "n42": {"id": "n42", "parentId": "n41", "san": "Nd3", "children": ["n43"], "comment": None, "nags": []},
                "n43": {"id": "n43", "parentId": "n42", "san": "Bxd3", "children": ["n44"], "comment": None, "nags": []},
                "n44": {"id": "n44", "parentId": "n43", "san": "Rxd3", "children": ["n45"], "comment": None, "nags": []},
                "n45": {"id": "n45", "parentId": "n44", "san": "e4", "children": ["n46"], "comment": None, "nags": []},
                "n46": {"id": "n46", "parentId": "n45", "san": "Rd1", "children": ["n47"], "comment": None, "nags": []},
                "n47": {"id": "n47", "parentId": "n46", "san": "Rxd1+", "children": ["n48"], "comment": None, "nags": []},
                "n48": {"id": "n48", "parentId": "n47", "san": "Qxd1", "children": ["n49"], "comment": None, "nags": []},
                "n49": {"id": "n49", "parentId": "n48", "san": "Qf6", "children": ["n50"], "comment": None, "nags": []},
                "n50": {"id": "n50", "parentId": "n49", "san": "Bxf6", "children": ["n51"], "comment": None, "nags": []},
                "n51": {"id": "n51", "parentId": "n50", "san": "gxf6", "children": ["n52"], "comment": None, "nags": []},
                "n52": {"id": "n52", "parentId": "n51", "san": "Qd7", "children": ["n53"], "comment": None, "nags": []},
                "n53": {"id": "n53", "parentId": "n52", "san": "Qe7", "children": ["n54"], "comment": None, "nags": []},
                "n54": {"id": "n54", "parentId": "n53", "san": "Qd5", "children": ["n55"], "comment": None, "nags": []},
                "n55": {"id": "n55", "parentId": "n54", "san": "Qe8", "children": ["n56"], "comment": None, "nags": []},
                "n56": {"id": "n56", "parentId": "n55", "san": "Kf1", "children": ["n57"], "comment": None, "nags": []},
                "n57": {"id": "n57", "parentId": "n56", "san": "Qh5", "children": ["n58"], "comment": None, "nags": []},
                "n58": {"id": "n58", "parentId": "n57", "san": "Qc6", "children": ["n59"], "comment": None, "nags": []},
                "n59": {"id": "n59", "parentId": "n58", "san": "a5", "children": ["n60"], "comment": None, "nags": []},
                "n60": {"id": "n60", "parentId": "n59", "san": "g3", "children": ["n61"], "comment": None, "nags": []},
                "n61": {"id": "n61", "parentId": "n60", "san": "Qf5", "children": ["n62"], "comment": None, "nags": []},
                "n62": {"id": "n62", "parentId": "n61", "san": "Qb5", "children": ["n63"], "comment": None, "nags": []},
                "n63": {"id": "n63", "parentId": "n62", "san": "a4", "children": ["n64"], "comment": None, "nags": []},
                "n64": {"id": "n64", "parentId": "n63", "san": "Qxa4", "children": ["n65"], "comment": None, "nags": []},
                "n65": {"id": "n65", "parentId": "n64", "san": "Qc6", "children": ["n66"], "comment": None, "nags": []},
                "n66": {"id": "n66", "parentId": "n65", "san": "c5", "children": ["n67"], "comment": None, "nags": []},
                "n67": {"id": "n67", "parentId": "n66", "san": "Qd5", "children": ["n68"], "comment": None, "nags": []},
                "n68": {"id": "n68", "parentId": "n67", "san": "Qb6", "children": ["n69"], "comment": None, "nags": []},
                "n69": {"id": "n69", "parentId": "n68", "san": "Qxe3", "children": ["n70"], "comment": None, "nags": []},
                "n70": {"id": "n70", "parentId": "n69", "san": "Qxc5", "children": ["n71"], "comment": None, "nags": []},
                "n71": {"id": "n71", "parentId": "n70", "san": "Qb1+", "children": ["n72"], "comment": None, "nags": []},
                "n72": {"id": "n72", "parentId": "n71", "san": "Kg2", "children": ["n73"], "comment": None, "nags": []},
                "n73": {"id": "n73", "parentId": "n72", "san": "Qxa2", "children": ["n74"], "comment": None, "nags": []},
                "n74": {"id": "n74", "parentId": "n73", "san": "Qc7", "children": ["n75"], "comment": None, "nags": []},
                "n75": {"id": "n75", "parentId": "n74", "san": "Qa1", "children": [], "comment": None, "nags": []},
            },
            "meta": {"result": "1-0"},
        }
