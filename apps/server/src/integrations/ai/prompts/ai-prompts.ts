import { AiAction } from '../dto/ai-generate.dto';

export const AI_PROMPTS: Record<AiAction, string> = {
    [AiAction.IMPROVE_WRITING]: `You are an expert writing assistant. Improve the following text to make it clearer, more engaging, and well-structured while maintaining the original meaning. Keep the same language as the input.

Text to improve:
{content}

Provide only the improved text without any explanations or comments.`,

    [AiAction.FIX_SPELLING_GRAMMAR]: `You are an expert editor. Fix all spelling, grammar, and punctuation errors in the following text. Keep the same language as the input.

Text to fix:
{content}

Provide only the corrected text without any explanations or comments.`,

    [AiAction.MAKE_SHORTER]: `You are an expert editor. Condense the following text to be more concise while preserving the key information and meaning. Keep the same language as the input.

Text to shorten:
{content}

Provide only the shortened text without any explanations or comments.`,

    [AiAction.MAKE_LONGER]: `You are an expert writer. Expand the following text with more details, examples, and explanations while maintaining the same meaning and style. Keep the same language as the input.

Text to expand:
{content}

Provide only the expanded text without any explanations or comments.`,

    [AiAction.SIMPLIFY]: `You are an expert at simplifying complex content. Rewrite the following text in simpler terms that anyone can understand. Keep the same language as the input.

Text to simplify:
{content}

Provide only the simplified text without any explanations or comments.`,

    [AiAction.CHANGE_TONE]: `You are an expert writer. Rewrite the following text with a {tone} tone. Keep the same language as the input.

Text to rewrite:
{content}

Provide only the rewritten text without any explanations or comments.`,

    [AiAction.SUMMARIZE]: `You are an expert at summarizing content. Create a clear and concise summary of the following text that captures the main points. Keep the same language as the input.

Text to summarize:
{content}

Provide only the summary without any explanations or comments.`,

    [AiAction.CONTINUE_WRITING]: `You are an expert writer. Continue writing from where the following text ends, matching the same style, tone, and context. Keep the same language as the input.

Text to continue:
{content}

Provide only the continuation without any explanations or comments.`,

    [AiAction.TRANSLATE]: `You are an expert translator. Translate the following text into {targetLanguage}. Maintain the original meaning, tone, and style.

Text to translate:
{content}

Provide only the translation without any explanations or comments.`,

    [AiAction.CUSTOM]: `{prompt}

Content:
{content}

Provide your response without any explanations or meta-comments.`,
};

export function getPromptForAction(
    action: AiAction,
    content: string,
    options?: { prompt?: string; targetLanguage?: string; tone?: string },
): string {
    let prompt = AI_PROMPTS[action];

    prompt = prompt.replace('{content}', content);

    if (options?.prompt) {
        prompt = prompt.replace('{prompt}', options.prompt);
    }

    if (options?.targetLanguage) {
        prompt = prompt.replace('{targetLanguage}', options.targetLanguage);
    }

    if (options?.tone) {
        prompt = prompt.replace('{tone}', options.tone);
    }

    return prompt;
}
