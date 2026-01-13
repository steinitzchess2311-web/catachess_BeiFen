import { api } from '../../../assets/api';
import { Chessboard } from '../../chessboard';
import { initDiscussion } from '../../discussion/events';

export async function initStudy(container: HTMLElement, studyId: string) {
    // 1. Load Template
    const template = document.getElementById('study-template') as HTMLTemplateElement;
    if (!template) return;
    const content = document.importNode(template.content, true);
    container.appendChild(content);

    // 2. Select Elements
    const boardMount = container.querySelector('#board-mount') as HTMLElement;
    const chapterList = container.querySelector('#chapter-list') as HTMLElement;
    const discussionMount = container.querySelector('#discussion-mount') as HTMLElement;
    const tabBtns = container.querySelectorAll('.tab-btn');
    const tabContents = container.querySelectorAll('.tab-content');

    // 3. State
    let currentStudy: any = null;
    let currentChapter: any = null;
    let board: Chessboard | null = null;
    let discussion: any = null;

    // 4. Initialization
    let heartbeatInterval: any = null;

    const startHeartbeat = () => {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(sendHeartbeat, 30000);
        sendHeartbeat(); // Initial call
    };

    const sendHeartbeat = async () => {
        if (!currentChapter) return;
        try {
            await api.post('/api/v1/workspace/presence/heartbeat', {
                study_id: studyId,
                chapter_id: currentChapter.id,
                move_path: null // TODO: Get current move path from board
            });
        } catch (error) {
            console.error('Heartbeat failed:', error);
        }
    };

    const loadStudyData = async () => {
        try {
            const response = await api.get(`/api/v1/workspace/studies/${studyId}`);
            currentStudy = response.study;
            renderChapters(response.chapters);
            
            if (response.chapters.length > 0) {
                selectChapter(response.chapters[0]);
                startHeartbeat();
            }
        } catch (error) {
            console.error('Failed to load study:', error);
        }
    };

    const renderChapters = (chapters: any[]) => {
        chapterList.innerHTML = '';
        const tpl = document.getElementById('chapter-item-template') as HTMLTemplateElement;
        
        chapters.forEach(ch => {
            const item = document.importNode(tpl.content, true);
            const div = item.querySelector('.chapter-item') as HTMLElement;
            div.querySelector('.chapter-order')!.textContent = ch.order.toString();
            div.querySelector('.chapter-title')!.textContent = ch.title;
            
            div.addEventListener('click', () => selectChapter(ch));
            chapterList.appendChild(item);
        });
    };

    const selectChapter = (ch: any) => {
        currentChapter = ch;
        // Update UI
        container.querySelectorAll('.chapter-item').forEach(el => {
            el.classList.toggle('active', (el as HTMLElement).dataset.id === ch.id);
        });

        // Initialize/Update Board
        if (!board) {
            board = new Chessboard(boardMount, {
                gameId: ch.id,
                onMove: (move) => handleMove(move)
            });
        } else {
            // Update board position if needed
            // board.loadPGN(ch.pgn); // Assuming board has this
        }

        // Initialize Discussion
        if (!discussion) {
            discussion = initDiscussion(discussionMount, {
                targetType: 'chapter',
                targetId: ch.id
            });
        } else {
            discussion.updateContext('chapter', ch.id);
        }
    };

    const handleMove = async (move: any) => {
        try {
            // POST /api/v1/workspace/studies/{id}/chapters/{id}/moves
            await api.post(`/api/v1/workspace/studies/${studyId}/chapters/${currentChapter.id}/moves`, {
                parent_id: move.parentId,
                san: move.san,
                uci: move.uci,
                fen: move.fen,
                move_number: move.number,
                color: move.color
            });
        } catch (error) {
            console.error('Failed to save move:', error);
        }
    };

    // Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = (btn as HTMLElement).dataset.tab;
            tabBtns.forEach(b => b.classList.toggle('active', b === btn));
            tabContents.forEach(c => {
                c.classList.toggle('active', c.id === `tab-${tab}`);
            });
        });
    });

    // Start
    loadStudyData();
}
