import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import {
    Badge,
    Card,
    Group,
    Text,
    ActionIcon,
    Avatar,
    Tooltip,
    Menu,
    Button
} from "@mantine/core";
import {
    IconTicket,
    IconDots,
    IconCircle,
    IconCircleHalf2,
    IconCircleCheckFilled,
    IconCircleXFilled,
    IconAlertCircleFilled,
    IconAntennaBars5,
    IconAntennaBars4,
    IconAntennaBars3,
    IconHelp,
    IconCalendar
} from "@tabler/icons-react";
import React from "react";

const TaskCardView = (props: any) => {
    const { node, updateAttributes } = props;

    const statusConfig: any = {
        "To Do": { color: "gray", icon: IconCircle, label: "To Do" },
        "In Progress": { color: "blue", icon: IconCircleHalf2, label: "In Progress" },
        "Done": { color: "green", icon: IconCircleCheckFilled, label: "Done" },
        "Blocked": { color: "red", icon: IconCircleXFilled, label: "Blocked" },
    };

    const priorityConfig: any = {
        "Low": { color: "gray", icon: IconAntennaBars3, label: "Low" },
        "Medium": { color: "yellow", icon: IconAntennaBars4, label: "Medium" },
        "High": { color: "orange", icon: IconAntennaBars5, label: "High" },
        "Critical": { color: "red", icon: IconAlertCircleFilled, label: "Critical" },
    };

    const StatusIcon = statusConfig[node.attrs.status]?.icon || IconCircle;
    const PriorityIcon = priorityConfig[node.attrs.priority]?.icon || IconAntennaBars3;

    return (
        <NodeViewWrapper className="task-card-wrapper" style={{ margin: "1em 0" }}>
            <Card
                withBorder
                shadow="sm"
                radius="md"
                padding="xs"
                style={{
                    backgroundColor: "var(--mantine-color-body)",
                    cursor: "default",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
                className="hover:shadow-md hover:border-blue-300"
            >
                {/* Header: ID and Context Menu */}
                <Group justify="space-between" align="center" mb={2}>
                    <Group gap={6} align="center">
                        <div
                            style={{
                                width: 16,
                                height: 16,
                                borderRadius: 4,
                                border: `2px solid ${statusConfig[node.attrs.status]?.color || "gray"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {/* Tiny visual indicator of status color */}
                        </div>
                        <Text size="xs" c="dimmed" fw={600} style={{ letterSpacing: "0.5px" }}>
                            {node.attrs.ticketId}
                        </Text>
                    </Group>

                    <Menu position="bottom-end" shadow="md">
                        <Menu.Target>
                            <ActionIcon variant="transparent" color="gray" size="sm" style={{ opacity: 0.6 }}>
                                <IconDots size={14} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item color="red" leftSection={<IconCircleXFilled size={14} />} onClick={() => props.deleteNode()}>
                                Delete Task
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>

                {/* Content Body */}
                <div style={{ padding: "4px 0 12px 0" }}>
                    <NodeViewContent
                        style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            lineHeight: "1.5",
                            color: "var(--mantine-color-text)",
                            outline: "none",
                        }}
                    />
                </div>

                {/* Compact Properties Footer */}
                <div style={{ borderTop: "1px solid var(--mantine-color-gray-2)", paddingTop: "8px" }}>
                    <Group gap="xs">
                        {/* Status */}
                        <Menu shadow="md" width={140}>
                            <Menu.Target>
                                <Button
                                    size="compact-xs"
                                    variant="subtle"
                                    color="gray"
                                    radius="sm"
                                    leftSection={<StatusIcon size={14} color={statusConfig[node.attrs.status]?.color || 'gray'} />}
                                    styles={{
                                        root: { height: 24, fontSize: 11, paddingLeft: 6, paddingRight: 6 },
                                        section: { marginRight: 6 }
                                    }}
                                >
                                    {node.attrs.status}
                                </Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                                {Object.entries(statusConfig).map(([key, config]: any) => (
                                    <Menu.Item
                                        key={key}
                                        leftSection={<config.icon size={14} />}
                                        onClick={() => updateAttributes({ status: key })}
                                        color={config.color}
                                        style={{ fontSize: 13 }}
                                    >
                                        {config.label}
                                    </Menu.Item>
                                ))}
                            </Menu.Dropdown>
                        </Menu>

                        {/* Priority */}
                        <Menu shadow="md" width={140}>
                            <Menu.Target>
                                <Tooltip label="Priority" openDelay={500}>
                                    <Button
                                        size="compact-xs"
                                        variant="subtle"
                                        color="gray"
                                        radius="sm"
                                        leftSection={<PriorityIcon size={14} color={priorityConfig[node.attrs.priority]?.color || 'gray'} />}
                                        styles={{
                                            root: { height: 24, fontSize: 11, paddingLeft: 6, paddingRight: 6 },
                                            section: { marginRight: 6 }
                                        }}
                                    >
                                        {node.attrs.priority}
                                    </Button>
                                </Tooltip>
                            </Menu.Target>
                            <Menu.Dropdown>
                                {Object.entries(priorityConfig).map(([key, config]: any) => (
                                    <Menu.Item
                                        key={key}
                                        leftSection={<config.icon size={14} />}
                                        onClick={() => updateAttributes({ priority: key })}
                                        color={config.color}
                                        style={{ fontSize: 13 }}
                                    >
                                        {config.label}
                                    </Menu.Item>
                                ))}
                            </Menu.Dropdown>
                        </Menu>

                        {/* Due Date (Mocked for visual) */}
                        <Button
                            size="compact-xs"
                            variant="subtle"
                            color={node.attrs.dueDate ? "blue" : "gray"}
                            radius="sm"
                            leftSection={<IconCalendar size={14} />}
                            title="Set Due Date (Visual Only)"
                            onClick={() => {
                                // Simple toggle logic for demo
                                const today = new Date().toLocaleDateString();
                                updateAttributes({ dueDate: node.attrs.dueDate ? null : today })
                            }}
                            styles={{
                                root: { height: 24, fontSize: 11, paddingLeft: 6, paddingRight: 6 },
                                section: { marginRight: 6 }
                            }}
                        >
                            {node.attrs.dueDate || "No Date"}
                        </Button>

                        {/* Assignee - Pushed to right */}
                        <div style={{ marginLeft: "auto" }}>
                            <Menu shadow="md" withArrow position="top-end">
                                <Menu.Target>
                                    <Group gap={4} style={{ cursor: "pointer" }}>
                                        {node.attrs.assignee && node.attrs.assignee !== "@Unassigned" ? (
                                            <Avatar size={20} radius="xl" color="blue" name={node.attrs.assignee.replace("@", "")} styles={{ root: { fontSize: 10 } }}>
                                                {node.attrs.assignee.replace("@", "").substring(0, 2).toUpperCase()}
                                            </Avatar>
                                        ) : (
                                            <ActionIcon size={20} radius="xl" variant="transparent" color="gray">
                                                <IconHelp size={14} />
                                            </ActionIcon>
                                        )}
                                    </Group>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Label>Assign To</Menu.Label>
                                    <Menu.Item onClick={() => updateAttributes({ assignee: "@Unassigned" })}>Unassigned</Menu.Item>
                                    <Menu.Item onClick={() => updateAttributes({ assignee: "@Me" })}>Me</Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </div>
                    </Group>
                </div>
            </Card>
        </NodeViewWrapper>
    );
};

export default TaskCardView;
