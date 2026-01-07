import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import {
    Badge,
    Card,
    Group,
    Text,
    ThemeIcon,
    Select,
    Stack,
    ActionIcon,
} from "@mantine/core";
import { IconTicket, IconGripVertical } from "@tabler/icons-react";
import React from "react";

const TaskCardView = (props: any) => {
    const { node, updateAttributes } = props;

    const statusColors: Record<string, string> = {
        "To Do": "gray",
        "In Progress": "blue",
        "Done": "green",
        "Blocked": "red",
    };

    const priorityColors: Record<string, string> = {
        "Low": "gray",
        "Medium": "yellow",
        "High": "orange",
        "Critical": "red",
    };

    return (
        <NodeViewWrapper className="task-card-wrapper" style={{ margin: "1em 0" }}>
            <Card withBorder shadow="sm" radius="md" padding="md">
                <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                        <ThemeIcon color="blue" variant="light" size="sm">
                            <IconTicket size={12} />
                        </ThemeIcon>
                        <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                            {node.attrs.ticketId}
                        </Text>
                    </Group>
                    <Badge variant="light" color={statusColors[node.attrs.status]}>
                        {node.attrs.status}
                    </Badge>
                </Group>

                <Text size="xs" fw={700} c="dimmed" mb={4} tt="uppercase">
                    Description
                </Text>

                <div style={{ borderTop: "1px solid var(--mantine-color-gray-2)", marginBottom: "8px" }} />

                <NodeViewContent
                    style={{
                        minHeight: "60px",
                        marginBottom: "10px",
                        fontSize: "14px",
                        fontWeight: 400,
                        lineHeight: "1.6"
                    }}
                />

                <Group gap="apart" mt="sm">
                    <Group gap="xs">
                        <Select
                            size="xs"
                            variant="unstyled"
                            value={node.attrs.status}
                            onChange={(val) => updateAttributes({ status: val })}
                            data={["To Do", "In Progress", "Done", "Blocked"]}
                            styles={{ input: { width: "80px", fontWeight: 600, color: "var(--mantine-color-dimmed)" } }}
                        />
                        <Select
                            size="xs"
                            variant="unstyled"
                            value={node.attrs.priority}
                            onChange={(val) => updateAttributes({ priority: val })}
                            data={["Low", "Medium", "High", "Critical"]}
                            styles={{ input: { width: "80px", fontWeight: 600, color: "var(--mantine-color-dimmed)" } }}
                        />
                    </Group>
                    <Text size="xs" c="dimmed">
                        Assignee: {node.attrs.assignee || "@Unassigned"}
                    </Text>
                </Group>
            </Card>
        </NodeViewWrapper>
    );
};

export default TaskCardView;
