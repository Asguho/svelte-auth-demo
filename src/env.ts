import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: { static: true },
	AUTH_SECRET: { static: true },
	ORIGIN_TRIAL_TOKEN: { static: true, public: true, schema: (value) => value || undefined }
});
