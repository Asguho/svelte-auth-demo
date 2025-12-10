<script lang="ts">
	import { getPosts } from '$lib/posts.remote';

	const posts = await getPosts();
</script>

<main>
	<h1>Blog Posts</h1>
	{#each posts as post}
		<article>
			<h2>{post.title}</h2>
			<p>{post.content}</p>
		</article>
	{/each}
</main>
