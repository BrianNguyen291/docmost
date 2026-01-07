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
    async generateStream(
        @Body() dto: AiGenerateDto,
        @Res() res: Response,
    ): Promise<void> {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        try {
            for await (const chunk of this.aiService.generateStream(dto)) {
                if ('error' in chunk) {
                    res.write(`data: ${JSON.stringify({ error: chunk.error })}\n\n`);
                    break;
                } else {
                    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                }
            }
            res.write('data: [DONE]\n\n');
        } catch (error) {
            res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
        } finally {
            res.end();
        }
    }

    @Get('config')
    async getConfig(): Promise<{ configured: boolean; availableActions: AiAction[] }> {
        return {
            configured: this.aiService.isConfigured(),
            availableActions: this.aiService.getAvailableActions(),
        };
    }
}
