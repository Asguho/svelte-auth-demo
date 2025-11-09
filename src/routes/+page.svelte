<script lang="ts">
	import { resolve } from '$app/paths';
	import { getUser, signOut } from '$lib/auth/auth.remote';

	let user = $derived(await getUser());
	$inspect(user);
</script>

<main class="flex flex-col items-center gap-2">
	<h1 class="text-3xl">Welcome to SvelteKit</h1>
	<p>
		Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation
	</p>

	{#if user}
		<p>your email is {user.email} and your id is {user.id}</p>
		<form {...signOut}>
			<button class="text-primary hover:underline" type="submit">Sign out</button>
		</form>
	{:else}
		<p>
			You not logged in. Press here: <a
				class="text-primary hover:underline"
				href={resolve('/(auth)/login')}>Login</a
			>
		</p>
	{/if}
</main>
