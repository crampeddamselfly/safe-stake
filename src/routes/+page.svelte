<script lang="ts">
  import ValidatorStats from "$lib/components/validators/ValidatorStats.svelte"
  import ValidatorTable from "$lib/components/validators/ValidatorTable.svelte"
</script>

<svelte:head>
  <title>Stake SAFE — Safenet Beta</title>
</svelte:head>

<div class="flex flex-col gap-8">
  <header class="flex flex-col gap-2">
    <h1 class="text-3xl font-semibold tracking-tight md:text-4xl">Validators</h1>
    <p class="text-sm text-muted-foreground">
      Stake SAFE to a validator securing Safenet Beta. Non-custodial — your
      funds never leave your wallet.
    </p>
  </header>

  <ValidatorStats />
  <ValidatorTable />
</div>
