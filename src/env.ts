import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: { static: true },
	AUTH_SECRET: { static: true }
});
