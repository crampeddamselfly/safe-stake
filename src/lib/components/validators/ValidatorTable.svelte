<script lang="ts">
  import type { Address } from "viem"
  import { Button } from "$lib/components/ui/button"
  import { Badge } from "$lib/components/ui/badge"
  import { Input } from "$lib/components/ui/input"
  import {
    validatorsQuery,
    totalStakedQuery,
    userStakesQuery
  } from "$lib/hooks/useStakingReads"
  import { validatorMetaQuery } from "$lib/hooks/useValidatorMeta"
  import {
    decorate,
    sortRows,
    type SortKey,
    type SortDir
  } from "$lib/analytics/validators"
  import { formatSafe, formatBps, truncateAddress } from "$lib/utils/format"
  import { account } from "$lib/wallet/appkit"
  import { cn } from "$lib/utils/cn"
  import DelegateDialog from "$lib/components/staking/DelegateDialog.svelte"

  const validators = validatorsQuery()
  const totalStaked = totalStakedQuery()
  const meta = validatorMetaQuery()

  let sortKey = $state<SortKey>("totalStaked")
  let sortDir = $state<SortDir>("desc")
  let query = $state("")

  // Dialog state
  let dialogOpen = $state(false)
  let dialogMode = $state<"stake" | "unstake">("stake")
  let dialogValidator = $state<Address | undefined>(undefined)
  let dialogValidatorName = $state<string | undefined>(undefined)

  function openDialog(mode: "stake" | "unstake", v: Address, name: string) {
    dialogValidator = v
    dialogValidatorName = name
    dialogMode = mode
    dialogOpen = true
  }

  const userStakes = userStakesQuery()

  function userStakeFor(addr: Address): bigint {
    return $userStakes.data?.[addr] ?? 0n
  }

  const rows = $derived.by(() => {
    if (!$validators.data) return []
    const enriched = $validators.data.map((v) => {
      const m = $meta.data?.get(v.address.value)
      if (!m) return v
      return {
        ...v,
        commissionBps: v.commissionBps ?? m.commissionBps,
        participationRateBps: m.participationRateBps,
        isActive: m.isActive
      }
    })
    const decorated = decorate(enriched, $totalStaked.data ?? 0n)
    const searched = query
      ? decorated.filter(
          (r) =>
            r.name.toLowerCase().includes(query.toLowerCase()) ||
            r.address.value.toLowerCase().includes(query.toLowerCase())
        )
      : decorated
    return sortRows(searched, sortKey, sortDir)
  })

  function toggleSort(k: SortKey) {
    if (sortKey === k) sortDir = sortDir === "asc" ? "desc" : "asc"
    else {
      sortKey = k
      sortDir = "desc"
    }
  }

  function sortIndicator(k: SortKey) {
    if (sortKey !== k) return ""
    return sortDir === "asc" ? " ↑" : " ↓"
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex flex-wrap items-center gap-3">
    <Input
      type="search"
      placeholder="Search validators…"
      bind:value={query}
      aria-label="Search validators"
      class="max-w-xs"
    />
  </div>

  {#if $validators.isLoading}
    <p class="text-sm text-muted-foreground">Loading validators…</p>
  {:else if rows.length === 0}
    <p class="text-sm text-muted-foreground">No validators configured.</p>
  {:else}
    <div class="overflow-x-auto rounded-lg border border-border bg-card">
      <table class="w-full text-sm">
        <thead class="bg-muted/30 text-muted-foreground">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide">
              <button class="hover:text-foreground" onclick={() => toggleSort("name")}>
                Validator{sortIndicator("name")}
              </button>
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide">
              <button class="hover:text-foreground" onclick={() => toggleSort("commissionBps")}>
                Commission{sortIndicator("commissionBps")}
              </button>
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide">
              <button class="hover:text-foreground" onclick={() => toggleSort("totalStaked")}>
                Total staked{sortIndicator("totalStaked")}
              </button>
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide">
              <button class="hover:text-foreground" onclick={() => toggleSort("share")}>
                Share{sortIndicator("share")}
              </button>
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide">
              Participation
            </th>
            {#if $account.isConnected}
              <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide">
                Your stake
              </th>
            {/if}
            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide">
              Status
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {#each rows as r (r.address.value)}
            {@const myStake = userStakeFor(r.address.value)}
            <tr class={cn("border-t border-border transition-colors hover:bg-muted/30")}>
              <td class="px-4 py-3">
                <div class="flex flex-col gap-0.5">
                  <span class="font-medium text-foreground">{r.name}</span>
                  <span class="font-mono text-xs text-muted-foreground">
                    {truncateAddress(r.address.value)}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-right font-mono">{formatBps(r.commissionBps)}</td>
              <td class="px-4 py-3 text-right font-mono">{formatSafe(r.totalStaked, { precision: 0 })}</td>
              <td class="px-4 py-3 text-right">{(r.share * 100).toFixed(2)}%</td>
              <td class="px-4 py-3 text-right">
                {#if r.participationRateBps !== undefined}
                  {(r.participationRateBps / 100).toFixed(2)}%
                {:else}
                  <span class="text-muted-foreground">—</span>
                {/if}
              </td>
              {#if $account.isConnected}
                <td class="px-4 py-3 text-right font-mono">
                  {myStake > 0n ? formatSafe(myStake) : "—"}
                </td>
              {/if}
              <td class="px-4 py-3 text-right">
                {#if r.isRegistered}
                  {#if r.isActive === false}
                    <Badge variant="outline" class="text-warning">Inactive</Badge>
                  {:else}
                    <Badge class="bg-primary/15 text-foreground border-primary/30">Active</Badge>
                  {/if}
                {:else}
                  <Badge variant="destructive">Unregistered</Badge>
                {/if}
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-2">
                  {#if $account.isConnected && myStake > 0n}
                    <Button
                      size="sm"
                      variant="outline"
                      onclick={() => openDialog("unstake", r.address.value, r.name)}
                    >Unstake</Button>
                  {/if}
                  <Button
                    size="sm"
                    disabled={!r.isRegistered}
                    onclick={() => openDialog("stake", r.address.value, r.name)}
                  >Stake</Button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if dialogValidator}
  <DelegateDialog
    bind:open={dialogOpen}
    mode={dialogMode}
    validator={dialogValidator}
    validatorName={dialogValidatorName}
  />
{/if}
