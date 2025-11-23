import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { TenantService } from '../tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private tenantService: TenantService,
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { email, password, name } = registerDto;

        // 1. Check if user exists
        const existingUser = await this.userService.user({ email });
        if (existingUser) {
            throw new Error('User already exists');
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Transaction: Create User -> Create Tenant -> Link
        const result = await this.prisma.$transaction(async (tx) => {
            // Create User
            const user = await tx.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    passwordSalt: salt,
                    status: 'active',
                },
            });

            // Create Default Tenant
            const tenant = await tx.tenant.create({
                data: {
                    name: `${name}'s Workspace`,
                    plan: 'basic',
                    status: 'normal',
                    ownerId: user.id,
                },
            });

            // Link User to Tenant as Owner
            await tx.tenantMember.create({
                data: {
                    userId: user.id,
                    tenantId: tenant.id,
                    role: 'owner',
                    current: true,
                },
            });

            return {
                user,
                tenant,
            };
        });

        // 4. Generate Token
        const payload = { sub: result.user.id, email: result.user.email };
        const token = this.jwtService.sign(payload);

        return {
            ...result,
            token,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        const user = await this.userService.user({ email });

        if (!user || !user.password) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate JWT
        const payload = { sub: user.id, email: user.email };
        const token = this.jwtService.sign(payload);

        return {
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        };
    }

    /**
     * 获取用户信息
     */
    async getProfile(userId: string) {
        const user = await this.userService.user({ id: userId });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
        };
    }

    /**
     * 更新用户资料
     */
    async updateProfile(userId: string, updateData: { name?: string }) {
        const user = await this.userService.updateUser({
            where: { id: userId },
            data: updateData,
        });

        return {
            id: user.id,
            email: user.email,
            name: user.name,
        };
    }

    /**
     * 修改密码
     */
    async changePassword(userId: string, oldPassword: string, newPassword: string) {
        const user = await this.userService.user({ id: userId });
        if (!user || !user.password) {
            throw new UnauthorizedException('User not found');
        }

        // 验证旧密码
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // 生成新密码哈希
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 更新密码
        await this.userService.updateUser({
            where: { id: userId },
            data: {
                password: hashedPassword,
                passwordSalt: salt,
            },
        });

        return {
            message: 'Password changed successfully',
        };
    }
}
