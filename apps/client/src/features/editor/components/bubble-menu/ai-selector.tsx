import { FC, useState } from "react";
import {
    ActionIcon,
    Menu,
    rem,
    Tooltip,
    Loader,
    Text,
    Stack,
    Modal,
    Button,
    Group,
    ScrollArea,
} from "@mantine/core";
import {
    IconSparkles,
    IconWand,
    IconAbc,
    IconArrowsMinimize,
    IconArrowsMaximize,
    IconLanguage,
    IconListDetails,
    IconWriting,
    IconMessage,
    IconCheck,
    IconX,
} from "@tabler/icons-react";
import { useEditor } from "@tiptap/react";
import { useAiStream } from "@/ee/ai/hooks/use-ai.ts";
import { AiAction } from "@/ee/ai/types/ai.types.ts";
import { useTranslation } from "react-i18next";

interface AiSelectorProps {
    editor: ReturnType<typeof useEditor>;
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
}

interface AiMenuItem {
    label: string;
    action: AiAction;
    icon: typeof IconWand;
    description?: string;
}

export const AiSelector: FC<AiSelectorProps> = ({
    editor,
    isOpen,
    setIsOpen,
}) => {
    const { t } = useTranslation();
    const { startStream, isStreaming, content, resetContent, stopStream } = useAiStream();
    const [showResultModal, setShowResultModal] = useState(false);
    const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);

    const aiMenuItems: AiMenuItem[] = [
        {
            label: t("ai.improveWriting", "Improve writing"),
            action: AiAction.IMPROVE_WRITING,
            icon: IconWand,
        },
        {
            label: t("ai.fixSpelling", "Fix spelling & grammar"),
            action: AiAction.FIX_SPELLING_GRAMMAR,
            icon: IconAbc,
        },
        {
            label: t("ai.makeShorter", "Make shorter"),
            action: AiAction.MAKE_SHORTER,
            icon: IconArrowsMinimize,
        },
        {
            label: t("ai.makeLonger", "Make longer"),
            action: AiAction.MAKE_LONGER,
            icon: IconArrowsMaximize,
        },
        {
            label: t("ai.simplify", "Simplify"),
            action: AiAction.SIMPLIFY,
            icon: IconMessage,
        },
        {
            label: t("ai.summarize", "Summarize"),
            action: AiAction.SUMMARIZE,
            icon: IconListDetails,
        },
        {
            label: t("ai.continueWriting", "Continue writing"),
            action: AiAction.CONTINUE_WRITING,
            icon: IconWriting,
        },
        {
            label: t("ai.translate", "Translate"),
            action: AiAction.TRANSLATE,
            icon: IconLanguage,
        },
    ];

    const handleAiAction = async (action: AiAction) => {
        if (!editor) return;

        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, " ");

        if (!selectedText.trim()) return;

        setSelectionRange({ from, to });
        setShowResultModal(true);
        setIsOpen(false);
        resetContent();

        await startStream({
            action,
            content: selectedText,
        });
    };

    const handleReplace = () => {
        if (!editor || !content || !selectionRange) return;

        const { from, to } = selectionRange;
        editor.chain().focus().deleteRange({ from, to }).insertContent(content).run();

        handleClose();
    };

    const handleClose = () => {
        if (isStreaming) {
            stopStream();
        }
        setShowResultModal(false);
        resetContent();
        setSelectionRange(null);
    };

    return (
        <>
            <Menu opened={isOpen} onChange={setIsOpen} position="bottom-start" withinPortal>
                <Menu.Target>
                    <Tooltip label={t("ai.aiAssistant", "AI Assistant")} withArrow>
                        <ActionIcon
                            variant="default"
                            size="lg"
                            radius="0"
                            style={{ border: "none" }}
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            <IconSparkles style={{ width: rem(16) }} stroke={2} />
                        </ActionIcon>
                    </Tooltip>
                </Menu.Target>

                <Menu.Dropdown>
                    <Menu.Label>{t("ai.aiActions", "AI Actions")}</Menu.Label>
                    {aiMenuItems.map((item) => (
                        <Menu.Item
                            key={item.action}
                            leftSection={<item.icon style={{ width: rem(14) }} stroke={1.5} />}
                            onClick={() => handleAiAction(item.action)}
                        >
                            {item.label}
                        </Menu.Item>
                    ))}
                </Menu.Dropdown>
            </Menu>

            <Modal
                opened={showResultModal}
                onClose={handleClose}
                title={t("ai.aiResult", "AI Result")}
                size="md"
                centered
            >
                <Stack gap="md">
                    {isStreaming && !content && (
                        <Stack align="center" gap="xs" py="lg">
                            <Loader size="md" />
                            <Text size="sm" c="dimmed">{t("ai.generating", "Generating...")}</Text>
                        </Stack>
                    )}

                    {content && (
                        <ScrollArea h={250}>
                            <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                                {content}
                            </Text>
                            {isStreaming && <Loader size="xs" mt="xs" />}
                        </ScrollArea>
                    )}

                    <Group justify="flex-end" gap="sm">
                        <Button
                            variant="subtle"
                            color="gray"
                            leftSection={<IconX size={16} />}
                            onClick={handleClose}
                        >
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            variant="filled"
                            color="blue"
                            leftSection={<IconCheck size={16} />}
                            onClick={handleReplace}
                            disabled={isStreaming || !content}
                        >
                            {t("ai.replace", "Replace")}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
};
