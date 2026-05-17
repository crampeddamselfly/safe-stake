<script lang="ts">
  import RewardsInfoTooltip from "$lib/components/rewards/RewardsInfoTooltip.svelte"
  import ClaimableRewardsCard from "$lib/components/rewards/ClaimableRewardsCard.svelte"
  import DelegationsTable from "$lib/components/rewards/DelegationsTable.svelte"
</script>

<svelte:head>
  <title>Your Rewards — Safenet Beta</title>
</svelte:head>

<div class="flex flex-col gap-10">
  <header class="flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <h1 class="text-3xl font-semibold tracking-tight md:text-4xl">
        Your Rewards
      </h1>
      <RewardsInfoTooltip />
    </div>
    <p class="max-w-2xl text-sm text-muted-foreground">
      Track delegations and claim SAFE accrued through the staking program.
      Reward payouts are computed off-chain and distributed via a Merkle
      drop.
    </p>
  </header>

  <ClaimableRewardsCard />

  <DelegationsTable />
</div>
