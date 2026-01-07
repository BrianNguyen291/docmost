import {
    Controller,
    Post,
    Body,
    Get,
    Res,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AiService } from './ai.service';
import { AiGenerateDto, AiContentResponse, AiAction } from './dto/ai-generate.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('generate')
    @HttpCode(HttpStatus.OK)
    async generate(@Body() dto: AiGenerateDto): Promise<AiContentResponse> {
        return this.aiService.generate(dto);
    }

    @Post('generate/stream')
    @SkipTransform()
    async generateStream(
        @Body() dto: AiGenerateDto,
        @Res() res: Response,
    ): Promise<void> {
        // Validate that AI is configured before starting stream
        if (!this.aiService.isConfigured()) {
            res.status(400).json({
                error: 'AI is not configured. Please set AI_DRIVER and required API keys.'
            });
            return;
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
        res.flushHeaders();

        try {
            await this.aiService.streamToResponse(dto, res);
            res.write('data: [DONE]\n\n');
        } catch (error) {
            const errorMessage = (error as Error).message || 'Unknown error occurred';
            console.error('AI Stream Error:', errorMessage, error);
            res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        } finally {
            res.end();
        }
    }

    @Get('config')
    async getConfig(): Promise<{
        configured: boolean;
        availableActions: AiAction[];
        driver?: string;
        hasApiKey?: boolean;
    }> {
        const configured = this.aiService.isConfigured();
        const debugInfo = this.aiService.getDebugInfo();

        return {
            configured,
            availableActions: this.aiService.getAvailableActions(),
            driver: debugInfo.driver,
            hasApiKey: debugInfo.hasApiKey,
        };
    }
}
