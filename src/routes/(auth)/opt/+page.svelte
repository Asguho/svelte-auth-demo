<script lang="ts">
	import { loginWithEmail, verifyOTPForm } from '$lib/auth/auth.remote';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<main class="flex min-h-screen items-center justify-center">
	<form {...verifyOTPForm}>
		<formfield class="flex flex-col gap-4">
			<div>
				<label class="block text-sm" for="otp">One Time Password</label>
				<input
					class="border p-1 text-sm"
					placeholder="000000"
					{...verifyOTPForm.fields.otp.as('number')}
				/>
			</div>
			<button type="submit" class="bg-primary">Submit</button>
		</formfield>
	</form>
</main>
