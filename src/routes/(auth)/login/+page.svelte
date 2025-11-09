<script lang="ts">
  import { loginWithEmail } from "$lib/auth/auth.remote";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<main class="flex min-h-screen justify-center items-center">
  <form {...loginWithEmail}>
    <formfield class="flex flex-col gap-4">
      <div>
        <label class="block text-sm" for="email">Email</label>
        <input
          class="border p-1 text-sm"
          placeholder="test@example.com"
          {...loginWithEmail.fields.email.as("email")}
        />
      </div>
      <button type="submit" class="bg-primary">Submit</button>
    </formfield>
  </form>
</main>
