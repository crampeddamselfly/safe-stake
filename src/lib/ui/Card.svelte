<script lang="ts">
  import type { Snippet } from "svelte"
  let {
    title,
    description,
    class: klass = "",
    children
  }: {
    title?: string
    description?: string
    class?: string
    children: Snippet
  } = $props()
</script>

<section
  class="rounded-lg border border-border bg-bg-elev p-6 shadow-sm {klass}"
>
  {#if title}
    <header class="mb-4">
      <h2 class="text-lg font-semibold text-fg">{title}</h2>
      {#if description}
        <p class="mt-1 text-sm text-fg-muted">{description}</p>
      {/if}
    </header>
  {/if}
  {@render children()}
</section>
