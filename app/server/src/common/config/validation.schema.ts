import * as Joi from 'joi';

export const validationSchema = Joi.object({
    DEPLOY_MODE: Joi.string().valid('cloud', 'local').default('cloud'),
    DATABASE_URL: Joi.string().required(),

    // MinIO (Required only in cloud mode)
    MINIO_ENDPOINT: Joi.when('DEPLOY_MODE', {
        is: 'cloud',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
    }),
    MINIO_ROOT_USER: Joi.when('DEPLOY_MODE', {
        is: 'cloud',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
    }),
    MINIO_ROOT_PASSWORD: Joi.when('DEPLOY_MODE', {
        is: 'cloud',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
    }),

    // Redis (Required only in cloud mode)
    REDIS_URL: Joi.when('DEPLOY_MODE', {
        is: 'cloud',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
    }),
});
