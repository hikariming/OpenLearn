import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

/**
 * 创建租户 DTO
 */
export class CreateTenantDto {
    @IsString()
    @IsNotEmpty({ message: '空间名称不能为空' })
    @MaxLength(50, { message: '空间名称不能超过50个字符' })
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(200, { message: '描述不能超过200个字符' })
    description?: string;
}

/**
 * 更新租户 DTO
 */
export class UpdateTenantDto {
    @IsString()
    @IsOptional()
    @MaxLength(50, { message: '空间名称不能超过50个字符' })
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200, { message: '描述不能超过200个字符' })
    description?: string;

    @IsString()
    @IsOptional()
    customConfig?: string; // JSON string
}

/**
 * 邀请成员 DTO
 */
export class InviteMemberDto {
    @IsString()
    @IsNotEmpty({ message: '邮箱不能为空' })
    email: string;

    @IsString()
    @IsOptional()
    role?: string; // normal, editor, admin
}

/**
 * 更新成员角色 DTO
 */
export class UpdateMemberRoleDto {
    @IsString()
    @IsNotEmpty({ message: '角色不能为空' })
    role: string; // normal, editor, admin, owner
}
