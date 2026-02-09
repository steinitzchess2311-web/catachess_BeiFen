// Search and fuzzy matching utilities

import { api } from '../../../assets/api';
import { WorkspaceState } from './types';

export function parseSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('folder/')) {
        return { type: 'folder' as const, query: trimmed.slice(7).trim() };
    }
    if (lower.startsWith('study/')) {
        return { type: 'study' as const, query: trimmed.slice(6).trim() };
    }
    return { type: null, query: trimmed };
}

export function levenshtein(a: string, b: string) {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i += 1) dp[i][0] = i;
    for (let j = 0; j <= n; j += 1) dp[0][j] = j;
    for (let i = 1; i <= m; i += 1) {
        for (let j = 1; j <= n; j += 1) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            );
        }
    }
    return dp[m][n];
}

export function scoreMatch(title: string, query: string) {
    const t = title.toLowerCase();
    const q = query.toLowerCase();
    if (t === q) return 0;
    if (t.startsWith(q)) return 1;
    const idx = t.indexOf(q);
    if (idx >= 0) return 2 + idx / 100;
    const dist = levenshtein(t, q);
    const norm = dist / Math.max(t.length, q.length, 1);
    return 5 + norm;
}

export async function fetchAllNodes(state: WorkspaceState) {
    if (state.allNodesCache) return state.allNodesCache;
    const collected: any[] = [];
    const queue: string[] = ['root'];
    while (queue.length) {
        const parentId = queue.shift() as string;
        const response = await api.get(`/api/v1/workspace/nodes?parent_id=${parentId}`);
        const nodes = (response?.nodes || []) as any[];
        collected.push(...nodes);
        nodes.forEach((node) => {
            if (node.node_type === 'folder') {
                queue.push(node.id);
            }
        });
    }
    state.allNodesCache = collected;
    return collected;
}

export async function runSearch(state: WorkspaceState, raw: string, renderItems: (nodes: any[]) => void, refreshNodes: (parentId: string) => Promise<void>) {
    const parsed = parseSearch(raw);
    if (!parsed) {
        await refreshNodes(state.currentParentId);
        return;
    }
    if (!parsed.query) {
        await refreshNodes(state.currentParentId);
        return;
    }
    const nodes = await fetchAllNodes(state);
    const filtered = nodes.filter((node) => {
        if (parsed.type && node.node_type !== parsed.type) return false;
        return true;
    });
    const ranked = filtered
        .map((node) => ({
            node,
            score: scoreMatch(node.title || '', parsed.query),
        }))
        .sort((a, b) => a.score - b.score)
        .map((entry) => entry.node);
    renderItems(ranked);
}
