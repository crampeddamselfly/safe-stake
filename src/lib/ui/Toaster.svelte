<script lang="ts" module>
  import { writable } from "svelte/store"

  export type Toast = {
    id: number
    kind: "info" | "success" | "error"
    title: string
    detail?: string
    link?: { href: string; label: string }
  }

  export const toasts = writable<Toast[]>([])
  let nextId = 1

  export function pushToast(t: Omit<Toast, "id">) {
    const id = nextId++
    toasts.update((list) => [...list, { ...t, id }])
    setTimeout(() => {
      toasts.update((list) => list.filter((x) => x.id !== id))
    }, 6000)
  }
</script>

<script lang="ts">
  const kindClasses = {
    info: "border-border bg-bg-elev",
    success: "border-accent bg-bg-elev",
    error: "border-danger bg-bg-elev"
  } as const
</script>

<div
  class="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
  role="region"
  aria-live="polite"
  aria-label="Notifications"
>
  {#each $toasts as t (t.id)}
    <div
      class="pointer-events-auto rounded-md border p-3 shadow-lg {kindClasses[t.kind]}"
    >
      <p class="text-sm font-medium text-fg">{t.title}</p>
      {#if t.detail}
        <p class="mt-1 text-xs text-fg-muted break-all">{t.detail}</p>
      {/if}
      {#if t.link}
        <p class="mt-1 text-xs">
          <a
            class="text-accent underline"
            href={t.link.href}
            target="_blank"
            rel="noopener"
          >{t.link.label} ↗</a>
        </p>
      {/if}
    </div>
  {/each}
</div>
