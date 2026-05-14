<script lang="ts">
  import StakeForm from "./StakeForm.svelte"
  import UnstakeForm from "./UnstakeForm.svelte"
  import ClaimPanel from "./ClaimPanel.svelte"

  type Tab = "stake" | "unstake" | "claim"
  let active = $state<Tab>("stake")

  const tabs: { id: Tab; label: string }[] = [
    { id: "stake", label: "Stake" },
    { id: "unstake", label: "Initiate withdrawal" },
    { id: "claim", label: "Claim withdrawal" }
  ]
</script>

<div
  class="overflow-hidden rounded-lg border border-border bg-bg-elev"
>
  <div role="tablist" aria-label="Staking actions" class="flex border-b border-border">
    {#each tabs as t}
      <button
        role="tab"
        type="button"
        id="tab-{t.id}"
        aria-selected={active === t.id}
        aria-controls="panel-{t.id}"
        tabindex={active === t.id ? 0 : -1}
        onclick={() => (active = t.id)}
        class="flex-1 px-4 py-3 text-sm font-medium transition"
        class:bg-bg-elev-2={active === t.id}
        class:text-fg={active === t.id}
        class:text-fg-muted={active !== t.id}
      >
        {t.label}
      </button>
    {/each}
  </div>

  <div class="p-6">
    {#if active === "stake"}
      <div role="tabpanel" id="panel-stake" aria-labelledby="tab-stake">
        <StakeForm />
      </div>
    {:else if active === "unstake"}
      <div role="tabpanel" id="panel-unstake" aria-labelledby="tab-unstake">
        <UnstakeForm />
      </div>
    {:else}
      <div role="tabpanel" id="panel-claim" aria-labelledby="tab-claim">
        <ClaimPanel />
      </div>
    {/if}
  </div>
</div>
