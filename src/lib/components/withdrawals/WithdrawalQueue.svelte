<script lang="ts">
  import * as Card from "$lib/components/ui/card"
  import { Button } from "$lib/components/ui/button"
  import { Badge } from "$lib/components/ui/badge"
  import {
    pendingWithdrawalsQuery,
    nextClaimableQuery
  } from "$lib/hooks/useStakingReads"
  import { sanctionsQuery } from "$lib/hooks/useSanctions"
  import { claimWithdrawal, type TxStep } from "$lib/hooks/useStakingWrites"
  import { account, chainId, openModal } from "$lib/wallet/appkit"
  import { formatSafe, truncateAddress, formatCountdown } from "$lib/utils/format"
  import { formatContractError } from "$lib/utils/errors"
  import { txUrl } from "$lib/utils/explorer"
  import { toast } from "svelte-sonner"
  import { useQueryClient } from "@tanstack/svelte-query"
  import TxProgressSteps from "$lib/components/tx/TxProgressSteps.svelte"
  import { buttonLabel } from "$lib/components/tx/steps"

  const pending = pendingWithdrawalsQuery()
  const next = nextClaimableQuery()
  const sanctioned = sanctionsQuery()
  const qc = useQueryClient()

  let busy = $state(false)
  let step = $state<TxStep>("idle")

  const now = $derived(BigInt(Math.floor(Date.now() / 1000)))
  const ready = $derived(
    !!$next.data &&
      $next.data.amount > 0n &&
      $next.data.claimableAt > 0n &&
      $next.data.claimableAt <= now
  )
  const hasError = $derived(step === "error")

  async function submit() {
    busy = true
    step = "idle"
    try {
      const res = await claimWithdrawal($chainId, (s) => (step = s))
      step = "done"
      toast.success("Claimed", {
        description: `Tx ${truncateAddress(res.hash)}`,
        action: {
          label: "View",
          onClick: () => window.open(txUrl($chainId, res.hash), "_blank")
        }
      })
      await qc.invalidateQueries()
      step = "idle"
    } catch (err) {
      step = "error"
      toast.error("Claim failed", { description: formatContractError(err) })
    } finally {
      busy = false
    }
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Pending withdrawals</Card.Title>
    <Card.Description>
      Withdrawals enter a FIFO cooldown after initiation. Claim the next
      ready entry once its cooldown has elapsed.
    </Card.Description>
  </Card.Header>
  <Card.Content class="flex flex-col gap-5">
    {#if !$account.isConnected}
      <div class="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Connect a wallet to view pending withdrawals.
        <Button variant="link" class="px-1" onclick={openModal}>Connect</Button>
      </div>
    {:else if $pending.isLoading}
      <p class="text-sm text-muted-foreground">Loading queue…</p>
    {:else if !$pending.data || $pending.data.length === 0}
      <p class="text-sm text-muted-foreground">No pending withdrawals.</p>
    {:else}
      <div class="overflow-hidden rounded-md border border-border">
        <table class="w-full text-sm">
          <thead class="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th class="px-3 py-2 text-left">#</th>
              <th class="px-3 py-2 text-right">Amount</th>
              <th class="px-3 py-2 text-right">Claimable at</th>
              <th class="px-3 py-2 text-right">Cooldown</th>
            </tr>
          </thead>
          <tbody>
            {#each $pending.data as w, i}
              {@const remaining = w.claimableAt > now ? w.claimableAt - now : 0n}
              <tr class="border-t border-border">
                <td class="px-3 py-2 text-muted-foreground">{i + 1}</td>
                <td class="px-3 py-2 text-right font-mono">{formatSafe(w.amount)}</td>
                <td class="px-3 py-2 text-right font-mono text-xs text-muted-foreground">
                  {new Date(Number(w.claimableAt) * 1000).toLocaleString()}
                </td>
                <td class="px-3 py-2 text-right">
                  {#if remaining === 0n}
                    <Badge class="bg-primary/15 text-foreground border-primary/30">Ready</Badge>
                  {:else}
                    {formatCountdown(remaining)}
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    {#if $account.isConnected}
      {#if step !== "idle"}
        <div class="rounded-md border border-border bg-muted/30 p-4">
          <TxProgressSteps {step} flow="claim-withdrawal" {hasError} />
        </div>
      {/if}
      <Button
        size="lg"
        class="w-full"
        onclick={submit}
        disabled={!ready || busy || !!$sanctioned.data}
      >
        {buttonLabel(step, "claim-withdrawal", ready ? "Claim next withdrawal" : "Nothing ready to claim")}
      </Button>
    {/if}
  </Card.Content>
</Card.Root>
