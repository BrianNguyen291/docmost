import {
    Injectable,
    Logger,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { EnvironmentService } from '../environment/environment.service';
import {
    AiAction,
    AiGenerateDto,
    AiContentResponse,
} from './dto/ai-generate.dto';
import { getPromptForAction } from './prompts/ai-prompts';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    constructor(private readonly environmentService: EnvironmentService) { }

    async generate(dto: AiGenerateDto): Promise<AiContentResponse> {
        const action = dto.action || AiAction.CUSTOM;
        const prompt = getPromptForAction(action, dto.content, {
            prompt: dto.prompt,
            targetLanguage: dto.targetLanguage,
            tone: dto.tone,
        });

        const driver = this.environmentService.getAiDriver()?.toLowerCase();

        if (!driver) {
            throw new BadRequestException(
                'AI is not configured. Please set AI_DRIVER environment variable.',
            );
        }

        try {
            switch (driver) {
                case 'openai':
                    return await this.generateWithOpenAI(prompt);
                case 'gemini':
                    return await this.generateWithGemini(prompt);
                case 'ollama':
                    return await this.generateWithOllama(prompt);
                default:
                    throw new BadRequestException(`Unsupported AI driver: ${driver}`);
            }
        } catch (error) {
            const err = error as Error;
            this.logger.error(`AI generation error: ${err.message}`, err.stack);
            if (
                error instanceof BadRequestException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }
            throw new InternalServerErrorException(
                `Failed to generate AI content: ${err.message}`,
            );
        }
    }

    async *generateStream(
        dto: AiGenerateDto,
    ): AsyncGenerator<{ content: string } | { error: string }> {
        const action = dto.action || AiAction.CUSTOM;
        const prompt = getPromptForAction(action, dto.content, {
            prompt: dto.prompt,
            targetLanguage: dto.targetLanguage,
            tone: dto.tone,
        });

        const driver = this.environmentService.getAiDriver()?.toLowerCase();

        if (!driver) {
            yield { error: 'AI is not configured. Please set AI_DRIVER environment variable.' };
            return;
        }

        try {
            switch (driver) {
                case 'openai':
                    yield* this.streamWithOpenAI(prompt);
                    break;
                case 'gemini':
                    yield* this.streamWithGemini(prompt);
                    break;
                case 'ollama':
                    yield* this.streamWithOllama(prompt);
                    break;
                default:
                    yield { error: `Unsupported AI driver: ${driver}` };
            }
        } catch (error) {
            const err = error as Error;
            this.logger.error(`AI stream error: ${err.message}`, err.stack);
            yield { error: err.message };
        }
    }

    async streamToResponse(dto: AiGenerateDto, res: { write: (data: string) => void }): Promise<void> {
        const action = dto.action || AiAction.CUSTOM;
        const prompt = getPromptForAction(action, dto.content, {
            prompt: dto.prompt,
            targetLanguage: dto.targetLanguage,
            tone: dto.tone,
        });

        const driver = this.environmentService.getAiDriver()?.toLowerCase();

        if (!driver) {
            res.write(`data: ${JSON.stringify({ error: 'AI is not configured' })}\n\n`);
            return;
        }

        switch (driver) {
            case 'openai':
                await this.streamOpenAIToResponse(prompt, res);
                break;
            case 'gemini':
                await this.streamGeminiToResponse(prompt, res);
                break;
            case 'ollama':
                await this.streamOllamaToResponse(prompt, res);
                break;
            default:
                res.write(`data: ${JSON.stringify({ error: `Unsupported AI driver: ${driver}` })}\n\n`);
        }
    }

    private async streamOpenAIToResponse(prompt: string, res: { write: (data: string) => void }): Promise<void> {
        const apiKey = this.environmentService.getOpenAiApiKey();
        if (!apiKey) {
            res.write(`data: ${JSON.stringify({ error: 'OpenAI API key is not configured' })}\n\n`);
            return;
        }

        const apiUrl = this.environmentService.getOpenAiApiUrl() || 'https://api.openai.com/v1';
        const model = this.environmentService.getAiCompletionModel() || 'gpt-4o-mini';

        const response = await fetch(`${apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 4096,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`OpenAI API error: ${errorText}`);
            res.write(`data: ${JSON.stringify({ error: `OpenAI API error: ${response.status}` })}\n\n`);
            return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
            res.write(`data: ${JSON.stringify({ error: 'Failed to get response stream' })}\n\n`);
            return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') return;
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content;
                            if (content) {
                                res.write(`data: ${JSON.stringify({ content })}\n\n`);
                            }
                        } catch {
                            // Ignore parse errors
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    private async streamGeminiToResponse(prompt: string, res: { write: (data: string) => void }): Promise<void> {
        const apiKey = this.environmentService.getGeminiApiKey();
        if (!apiKey) {
            res.write(`data: ${JSON.stringify({ error: 'Gemini API key is not configured' })}\n\n`);
            return;
        }

        const model = this.environmentService.getAiCompletionModel() || 'gemini-1.5-flash';

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`Gemini API error: ${errorText}`);
            res.write(`data: ${JSON.stringify({ error: `Gemini API error: ${response.status}` })}\n\n`);
            return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
            res.write(`data: ${JSON.stringify({ error: 'Failed to get response stream' })}\n\n`);
            return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (content) {
                                res.write(`data: ${JSON.stringify({ content })}\n\n`);
                            }
                        } catch {
                            // Ignore parse errors
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    private async streamOllamaToResponse(prompt: string, res: { write: (data: string) => void }): Promise<void> {
        const apiUrl = this.environmentService.getOllamaApiUrl();
        const model = this.environmentService.getAiCompletionModel() || 'llama3.2';

        const response = await fetch(`${apiUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt, stream: true }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`Ollama API error: ${errorText}`);
            res.write(`data: ${JSON.stringify({ error: `Ollama API error: ${response.status}` })}\n\n`);
            return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
            res.write(`data: ${JSON.stringify({ error: 'Failed to get response stream' })}\n\n`);
            return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.response) {
                                res.write(`data: ${JSON.stringify({ content: parsed.response })}\n\n`);
                            }
                        } catch {
                            // Ignore parse errors
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }


    private async generateWithOpenAI(prompt: string): Promise<AiContentResponse> {
        const apiKey = this.environmentService.getOpenAiApiKey();
        if (!apiKey) {
            throw new BadRequestException('OpenAI API key is not configured.');
        }

        const apiUrl =
            this.environmentService.getOpenAiApiUrl() ||
            'https://api.openai.com/v1';
        const model =
            this.environmentService.getAiCompletionModel() || 'gpt-4o-mini';

        const response = await fetch(`${apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 4096,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new InternalServerErrorException(`OpenAI API error: ${error}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || '',
            usage: data.usage
                ? {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens,
                }
                : undefined,
        };
    }

    private async *streamWithOpenAI(
        prompt: string,
    ): AsyncGenerator<{ content: string } | { error: string }> {
        const apiKey = this.environmentService.getOpenAiApiKey();
        if (!apiKey) {
            yield { error: 'OpenAI API key is not configured.' };
            return;
        }

        const apiUrl =
            this.environmentService.getOpenAiApiUrl() ||
            'https://api.openai.com/v1';
        const model =
            this.environmentService.getAiCompletionModel() || 'gpt-4o-mini';

        const response = await fetch(`${apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 4096,
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            yield { error: `OpenAI API error: ${error}` };
            return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
            yield { error: 'Failed to get response stream' };
            return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') return;
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content;
                            if (content) {
                                yield { content };
                            }
                        } catch {
                            // Ignore parse errors for incomplete chunks
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    private async generateWithGemini(prompt: string): Promise<AiContentResponse> {
        const apiKey = this.environmentService.getGeminiApiKey();
        if (!apiKey) {
            throw new BadRequestException('Gemini API key is not configured.');
        }

        const model =
            this.environmentService.getAiCompletionModel() || 'gemini-1.5-flash';

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            },
        );

        if (!response.ok) {
            const error = await response.text();
            throw new InternalServerErrorException(`Gemini API error: ${error}`);
        }

        const data = await response.json();
        const content =
            data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const usageMetadata = data.usageMetadata;

        return {
            content,
            usage: usageMetadata
                ? {
                    promptTokens: usageMetadata.promptTokenCount || 0,
                    completionTokens: usageMetadata.candidatesTokenCount || 0,
                    totalTokens: usageMetadata.totalTokenCount || 0,
                }
                : undefined,
        };
    }

    private async *streamWithGemini(
        prompt: string,
    ): AsyncGenerator<{ content: string } | { error: string }> {
        const apiKey = this.environmentService.getGeminiApiKey();
        if (!apiKey) {
            yield { error: 'Gemini API key is not configured.' };
            return;
        }

        const model =
            this.environmentService.getAiCompletionModel() || 'gemini-1.5-flash';

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            },
        );

        if (!response.ok) {
            const error = await response.text();
            yield { error: `Gemini API error: ${error}` };
            return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
            yield { error: 'Failed to get response stream' };
            return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (content) {
                                yield { content };
                            }
                        } catch {
                            // Ignore parse errors for incomplete chunks
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    private async generateWithOllama(prompt: string): Promise<AiContentResponse> {
        const apiUrl = this.environmentService.getOllamaApiUrl();
        const model =
            this.environmentService.getAiCompletionModel() || 'llama3.2';

        const response = await fetch(`${apiUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                prompt,
                stream: false,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new InternalServerErrorException(`Ollama API error: ${error}`);
        }

        const data = await response.json();
        return {
            content: data.response || '',
        };
    }

    private async *streamWithOllama(
        prompt: string,
    ): AsyncGenerator<{ content: string } | { error: string }> {
        const apiUrl = this.environmentService.getOllamaApiUrl();
        const model =
            this.environmentService.getAiCompletionModel() || 'llama3.2';

        const response = await fetch(`${apiUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                prompt,
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            yield { error: `Ollama API error: ${error}` };
            return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
            yield { error: 'Failed to get response stream' };
            return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.response) {
                                yield { content: parsed.response };
                            }
                        } catch {
                            // Ignore parse errors for incomplete chunks
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    isConfigured(): boolean {
        const driver = this.environmentService.getAiDriver()?.toLowerCase();
        if (!driver) return false;

        switch (driver) {
            case 'openai':
                return !!this.environmentService.getOpenAiApiKey();
            case 'gemini':
                return !!this.environmentService.getGeminiApiKey();
            case 'ollama':
                return !!this.environmentService.getOllamaApiUrl();
            default:
                return false;
        }
    }

    getAvailableActions(): AiAction[] {
        return Object.values(AiAction);
    }

    getDebugInfo(): { driver?: string; hasApiKey: boolean } {
        const driver = this.environmentService.getAiDriver()?.toLowerCase();

        let hasApiKey = false;
        if (driver) {
            switch (driver) {
                case 'openai':
                    hasApiKey = !!this.environmentService.getOpenAiApiKey();
                    break;
                case 'gemini':
                    hasApiKey = !!this.environmentService.getGeminiApiKey();
                    break;
                case 'ollama':
                    hasApiKey = !!this.environmentService.getOllamaApiUrl();
                    break;
            }
        }

        return {
            driver: driver || undefined,
            hasApiKey,
        };
    }
}
