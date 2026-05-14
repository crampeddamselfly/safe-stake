<script lang="ts">
  import Card from "$lib/ui/Card.svelte"
  import StatNumber from "$lib/ui/StatNumber.svelte"
  import StakeTabs from "$lib/stake/StakeTabs.svelte"
  import { account } from "$lib/wallet/appkit"
  import {
    stakedBalanceQuery,
    safeBalanceQuery,
    pendingWithdrawalsQuery
  } from "$lib/hooks/useStakingReads"
  import { formatSafe } from "$lib/utils/format"

  const staked = stakedBalanceQuery()
  const balance = safeBalanceQuery()
  const pending = pendingWithdrawalsQuery()

  const pendingTotal = $derived(
    ($pending.data ?? []).reduce((sum, w) => sum + w.amount, 0n)
  )
</script>

<svelte:head>
  <title>Stake SAFE — Safe Stake</title>
</svelte:head>

<section class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
  <Card>
    <StatNumber
      label="Your stake"
      value={formatSafe($staked.data)}
      hint={$account.isConnected ? undefined : "Connect to view"}
    />
  </Card>
  <Card>
    <StatNumber
      label="Wallet balance"
      value={formatSafe($balance.data)}
      hint={$account.isConnected ? undefined : "Connect to view"}
    />
  </Card>
  <Card>
    <StatNumber
      label="Pending withdrawal"
      value={formatSafe(pendingTotal)}
      hint={$pending.data && $pending.data.length > 0
        ? `${$pending.data.length} in queue`
        : "—"}
    />
  </Card>
</section>

<StakeTabs />
