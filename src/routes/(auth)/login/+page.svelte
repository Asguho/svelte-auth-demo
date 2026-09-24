<script lang="ts">
	import { ORIGIN_TRIAL_TOKEN } from '$app/env/public';
	import { loginWithEmail } from '#lib/remote/auth.remote.js';

	let { data } = $props();

	// Svelte's DOM types don't know the Email Verification Protocol values yet
	const originTrial: Record<string, string> = { 'http-equiv': 'origin-trial' };
	const verificationToken: Record<string, string> = $derived({
		nonce: data.nonce,
		autocomplete: 'email-verification-token'
	});
</script>

<svelte:head>
	{#if ORIGIN_TRIAL_TOKEN}
		<meta {...originTrial} content={ORIGIN_TRIAL_TOKEN} />
	{/if}
</svelte:head>

<main class="flex min-h-screen items-center justify-center">
	<form {...loginWithEmail}>
		<fieldset class="flex flex-col gap-4" disabled={!!loginWithEmail.pending}>
			<label class="text-sm" for="email">
				Email
				<input
					class="block border p-1"
					placeholder="test@example.com"
					autocomplete="email"
					{...loginWithEmail.fields.email.as('email')}
				/>
			</label>
			<input {...loginWithEmail.fields.token.as('hidden', '')} {...verificationToken} />
			<button type="submit" class="bg-primary">Submit</button>
		</fieldset>
	</form>
</main>
