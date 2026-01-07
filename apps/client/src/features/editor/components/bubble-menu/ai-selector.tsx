import { FC, useState } from "react";
import {
    ActionIcon,
    Menu,
    rem,
    Tooltip,
    Loader,
    Text,
    Stack,
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
    const { startStream, isStreaming, content, resetContent } = useAiStream();
    const [showResult, setShowResult] = useState(false);

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

        setShowResult(true);
        resetContent();

        await startStream({
            action,
            content: selectedText,
        });
    };

    const handleInsert = () => {
        if (!editor || !content) return;

        const { from, to } = editor.state.selection;
        editor.chain().focus().deleteRange({ from, to }).insertContent(content).run();

        setShowResult(false);
        resetContent();
        setIsOpen(false);
    };

    const handleReplace = () => {
        handleInsert();
    };

    const handleCancel = () => {
        setShowResult(false);
        resetContent();
        setIsOpen(false);
    };

    if (showResult) {
        return (
            <Stack gap="xs" p="sm" style={{ maxWidth: 400, maxHeight: 300, overflow: "auto" }}>
                {isStreaming ? (
                    <Stack align="center" gap="xs">
                        <Loader size="sm" />
                        <Text size="sm" c="dimmed">{t("ai.generating", "Generating...")}</Text>
                    </Stack>
                ) : null}
                {content && (
                    <>
                        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                            {content}
                        </Text>
                        <Menu.Divider />
                        <Stack gap="xs" justify="flex-end" style={{ flexDirection: "row" }}>
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                onClick={handleCancel}
                                disabled={isStreaming}
                            >
                                ✕
                            </ActionIcon>
                            <ActionIcon
                                variant="filled"
                                color="blue"
                                onClick={handleReplace}
                                disabled={isStreaming || !content}
                            >
                                ✓
                            </ActionIcon>
                        </Stack>
                    </>
                )}
            </Stack>
        );
    }

    return (
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
                        disabled={isStreaming}
                    >
                        {item.label}
                    </Menu.Item>
                ))}
            </Menu.Dropdown>
        </Menu>
    );
};
