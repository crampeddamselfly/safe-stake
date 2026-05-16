<script lang="ts">
  import InfoIcon from "@lucide/svelte/icons/info"
  import { withdrawDelayQuery } from "$lib/hooks/useStakingReads"
  import { formatCountdown } from "$lib/utils/format"

  const delay = withdrawDelayQuery()
</script>

<div
  class="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
>
  <InfoIcon class="size-4 shrink-0" />
  <span>
    Unstaking period:
    <span class="font-medium text-foreground">
      {#if $delay.data !== undefined}
        {formatCountdown($delay.data)}
      {:else}
        —
      {/if}
    </span>
  </span>
</div>
