import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Badge, Button, Group, Text, ActionIcon, ScrollArea } from "@mantine/core";
import { IconPlus, IconDots } from "@tabler/icons-react";
import React from "react";

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
                    width: "max-content", // Force horizontal expansion
                    minWidth: "100%",
                }}
            />
        </NodeViewWrapper>
    );
};

export const KanbanColumnView = (props: any) => {
    const { node, editor, getPos } = props;
    const count = node.childCount;

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
        // Insert at the end of the column
        const endPos = pos + node.nodeSize - 1;

        editor.chain().insertContentAt(endPos, {
            type: "taskCard",
            attrs: {
                status: node.attrs.title,
            },
            content: [
                {
                    type: "paragraph",
                    content: [] // Empty paragraph to satisfy schema
                }
            ]
        }).run();
    };

    return (
        <NodeViewWrapper
            style={{
                minWidth: "280px",
                width: "280px",
                backgroundColor: "var(--mantine-color-default-hover)",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                maxHeight: "800px",
                border: "1px solid var(--mantine-color-default-border)",
            }}
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
                    <ActionIcon variant="subtle" color="gray" size="sm">
                        <IconPlus size={16} onClick={handleAddTask} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="gray" size="sm">
                        <IconDots size={16} />
                    </ActionIcon>
                </Group>
            </Group>

            {/* Content Area */}
            <ScrollArea.Autosize mah={700} type="auto" offsetScrollbars>
                <div style={{ padding: "0 12px 12px 12px", minHeight: "60px" }}>
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
