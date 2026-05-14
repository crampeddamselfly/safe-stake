<script lang="ts">
  import Button from "$lib/ui/Button.svelte"
  import { pushToast } from "$lib/ui/Toaster.svelte"
  import { account, chainId, openModal } from "$lib/wallet/appkit"
  import {
    pendingWithdrawalsQuery,
    nextClaimableQuery
  } from "$lib/hooks/useStakingReads"
  import { sanctionsQuery } from "$lib/hooks/useSanctions"
  import { claimWithdrawal } from "$lib/hooks/useStakingWrites"
  import { formatSafe, truncateAddress, formatCountdown } from "$lib/utils/format"
  import { useQueryClient } from "@tanstack/svelte-query"

  const pending = pendingWithdrawalsQuery()
  const next = nextClaimableQuery()
  const sanctioned = sanctionsQuery()
  const qc = useQueryClient()
  let busy = $state(false)

  const now = $derived(BigInt(Math.floor(Date.now() / 1000)))
  const ready = $derived(
    !!$next.data &&
      $next.data.amount > 0n &&
      $next.data.claimableAt > 0n &&
      $next.data.claimableAt <= now
  )

  async function submit() {
    busy = true
    try {
      const res = await claimWithdrawal($chainId)
      pushToast({
        kind: "success",
        title: "Claimed",
        detail: `Tx ${truncateAddress(res.hash)}`
      })
      await qc.invalidateQueries()
    } catch (err) {
      pushToast({
        kind: "error",
        title: "Claim failed",
        detail: err instanceof Error ? err.message : String(err)
      })
    } finally {
      busy = false
    }
  }
</script>

<div class="flex flex-col gap-5">
  {#if !$account.isConnected}
    <div class="rounded-md border border-border bg-bg-elev-2 p-4 text-sm text-fg-muted">
      Connect a wallet to view pending withdrawals.
      <button class="ml-2 underline" onclick={openModal}>Connect</button>
    </div>
  {/if}

  {#if $account.isConnected}
    {#if $pending.isLoading}
      <p class="text-sm text-fg-muted">Loading withdrawal queue…</p>
    {:else if !$pending.data || $pending.data.length === 0}
      <p class="text-sm text-fg-muted">No pending withdrawals.</p>
    {:else}
      <div class="overflow-hidden rounded-md border border-border">
        <table class="w-full text-sm">
          <thead class="bg-bg-elev-2 text-fg-muted">
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
                <td class="px-3 py-2 text-fg-muted">{i + 1}</td>
                <td class="px-3 py-2 text-right font-mono">{formatSafe(w.amount)}</td>
                <td class="px-3 py-2 text-right font-mono text-xs text-fg-muted">
                  {new Date(Number(w.claimableAt) * 1000).toLocaleString()}
                </td>
                <td class="px-3 py-2 text-right">
                  {#if remaining === 0n}
                    <span class="text-accent">Ready</span>
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

    <Button
      onclick={submit}
      disabled={!ready || busy || !!$sanctioned.data}
      loading={busy}
      class="w-full"
      size="lg"
    >
      {#if ready}
        Claim next withdrawal
      {:else}
        Nothing ready to claim
      {/if}
    </Button>
  {/if}
</div>
