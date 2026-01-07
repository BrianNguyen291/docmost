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
import { FastifyReply } from 'fastify';
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
        @Res() res: FastifyReply,
    ): Promise<void> {
        // Validate that AI is configured before starting stream
        if (!this.aiService.isConfigured()) {
            res.status(400).send({
                error: 'AI is not configured. Please set AI_DRIVER and required API keys.'
            });
            return;
        }

        res.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        });

        try {
            await this.aiService.streamToResponse(dto, res.raw);
            res.raw.write('data: [DONE]\n\n');
        } catch (error) {
            const errorMessage = (error as Error).message || 'Unknown error occurred';
            console.error('AI Stream Error:', errorMessage, error);
            res.raw.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        } finally {
            res.raw.end();
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

