<script lang="ts">
	import { deleteSession, getAllSessions, getUserOrLogin } from '$lib/remote/auth.remote';

	const sessions = $derived(await getAllSessions());
	const user = $derived(await getUserOrLogin());
</script>

<main class="mx-auto max-w-3xl *:mt-8">
	<section>
		<h1 class="text-4xl">Profile</h1>
		{#each Object.entries(user) as [key, value] (key)}
			<p>
				<strong>{key}:</strong>
				{value}
			</p>
		{/each}
	</section>
	<section>
		<h2 class="text-2xl">Sessions</h2>
		<ul>
			{#each sessions as session (session.id)}
				<li class="flex">
					{session.userAgent} - {new Date(session.issuedAt).toLocaleString()}
					{#if session.id === user.sessionId}
						<strong>(current)</strong>
					{/if}
					<form {...deleteSession.for(session.id)}>
						<input {...deleteSession.fields.sessionId.as('number')} value={session.id} hidden />
						<button type="submit">❌</button>
					</form>
				</li>
			{/each}
		</ul>
	</section>
</main>
