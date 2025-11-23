import { IsString, MinLength } from 'class-validator';

/**
 * 修改密码DTO
 */
export class ChangePasswordDto {
    @IsString()
    oldPassword: string;

    @IsString()
    @MinLength(6, { message: '新密码至少需要6个字符' })
    newPassword: string;
}
