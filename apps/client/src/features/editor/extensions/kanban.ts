import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { KanbanBoardView, KanbanColumnView } from "@/features/editor/components/kanban/kanban-view.tsx";

export const KanbanBoard = Node.create({
    name: "kanbanBoard",
    group: "block",
    content: "kanbanColumn+", // Must contain at least one column
    defining: true,
    isolating: true,

    parseHTML() {
        return [{ tag: 'div[data-type="kanban-board"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes, { "data-type": "kanban-board" }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(KanbanBoardView);
    },
});

export const KanbanColumn = Node.create({
    name: "kanbanColumn",
    group: "block",
    content: "taskCard*", // Can contain zero or more task cards
    isolating: true,
    draggable: false, // Columns themselves usually static in this simple version

    addAttributes() {
        return {
            title: { default: "Column" },
            color: { default: "gray" },
            id: { default: null },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="kanban-column"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes, { "data-type": "kanban-column" }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(KanbanColumnView);
    },
});
