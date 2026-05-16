<script lang="ts">
  import { toggleMode, mode } from "mode-watcher"
  import SunIcon from "@lucide/svelte/icons/sun"
  import MoonIcon from "@lucide/svelte/icons/moon"
  import { Button } from "$lib/components/ui/button"
</script>

<Button
  variant="ghost"
  size="icon"
  aria-label="Toggle theme"
  title="Toggle theme"
  onclick={toggleMode}
>
  {#if mode.current === "dark"}
    <SunIcon class="size-4" />
  {:else}
    <MoonIcon class="size-4" />
  {/if}
</Button>
