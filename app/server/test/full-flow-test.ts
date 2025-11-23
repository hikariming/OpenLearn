#!/usr/bin/env ts-node

/**
 * 手动测试脚本
 * 用于快速测试租户管理 API 的核心功能
 * 
 * 运行方式：
 * cd app/server
 * npm run test:manual
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';
let authToken = '';
let userId = '';
let tenantId = '';
let secondTenantId = '';

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message: string, color: string = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
    log(`✅ ${message}`, colors.green);
}

function error(message: string) {
    log(`❌ ${message}`, colors.red);
}

function info(message: string) {
    log(`ℹ️  ${message}`, colors.blue);
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 测试 1: 用户注册
 */
async function testRegister() {
    info('测试 1: 用户注册并自动创建租户');

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
            email: `test-${Date.now()}@example.com`,
            name: '测试用户',
            password: 'Password123!',
        });

        authToken = response.data.token;
        userId = response.data.user.id;
        tenantId = response.data.tenant.id;

        success(`注册成功！用户 ID: ${userId}`);
        success(`自动创建租户: ${response.data.tenant.name} (${tenantId})`);

        return true;
    } catch (err: any) {
        error(`注册失败: ${err.response?.data?.message || err.message}`);
        return false;
    }
}

/**
 * 测试 2: 获取用户的所有租户
 */
async function testGetTenants() {
    info('测试 2: 获取用户的所有租户');

    try {
        const response = await axios.get(`${API_BASE_URL}/tenants`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        success(`获取到 ${response.data.length} 个租户`);
        response.data.forEach((tenant: any) => {
            console.log(`  - ${tenant.name} (${tenant.role}) ${tenant.current ? '✓ 当前' : ''}`);
        });

        return true;
    } catch (err: any) {
        error(`获取租户失败: ${err.response?.data?.message || err.message}`);
        return false;
    }
}

/**
 * 测试 3: 创建新租户
 */
async function testCreateTenant() {
    info('测试 3: 创建新租户');

    try {
        const response = await axios.post(
            `${API_BASE_URL}/tenants`,
            { name: '我的学习空间' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        secondTenantId = response.data.id;
        success(`创建租户成功: ${response.data.name} (${secondTenantId})`);

        return true;
    } catch (err: any) {
        error(`创建租户失败: ${err.response?.data?.message || err.message}`);
        return false;
    }
}

/**
 * 测试 4: 获取当前租户
 */
async function testGetCurrentTenant() {
    info('测试 4: 获取当前激活的租户');

    try {
        const response = await axios.get(`${API_BASE_URL}/tenants/current`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        success(`当前租户: ${response.data.name} (${response.data.id})`);

        return true;
    } catch (err: any) {
        error(`获取当前租户失败: ${err.response?.data?.message || err.message}`);
        return false;
    }
}

/**
 * 测试 5: 切换租户
 */
async function testSwitchTenant() {
    info('测试 5: 切换到第一个租户');

    try {
        const response = await axios.post(
            `${API_BASE_URL}/tenants/${tenantId}/switch`,
            {},
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        success(`切换成功: ${response.data.currentTenant.name}`);

        return true;
    } catch (err: any) {
        error(`切换租户失败: ${err.response?.data?.message || err.message}`);
        return false;
    }
}

/**
 * 测试 6: 获取租户成员
 */
async function testGetMembers() {
    info('测试 6: 获取租户成员列表');

    try {
        const response = await axios.get(`${API_BASE_URL}/tenants/${tenantId}/members`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        success(`获取到 ${response.data.length} 个成员`);
        response.data.forEach((member: any) => {
            console.log(`  - ${member.user.name} (${member.role})`);
        });

        return true;
    } catch (err: any) {
        error(`获取成员失败: ${err.response?.data?.message || err.message}`);
        return false;
    }
}

/**
 * 测试 7: 更新租户信息
 */
async function testUpdateTenant() {
    info('测试 7: 更新租户信息');

    try {
        const response = await axios.patch(
            `${API_BASE_URL}/tenants/${tenantId}`,
            { name: '更新后的空间名称' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        success(`更新成功: ${response.data.name}`);

        return true;
    } catch (err: any) {
        error(`更新租户失败: ${err.response?.data?.message || err.message}`);
        return false;
    }
}

/**
 * 主测试流程
 */
async function runTests() {
    log('\n=================================', colors.yellow);
    log('  租户管理 API 手动测试', colors.yellow);
    log('=================================\n', colors.yellow);

    const tests = [
        testRegister,
        testGetTenants,
        testCreateTenant,
        testGetCurrentTenant,
        testSwitchTenant,
        testGetMembers,
        testUpdateTenant,
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const result = await test();
        if (result) {
            passed++;
        } else {
            failed++;
        }
        await sleep(500); // 短暂延迟，避免请求过快
        console.log('');
    }

    log('\n=================================', colors.yellow);
    log(`  测试完成: ${passed} 通过, ${failed} 失败`, colors.yellow);
    log('=================================\n', colors.yellow);

    if (failed === 0) {
        success('所有测试通过！🎉');
    } else {
        error(`有 ${failed} 个测试失败`);
    }
}

// 运行测试
runTests().catch((err) => {
    error(`测试运行失败: ${err.message}`);
    process.exit(1);
});
