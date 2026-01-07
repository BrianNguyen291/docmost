import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Badge, Button, Group, Text, ActionIcon, ScrollArea } from "@mantine/core";
import { IconPlus, IconDots } from "@tabler/icons-react";
import React, { useMemo } from "react";

export const KanbanBoardView = () => {
    return (
        <NodeViewWrapper
            className="kanban-board-wrapper"
            style={{
                display: "flex",
                gap: "16px",
                overflowX: "auto",
                padding: "8px 4px",
                alignItems: "flex-start",
                width: "100%",
            }}
        >
            <NodeViewContent
                style={{
                    display: "flex",
                    gap: "16px",
                    height: "100%",
                    flex: 1,
                }}
            />
        </NodeViewWrapper>
    );
};

export const KanbanColumnView = (props: any) => {
    const { node, updateAttributes, editor, getPos } = props;
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
        // We want to append a new taskCard to this column's content
        // We can't easily append via props.node directly in standard Tiptap API without a transaction
        // A trick is to use the editor chain.

        // Find the end position of this node
        const pos = getPos();
        const endPos = pos + node.nodeSize - 1; // Inside the columns, at the end

        editor.chain().insertContentAt(endPos, {
            type: "taskCard",
            attrs: {
                status: node.attrs.title, // Auto-set status match column title if it matches standard ones
            }
        }).run();
    };

    return (
        <NodeViewWrapper
            style={{
                minWidth: "300px",
                width: "300px",
                backgroundColor: "var(--mantine-color-default-hover)", // faint bg
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
                <div style={{ padding: "0 12px 12px 12px", minHeight: "100px" }}>
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
