import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum AiAction {
    IMPROVE_WRITING = 'improve_writing',
    FIX_SPELLING_GRAMMAR = 'fix_spelling_grammar',
    MAKE_SHORTER = 'make_shorter',
    MAKE_LONGER = 'make_longer',
    SIMPLIFY = 'simplify',
    CHANGE_TONE = 'change_tone',
    SUMMARIZE = 'summarize',
    CONTINUE_WRITING = 'continue_writing',
    TRANSLATE = 'translate',
    TO_CHECKLIST = 'to_checklist',
    CUSTOM = 'custom',
}

export class AiGenerateDto {
    @IsOptional()
    @IsEnum(AiAction)
    action?: AiAction;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    prompt?: string;

    @IsOptional()
    @IsString()
    targetLanguage?: string;

    @IsOptional()
    @IsString()
    tone?: string;
}

export interface AiContentResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
