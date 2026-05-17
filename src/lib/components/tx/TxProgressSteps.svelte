<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check"
  import CircleIcon from "@lucide/svelte/icons/circle"
  import Loader2Icon from "@lucide/svelte/icons/loader-2"
  import AlertCircleIcon from "@lucide/svelte/icons/alert-circle"
  import type { TxStep } from "$lib/hooks/useStakingWrites"
  import { cn } from "$lib/utils/cn"
  import { statusFor, stepsFor, type TxFlow } from "./steps"

  let {
    step,
    flow,
    hasError = false
  }: { step: TxStep; flow: TxFlow; hasError?: boolean } = $props()

  const visible = $derived(stepsFor(flow))
</script>

{#if step !== "idle"}
  <ol class="flex flex-col gap-3" aria-label="Transaction progress">
    {#each visible as s (s.id)}
      {@const status = statusFor(s, step, hasError)}
      <li class="flex items-start gap-3">
        {#if status === "active"}
          <Loader2Icon class="size-5 shrink-0 animate-spin text-primary" />
        {:else if status === "complete"}
          <span
            class="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <CheckIcon class="size-3" />
          </span>
        {:else if status === "error"}
          <AlertCircleIcon class="size-5 shrink-0 text-destructive" />
        {:else}
          <CircleIcon class="size-5 shrink-0 text-muted-foreground" />
        {/if}

        <div class="flex flex-col gap-0.5">
          <span
            class={cn(
              "text-sm font-medium",
              status === "pending" && "text-muted-foreground",
              status === "error" && "text-destructive"
            )}
          >
            {s.label}
          </span>
          <span class="text-xs text-muted-foreground">{s.description}</span>
        </div>
      </li>
    {/each}
  </ol>
{/if}
