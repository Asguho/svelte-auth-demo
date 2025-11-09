<script lang="ts">
	import { resolve } from "$app/paths";
	import { getUser } from "$lib/auth/auth.remote";


    let user = $derived(await getUser())
    $inspect(user)
</script>
<main class="flex items-center flex-col gap-2">
<h1 class="text-3xl">Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

{#if user}
    <p>your email is {user.email} and your id is {user.id}</p>
    {:else}
    <p>You not logged in. Press here: <a class="text-primary hover:underline" href={resolve("/(auth)/login")}>Login</a></p>
{/if}
</main>

