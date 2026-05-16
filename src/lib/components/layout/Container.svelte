<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "$lib/utils/cn"

  let { class: klass = "", children }: { class?: string; children: Snippet } = $props()
</script>

<div class={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", klass)}>
  {@render children()}
</div>
