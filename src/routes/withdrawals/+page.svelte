<script lang="ts">
  import WithdrawalQueue from "$lib/components/withdrawals/WithdrawalQueue.svelte"
</script>

<svelte:head>
  <title>Withdrawals — Safenet Beta</title>
</svelte:head>

<div class="flex flex-col gap-8">
  <header class="flex flex-col gap-2">
    <h1 class="text-3xl font-semibold tracking-tight md:text-4xl">Withdrawals</h1>
    <p class="text-sm text-muted-foreground">
      Track and claim withdrawals initiated from any validator.
    </p>
  </header>

  <WithdrawalQueue />
</div>
