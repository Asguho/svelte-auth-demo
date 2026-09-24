import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// Consult https://svelte.dev/docs/kit/integrations
			// for more information about preprocessors
			preprocess: vitePreprocess(),
			compilerOptions: { experimental: { async: true } },
			experimental: { remoteFunctions: true },
			paths: { relative: false },
			adapter: adapter()
		})
	]
});
