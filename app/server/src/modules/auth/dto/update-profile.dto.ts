import { IsString, IsOptional } from 'class-validator';

/**
 * 更新用户资料DTO
 */
export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    name?: string;
}
