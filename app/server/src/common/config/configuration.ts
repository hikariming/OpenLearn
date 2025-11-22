import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    deployMode: process.env.DEPLOY_MODE || 'cloud',
    database: {
        url: process.env.DATABASE_URL,
    },
    minio: {
        endPoint: process.env.MINIO_ENDPOINT,
        port: parseInt(process.env.MINIO_PORT || '9000', 10),
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ROOT_USER,
        secretKey: process.env.MINIO_ROOT_PASSWORD,
    },
    redis: {
        url: process.env.REDIS_URL,
    },
}));
