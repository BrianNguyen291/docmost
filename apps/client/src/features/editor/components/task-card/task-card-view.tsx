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
    IconHelp
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
                padding="md"
                style={{
                    transition: "all 0.2s ease",
                    cursor: "grab",
                }}
                className="hover:shadow-md hover:border-blue-400"
            >
                <Group justify="space-between" mb="xs">
                    <Group gap={6}>
                        <Badge
                            variant="light"
                            color="gray"
                            size="sm"
                            radius="sm"
                            leftSection={<IconTicket size={10} style={{ marginTop: 4 }} />}
                            styles={{ root: { textTransform: 'uppercase', letterSpacing: '0.5px' } }}
                        >
                            {node.attrs.ticketId}
                        </Badge>
                    </Group>

                    <Menu position="bottom-end" shadow="md">
                        <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" size="sm">
                                <IconDots size={16} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item color="red" onClick={() => props.deleteNode()}>
                                Delete Task
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>

                <div style={{ marginBottom: "12px" }}>
                    <Text size="10px" fw={700} c="dimmed" mb={4} tt="uppercase" style={{ letterSpacing: "0.5px" }}>
                        Description
                    </Text>
                    <NodeViewContent
                        style={{
                            minHeight: "40px",
                            fontSize: "14px",
                            lineHeight: "1.6",
                            color: "var(--mantine-color-text)",
                        }}
                    />
                </div>

                <div style={{ borderTop: "1px solid var(--mantine-color-gray-2)", marginBottom: "12px" }} />

                <Group gap="apart" align="center">
                    <Group gap="xs">
                        {/* Status Menu */}
                        <Menu shadow="md" width={140}>
                            <Menu.Target>
                                <Button
                                    size="xs"
                                    variant="light"
                                    color={statusConfig[node.attrs.status]?.color}
                                    radius="sm"
                                    leftSection={<StatusIcon size={14} />}
                                    styles={{ root: { height: 26, fontSize: 12 } }}
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
                                    >
                                        {config.label}
                                    </Menu.Item>
                                ))}
                            </Menu.Dropdown>
                        </Menu>

                        {/* Priority Menu */}
                        <Menu shadow="md" width={140}>
                            <Menu.Target>
                                <Tooltip label="Priority">
                                    <ActionIcon
                                        variant="light"
                                        color={priorityConfig[node.attrs.priority]?.color}
                                        size="sm"
                                        radius="sm"
                                        style={{ width: 26, height: 26 }}
                                    >
                                        <PriorityIcon size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>Priority</Menu.Label>
                                {Object.entries(priorityConfig).map(([key, config]: any) => (
                                    <Menu.Item
                                        key={key}
                                        leftSection={<config.icon size={14} />}
                                        onClick={() => updateAttributes({ priority: key })}
                                        color={config.color}
                                    >
                                        {config.label}
                                    </Menu.Item>
                                ))}
                            </Menu.Dropdown>
                        </Menu>
                    </Group>

                    {/* Assignee */}
                    <Menu shadow="md" withArrow>
                        <Menu.Target>
                            <Group gap={6} style={{ cursor: "pointer" }}>
                                {node.attrs.assignee ? (
                                    <Avatar size={24} radius="xl" color="blue" name={node.attrs.assignee.replace("@", "")}>
                                        {node.attrs.assignee.replace("@", "").substring(0, 2).toUpperCase()}
                                    </Avatar>
                                ) : (
                                    <Avatar size={24} radius="xl" color="gray"><IconHelp size={14} /></Avatar>
                                )}
                            </Group>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Label>Assign To</Menu.Label>
                            <Menu.Item onClick={() => updateAttributes({ assignee: "@Unassigned" })}>Unassigned</Menu.Item>
                            <Menu.Item onClick={() => updateAttributes({ assignee: "@Me" })}>Me</Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </Card>
        </NodeViewWrapper>
    );
};

export default TaskCardView;
