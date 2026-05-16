<script lang="ts">
  import * as Card from "$lib/components/ui/card"
  import {
    stakedBalanceQuery,
    totalStakedQuery,
    validatorsQuery
  } from "$lib/hooks/useStakingReads"
  import { formatSafe } from "$lib/utils/format"
  import { account } from "$lib/wallet/appkit"

  const total = totalStakedQuery()
  const validators = validatorsQuery()
  const myStake = stakedBalanceQuery()

  const activeCount = $derived(
    ($validators.data ?? []).filter((v) => v.isRegistered && v.isActive !== false).length
  )
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
  <Card.Root>
    <Card.Header>
      <Card.Description>Total SAFE staked</Card.Description>
      <Card.Title class="font-mono text-2xl">
        {formatSafe($total.data, { precision: 0 })}
      </Card.Title>
    </Card.Header>
  </Card.Root>
  <Card.Root>
    <Card.Header>
      <Card.Description>Active validators</Card.Description>
      <Card.Title class="font-mono text-2xl">
        {activeCount}
        <span class="text-base font-normal text-muted-foreground">/ {$validators.data?.length ?? "—"}</span>
      </Card.Title>
    </Card.Header>
  </Card.Root>
  <Card.Root>
    <Card.Header>
      <Card.Description>Your stake</Card.Description>
      <Card.Title class="font-mono text-2xl">
        {#if $account.isConnected}
          {formatSafe($myStake.data)}
        {:else}
          <span class="text-base font-normal text-muted-foreground">Connect to view</span>
        {/if}
      </Card.Title>
    </Card.Header>
  </Card.Root>
</div>
