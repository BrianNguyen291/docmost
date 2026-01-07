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
    IconCalendar,
    IconExternalLink,
    IconFilePlus
} from "@tabler/icons-react";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCreatePageMutation } from "@/features/page/queries/page-query";
import { buildPageUrl } from "@/features/page/page.utils";
import { queryClient } from "@/main";
import { IPage } from "@/features/page/types/page.types";
import { extractPageSlugId } from "@/lib";
import { notifications } from "@mantine/notifications";

const TaskCardView = (props: any) => {
    const { node, updateAttributes, editor } = props;
    const navigate = useNavigate();
    const { pageSlug, spaceSlug } = useParams();

    // Get context from editor storage or params
    const slugId = editor.storage.slugId || extractPageSlugId(pageSlug);
    const parentPageId = editor.storage.pageId;

    const createPage = useCreatePageMutation();

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

    const handleOpenDetails = () => {
        if (node.attrs.linkedPageId && node.attrs.linkedPageSlugId) {
            const url = buildPageUrl(spaceSlug, node.attrs.linkedPageSlugId, node.attrs.linkedPageTitle || "Details");
            navigate(url);
            return;
        }

        // Retrieve spaceId from query cache using slugId
        const pageData = queryClient.getQueryData<IPage>(["pages", slugId]);
        const spaceId = pageData?.spaceId;

        if (!spaceId) {
            notifications.show({
                message: "Unable to determine space context. Please refresh and try again.",
                color: "red"
            });
            return;
        }

        // Create new page
        // We'll use the task content as title, or a default.
        const title = node.textContent || `Task ${node.attrs.ticketId}`;

        createPage.mutate({
            title: title,
            parentPageId: parentPageId,
            // spaceId is inferred from parentPageId by the backend when creating a subpage?
            // If not, we might need to find a way to get it. 
            // Most "create subpage" flows just need parentId.
            spaceId,
        } as any, {
            onSuccess: (newPage) => {
                updateAttributes({
                    linkedPageId: newPage.id,
                    linkedPageSlugId: newPage.slugId,
                    linkedPageTitle: newPage.title
                });
                const url = buildPageUrl(spaceSlug, newPage.slugId, newPage.title);
                navigate(url);
            }
        });
    };

    return (
        <NodeViewWrapper className="task-card-wrapper" style={{ margin: "6px 0" }}>
            <Card
                withBorder
                shadow="sm"
                radius="md"
                padding="xs"
                style={{
                    backgroundColor: "var(--mantine-color-body)",
                    cursor: "default",
                    transition: "all 0.2s ease",
                }}
                className="hover:shadow-md hover:border-blue-300"
            >
                {/* Main Content (Title-like) */}
                <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                        <NodeViewContent
                            style={{
                                fontSize: "14px",
                                fontWeight: 500,
                                lineHeight: "1.4",
                                color: "var(--mantine-color-text)",
                                outline: "none",
                            }}
                        />
                    </div>
                    <Tooltip label={node.attrs.linkedPageId ? "Open Details Page" : "Add Details Page"}>
                        <ActionIcon
                            size="xs"
                            variant="transparent"
                            color={node.attrs.linkedPageId ? "blue" : "gray"}
                            onClick={handleOpenDetails}
                            loading={createPage.isPending}
                            style={{ opacity: node.attrs.linkedPageId ? 1 : 0.4 }}
                        >
                            {node.attrs.linkedPageId ? <IconExternalLink size={14} /> : <IconFilePlus size={14} />}
                        </ActionIcon>
                    </Tooltip>
                </div>

                {/* Compact Metadata Footer */}
                <Group justify="space-between" align="center" gap={0}>
                    <Group gap="xs">
                        {/* ID */}
                        <Text size="10px" c="dimmed" fw={600} style={{ letterSpacing: "0.5px" }}>
                            {node.attrs.ticketId}
                        </Text>

                        {/* Status Menu */}
                        <Menu shadow="md" width={140} position="bottom-start">
                            <Menu.Target>
                                <Badge
                                    size="xs"
                                    variant="light"
                                    color={statusConfig[node.attrs.status]?.color}
                                    style={{ cursor: "pointer", paddingLeft: 6, paddingRight: 6, textTransform: 'none' }}
                                    leftSection={<StatusIcon size={10} style={{ marginTop: 2 }} />}
                                >
                                    {node.attrs.status}
                                </Badge>
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

                        {/* Priority Menu (Icon only) */}
                        <Menu shadow="md" position="bottom-start">
                            <Menu.Target>
                                <Tooltip label={`Priority: ${node.attrs.priority}`} openDelay={500}>
                                    <ActionIcon
                                        size="xs"
                                        variant="subtle"
                                        color={priorityConfig[node.attrs.priority]?.color}
                                        radius="sm"
                                    >
                                        <PriorityIcon size={14} />
                                    </ActionIcon>
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
                    </Group>

                    {/* Right Side: Options & Assignee */}
                    <Group gap={4}>
                        {/* Assignee */}
                        <Menu shadow="md" withArrow position="top-end">
                            <Menu.Target>
                                <div style={{ cursor: "pointer" }}>
                                    {node.attrs.assignee && node.attrs.assignee !== "@Unassigned" ? (
                                        <Avatar size={18} radius="xl" color="blue" name={node.attrs.assignee.replace("@", "")} styles={{ root: { fontSize: 9 } }}>
                                            {node.attrs.assignee.replace("@", "").substring(0, 2).toUpperCase()}
                                        </Avatar>
                                    ) : (
                                        <ActionIcon size="xs" variant="transparent" color="gray" style={{ opacity: 0.5 }}>
                                            <IconHelp size={14} />
                                        </ActionIcon>
                                    )}
                                </div>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>Assign To</Menu.Label>
                                <Menu.Item onClick={() => updateAttributes({ assignee: "@Unassigned" })}>Unassigned</Menu.Item>
                                <Menu.Item onClick={() => updateAttributes({ assignee: "@Me" })}>Me</Menu.Item>
                            </Menu.Dropdown>
                        </Menu>

                        {/* Card Actions */}
                        <Menu position="bottom-end" shadow="md">
                            <Menu.Target>
                                <ActionIcon variant="transparent" color="gray" size="xs" style={{ opacity: 0.5 }}>
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
                </Group>
            </Card>
        </NodeViewWrapper>
    );
};

export default TaskCardView;
