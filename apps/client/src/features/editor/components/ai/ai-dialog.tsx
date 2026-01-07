import { FC, useState, useEffect } from "react";
import {
    Modal,
    TextInput,
    Button,
    Stack,
    Group,
    ScrollArea,
    TypographyStylesProvider,
    Loader,
    ActionIcon,
    Text,
} from "@mantine/core";
import { IconSparkles, IconSend, IconX, IconCheck } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { aiModalOpenedAtom, aiModalInitialPromptAtom } from "@/features/editor/atoms/ai-atoms";
import { useAiStream } from "@/ee/ai/hooks/use-ai.ts";
import { AiAction } from "@/ee/ai/types/ai.types.ts";
import { useTranslation } from "react-i18next";
import { markdownToHtml } from "@docmost/editor-ext";
import DOMPurify from "dompurify";
import { useEditorState } from "@tiptap/react";
import { pageEditorAtom } from "@/features/editor/atoms/editor-atoms";

export const AiDialog: FC = () => {
    const { t } = useTranslation();
    const [opened, setOpened] = useAtom(aiModalOpenedAtom);
    const [initialPrompt, setInitialPrompt] = useAtom(aiModalInitialPromptAtom);
    const [editor] = useAtom(pageEditorAtom);

    const [prompt, setPrompt] = useState("");
    const { startStream, isStreaming, content, resetContent, stopStream } = useAiStream();
    const [parsedHtml, setParsedHtml] = useState<string>("");

    useEffect(() => {
        if (content) {
            Promise.resolve(markdownToHtml(content)).then((html) => {
                setParsedHtml(html);
            });
        } else {
            setParsedHtml("");
        }
    }, [content]);

    useEffect(() => {
        const handleOpenModal = (event: any) => {
            setOpened(true);
            if (event.detail?.prompt) {
                setPrompt(event.detail.prompt);
            }
        };

        window.addEventListener("OPEN_AI_MODAL", handleOpenModal);
        return () => window.removeEventListener("OPEN_AI_MODAL", handleOpenModal);
    }, []);

    useEffect(() => {
        if (opened && initialPrompt) {
            setPrompt(initialPrompt);
            setInitialPrompt("");
        }
    }, [opened, initialPrompt]);

    const handleSend = async () => {
        if (!prompt.trim() || isStreaming) return;

        resetContent();
        await startStream({
            action: AiAction.CUSTOM,
            prompt: prompt,
            content: "", // No selection text in this mode
        });
    };

    const handleInsert = () => {
        if (!editor || !content) return;

        const html = markdownToHtml(content) as string;
        editor.chain().focus().insertContent(html).run();
        handleClose();
    };

    const handleClose = () => {
        if (isStreaming) {
            stopStream();
        }
        setOpened(false);
        setPrompt("");
        resetContent();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Group gap="xs">
                    <IconSparkles size={18} color="var(--mantine-color-blue-6)" />
                    <span style={{ fontWeight: 600 }}>{t("ai.askAi", "Ask AI")}</span>
                </Group>
            }
            size="xl"
            centered
        >
            <Stack gap="md">
                <TextInput
                    placeholder={t("ai.askPromptPlaceholder", "Ask AI to write something...")}
                    value={prompt}
                    onChange={(e) => setPrompt(e.currentTarget.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    rightSection={
                        <ActionIcon
                            onClick={handleSend}
                            loading={isStreaming}
                            disabled={!prompt.trim()}
                            color="blue"
                            variant="subtle"
                        >
                            <IconSend size={18} />
                        </ActionIcon>
                    }
                    disabled={isStreaming}
                    autoFocus
                />

                {(isStreaming || content) && (
                    <ScrollArea.Autosize
                        mah="60vh"
                        type="auto"
                        offsetScrollbars
                        style={{
                            border: "1px solid var(--mantine-color-gray-3)",
                            borderRadius: "var(--mantine-radius-md)",
                            padding: "16px",
                            backgroundColor: "var(--mantine-color-gray-0)",
                            boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)"
                        }}
                    >
                        {isStreaming && !content && (
                            <Group justify="center" p="xl">
                                <Stack align="center" gap="xs">
                                    <Loader size="sm" variant="dots" />
                                    <Text size="xs" c="dimmed">{t("ai.thinking", "Thinking...")}</Text>
                                </Stack>
                            </Group>
                        )}
                        {(content || parsedHtml) && (
                            <TypographyStylesProvider>
                                <div
                                    style={{ fontSize: "0.95rem", lineHeight: 1.6 }}
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(parsedHtml),
                                    }}
                                />
                            </TypographyStylesProvider>
                        )}
                        {isStreaming && content && <Loader size="xs" mt="md" variant="dots" color="blue" />}
                    </ScrollArea.Autosize>
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
                        onClick={handleInsert}
                        disabled={isStreaming || !content}
                    >
                        {t("ai.insert", "Insert")}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};
