import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import TaskCardView from "@/features/editor/components/task-card/task-card-view.tsx";

export const TaskCard = Node.create({
    name: "taskCard",

    group: "block",

    content: "block+",

    draggable: true,

    addAttributes() {
        return {
            ticketId: {
                default: "TASK-1",
            },
            status: {
                default: "To Do",
            },
            priority: {
                default: "Medium",
            },
            assignee: {
                default: null,
            },
            dueDate: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="task-card"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-type": "task-card" }),
            0,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TaskCardView);
    },
});
