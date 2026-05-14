<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLButtonAttributes } from "svelte/elements"

  type Variant = "primary" | "secondary" | "ghost" | "danger"
  type Size = "sm" | "md" | "lg"

  type Props = HTMLButtonAttributes & {
    variant?: Variant
    size?: Size
    loading?: boolean
    children: Snippet
  }

  let {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    class: klass = "",
    children,
    // eslint-disable-next-line svelte/valid-compile -- rest props deliberate; component not a custom element
    ...rest
  }: Props = $props()

  const variantClasses: Record<Variant, string> = {
    primary: "bg-accent text-accent-fg hover:brightness-110 disabled:opacity-50",
    secondary: "bg-bg-elev-2 text-fg hover:bg-bg-elev border border-border",
    ghost: "bg-transparent text-fg hover:bg-bg-elev",
    danger: "bg-danger text-fg hover:brightness-110"
  }
  const sizeClasses: Record<Size, string> = {
    sm: "px-3 py-1.5 text-sm rounded-sm",
    md: "px-4 py-2 text-sm rounded-md",
    lg: "px-5 py-3 text-base rounded-md"
  }
</script>

<button
  {...rest}
  disabled={disabled || loading}
  class="inline-flex items-center justify-center gap-2 font-medium transition disabled:cursor-not-allowed {variantClasses[variant]} {sizeClasses[size]} {klass}"
>
  {#if loading}
    <span
      class="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    ></span>
  {/if}
  {@render children()}
</button>
