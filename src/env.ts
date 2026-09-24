import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: {},
	AUTH_SECRET: {},
	ORIGIN_TRIAL_TOKEN: { public: true, schema: (value) => value || undefined }
});
