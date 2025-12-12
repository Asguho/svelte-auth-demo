<script lang="ts">
	import { deleteSession, getAllSessions, getUserOrLogin } from '$lib/auth/auth.remote';

	const sessions = await getAllSessions();
	const user = await getUserOrLogin();
</script>

<main class="mx-auto max-w-3xl *:mt-8">
	<section>
		<h1 class="text-4xl">Profile</h1>
		{#each Object.entries(user) as [key, value]}
			<p>
				<strong>{key}:</strong>
				{value}
			</p>
		{/each}
	</section>
	<section>
		<h2 class="text-2xl">Sessions</h2>
		<ul>
			{#each sessions as session}
				<li>
					{session.userAgent} - {new Date(session.issuedAt).toLocaleString()}
					<form {...deleteSession}>
						<input {...deleteSession.fields.sessionId.as('number')} value={session.id} hidden />
					</form>
				</li>
			{/each}
		</ul>
	</section>
</main>
