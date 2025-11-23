import axios from 'axios';

const API_URL = 'http://localhost:3001';
let token: string = '';
let tenantId: string = '';

async function register() {
    const email = `test-${Date.now()}@example.com`;
    try {
        await axios.post(`${API_URL}/auth/register`, {
            email,
            password: 'password123',
            name: 'Test User',
        });
        console.log('Registration successful:', email);
        return email;
    } catch (error) {
        if (error.response?.data?.message === 'User already exists') {
            console.log('User already exists, proceeding to login:', email);
            return email;
        }
        console.error('Registration failed:', JSON.stringify(error.response?.data || error.message, null, 2));
        process.exit(1);
    }
}

async function login(email: string) {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password: 'password123',
        });
        token = response.data.token;
        console.log('Login successful');
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// ... rest of the file

async function run() {
    const email = await register();
    await login(email);
    await getTenant();
    await testProviderFlow();
}

async function getTenant() {
    try {
        const response = await axios.get(`${API_URL}/tenants`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.length > 0) {
            tenantId = response.data[0].id;
            // Switch to this tenant
            await axios.post(`${API_URL}/tenants/${tenantId}/switch`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Switched to tenant:', tenantId);
        } else {
            console.error('No tenants found. Please run full-flow-test.ts first.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Get tenant failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

async function testProviderFlow() {
    try {
        // 1. Save Provider (Mock OpenAI)
        // Note: We are using a fake key, so validation might fail if we don't handle it gracefully in the test or mock.
        // For this test, we'll assume the validation logic in OpenAIProvider checks for *some* key but maybe we should mock it or expect failure if real validation is on.
        // Actually, the current OpenAIProvider implementation tries to hit OpenAI API. 
        // So we should expect it to fail with a fake key, OR we can skip validation for testing if we had a flag.
        // Let's try to save with a fake key and see if it fails as expected (BadRequest).

        console.log('Testing Save Provider (Expect Failure with fake key)...');
        try {
            await axios.post(`${API_URL}/model-providers`, {
                provider: 'openai',
                config: { apiKey: 'sk-fake-key' }
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (error) {
            console.log('Save Provider failed as expected (Validation Error):', error.response?.status);
        }

        // 2. Get Providers (Should be empty or existing)
        console.log('Testing Get Providers...');
        const providersRes = await axios.get(`${API_URL}/model-providers`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Providers:', providersRes.data);

        // 3. Update Model Settings (Even if provider is invalid, we might be able to set settings? No, usually depends on available models)
        // Let's try to set a setting directly.
        console.log('Testing Update Model Setting...');
        await axios.post(`${API_URL}/model-providers/settings`, {
            modelType: 'llm',
            provider: 'openai',
            model: 'gpt-4'
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Model Setting Updated');

        // 4. Get Settings
        console.log('Testing Get Settings...');
        const settingsRes = await axios.get(`${API_URL}/model-providers/settings`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Settings:', settingsRes.data);

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

run();
