import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Badge, Button, Group, Text, ActionIcon, ScrollArea } from "@mantine/core";
import { IconPlus, IconDots } from "@tabler/icons-react";
import React, { useState, useCallback, useRef } from "react";

// Shared drag state using a simple module-level variable
// This avoids the need for context providers within Tiptap node views
let globalDragState: {
    sourcePos: number;
    sourceNodeJSON: any;
    sourceColumnTitle: string;
} | null = null;

export const KanbanBoardView = () => {
    return (
        <NodeViewWrapper
            className="kanban-board-wrapper"
            style={{
                width: "100%",
                overflowX: "auto",
                padding: "8px 0",
            }}
        >
            <NodeViewContent
                className="kanban-board-content"
                style={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "nowrap",
                    gap: "16px",
                    alignItems: "flex-start",
                    width: "max-content",
                    minWidth: "100%",
                }}
            />
        </NodeViewWrapper>
    );
};

export const KanbanColumnView = (props: any) => {
    const { node, editor, getPos } = props;
    const count = node.childCount;
    const [isDragOver, setIsDragOver] = useState(false);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const colorConfig: Record<string, string> = {
        gray: "gray",
        blue: "blue",
        green: "green",
        red: "red",
        yellow: "yellow",
        orange: "orange",
    };

    const handleAddTask = () => {
        const pos = getPos();
        const endPos = pos + node.nodeSize - 1;

        editor.chain().insertContentAt(endPos, {
            type: "taskCard",
            attrs: {
                status: node.attrs.title,
            },
            content: [
                {
                    type: "paragraph",
                    content: []
                }
            ]
        }).run();
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (globalDragState) {
            setIsDragOver(true);
            e.dataTransfer.dropEffect = 'move';
        }
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (!globalDragState) return;

        const { sourcePos, sourceNodeJSON, sourceColumnTitle } = globalDragState;
        const targetColumnTitle = node.attrs.title;

        // Don't do anything if dropping in the same column
        if (sourceColumnTitle === targetColumnTitle) {
            globalDragState = null;
            return;
        }

        // Get position to insert at (end of this column)
        const columnPos = getPos();
        const insertPos = columnPos + node.nodeSize - 1;

        // Update the status to match the target column
        const updatedNodeJSON = {
            ...sourceNodeJSON,
            attrs: {
                ...sourceNodeJSON.attrs,
                status: targetColumnTitle,
            }
        };

        // Use a transaction to delete from source and insert at target
        editor.chain()
            .focus()
            .command(({ tr, state }) => {
                // First, delete the source node
                const sourceNode = state.doc.nodeAt(sourcePos);
                if (sourceNode) {
                    tr.delete(sourcePos, sourcePos + sourceNode.nodeSize);
                }
                return true;
            })
            .run();

        // After deletion, positions have shifted - insert at the column end
        // We need to recalculate position after deletion
        setTimeout(() => {
            const newColumnPos = getPos();
            const newNode = editor.state.doc.nodeAt(newColumnPos);
            if (newNode) {
                const newInsertPos = newColumnPos + newNode.nodeSize - 1;
                editor.chain()
                    .insertContentAt(newInsertPos, updatedNodeJSON)
                    .run();
            }
        }, 10);

        globalDragState = null;
    }, [node, editor, getPos]);

    return (
        <NodeViewWrapper
            style={{
                minWidth: "280px",
                width: "280px",
                backgroundColor: isDragOver
                    ? "var(--mantine-color-blue-light)"
                    : "var(--mantine-color-default-hover)",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                maxHeight: "800px",
                border: isDragOver
                    ? "2px dashed var(--mantine-color-blue-5)"
                    : "1px solid var(--mantine-color-default-border)",
                transition: "all 0.2s ease",
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header */}
            <Group justify="space-between" p="sm" pb="xs">
                <Group gap="xs">
                    <Badge
                        color={colorConfig[node.attrs.color] || "gray"}
                        variant="light"
                        size="lg"
                        radius="sm"
                        style={{ textTransform: "none", fontWeight: 600, paddingLeft: 8, paddingRight: 8 }}
                        leftSection={
                            <Text size="xs" fw={700} style={{ opacity: 0.8, marginRight: 4 }}>
                                {count}
                            </Text>
                        }
                    >
                        {node.attrs.title}
                    </Badge>
                </Group>

                <Group gap={4}>
                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleAddTask}>
                        <IconPlus size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="gray" size="sm">
                        <IconDots size={16} />
                    </ActionIcon>
                </Group>
            </Group>

            {/* Content Area */}
            <ScrollArea.Autosize mah={700} type="auto" offsetScrollbars>
                <div
                    ref={dropZoneRef}
                    style={{
                        padding: "0 12px 12px 12px",
                        minHeight: "60px",
                    }}
                >
                    <NodeViewContent />

                    <Button
                        variant="subtle"
                        color="gray"
                        fullWidth
                        leftSection={<IconPlus size={14} />}
                        onClick={handleAddTask}
                        styles={{
                            root: { justifyContent: "flex-start", marginTop: 8 },
                            label: { fontWeight: 500 }
                        }}
                    >
                        New item
                    </Button>
                </div>
            </ScrollArea.Autosize>
        </NodeViewWrapper>
    );
};

// Export the global drag state setter for use by TaskCardView
export const setGlobalDragState = (state: typeof globalDragState) => {
    globalDragState = state;
};

export const getGlobalDragState = () => globalDragState;
