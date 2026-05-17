<script lang="ts">
  import type { Address } from "viem"
  import { Button } from "$lib/components/ui/button"
  import { Badge } from "$lib/components/ui/badge"
  import { Skeleton } from "$lib/components/ui/skeleton"
  import {
    validatorsQuery,
    userStakesQuery
  } from "$lib/hooks/useStakingReads"
  import { validatorMetaQuery } from "$lib/hooks/useValidatorMeta"
  import { account } from "$lib/wallet/appkit"
  import { formatSafe, truncateAddress } from "$lib/utils/format"
  import { addressUrl } from "$lib/utils/explorer"
  import { chainId } from "$lib/wallet/appkit"
  import DelegateDialog from "$lib/components/staking/DelegateDialog.svelte"
  import ExternalLinkIcon from "@lucide/svelte/icons/external-link"
  import CompassIcon from "@lucide/svelte/icons/compass"
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right"
  import { cn } from "$lib/utils/cn"
  import { base } from "$app/paths"

  const validators = validatorsQuery()
  const stakes = userStakesQuery()
  const meta = validatorMetaQuery()

  type Row = {
    address: Address
    name: string
    amount: bigint
    participationRateBps?: number
    isRegistered: boolean
    isActive?: boolean
  }

  const rows = $derived.by<Row[]>(() => {
    if (!$validators.data || !$stakes.data) return []
    return $validators.data
      .map((v): Row | null => {
        const amount = $stakes.data?.[v.address.value] ?? 0n
        if (amount <= 0n) return null
        const m = $meta.data?.get(v.address.value)
        return {
          address: v.address.value,
          name: v.name,
          amount,
          participationRateBps: m?.participationRateBps,
          isRegistered: v.isRegistered,
          isActive: m?.isActive
        }
      })
      .filter((r): r is Row => r !== null)
      .sort((a, b) => (a.amount > b.amount ? -1 : a.amount < b.amount ? 1 : 0))
  })

  let dialogOpen = $state(false)
  let dialogValidator = $state<Address | undefined>(undefined)
  let dialogValidatorName = $state<string | undefined>(undefined)

  function openUnstake(addr: Address, name: string) {
    dialogValidator = addr
    dialogValidatorName = name
    dialogOpen = true
  }

  const loading = $derived(
    $account.isConnected && ($validators.isLoading || $stakes.isLoading)
  )
</script>

<section aria-labelledby="delegations-heading" class="flex flex-col gap-4">
  <div class="flex items-baseline justify-between gap-4">
    <h2
      id="delegations-heading"
      class="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground"
    >
      Your delegations
    </h2>
    {#if rows.length > 0}
      <span class="font-mono text-xs text-muted-foreground tabular-nums">
        {rows.length} {rows.length === 1 ? "validator" : "validators"}
      </span>
    {/if}
  </div>

  {#if !$account.isConnected}
    <div
      class="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border bg-card/40 p-8"
    >
      <CompassIcon class="size-5 text-muted-foreground" />
      <p class="text-sm text-foreground">
        Connect a wallet to see the validators you've staked with.
      </p>
    </div>
  {:else if loading}
    <div class="flex flex-col gap-2">
      <Skeleton class="h-14 w-full" />
      <Skeleton class="h-14 w-full" />
      <Skeleton class="h-14 w-full" />
    </div>
  {:else if rows.length === 0}
    <div
      class="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border bg-card/40 p-8"
    >
      <CompassIcon class="size-5 text-muted-foreground" />
      <div class="flex flex-col gap-1">
        <p class="text-sm font-medium text-foreground">
          You haven't delegated yet.
        </p>
        <p class="text-sm text-muted-foreground">
          Stake SAFE to a validator to start earning toward the next reward
          drop.
        </p>
      </div>
      <Button variant="outline" size="sm" href="{base}/">
        Visit validators
        <ArrowRightIcon class="size-4" />
      </Button>
    </div>
  {:else}
    <div class="overflow-x-auto rounded-lg bg-card ring-1 ring-border">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border text-muted-foreground">
            <th class="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.14em]">
              Validator
            </th>
            <th class="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.14em]">
              SAFE amount
            </th>
            <th class="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.14em]">
              Participation (14d)
            </th>
            <th class="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.14em]">
              Status
            </th>
            <th class="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.14em]">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {#each rows as r (r.address)}
            <tr
              class={cn(
                "border-b border-border/60 transition-colors last:border-b-0",
                "hover:bg-muted/40"
              )}
            >
              <td class="px-4 py-4">
                <div class="flex flex-col gap-0.5">
                  <span class="font-medium text-foreground">{r.name}</span>
                  <a
                    href={addressUrl($chainId, r.address)}
                    target="_blank"
                    rel="noopener"
                    class="inline-flex w-fit items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {truncateAddress(r.address)}
                    <ExternalLinkIcon class="size-3" />
                  </a>
                </div>
              </td>
              <td class="px-4 py-4 text-right font-mono tabular-nums">
                {formatSafe(r.amount)}
                <span class="ml-1 text-xs text-muted-foreground">SAFE</span>
              </td>
              <td class="px-4 py-4 text-right font-mono tabular-nums">
                {#if r.participationRateBps !== undefined}
                  {(r.participationRateBps / 100).toFixed(2)}%
                {:else}
                  <span class="text-muted-foreground">—</span>
                {/if}
              </td>
              <td class="px-4 py-4 text-right">
                {#if r.isRegistered}
                  {#if r.isActive === false}
                    <Badge variant="outline" class="text-warning">Inactive</Badge>
                  {:else}
                    <Badge
                      class="border-primary/30 bg-primary/15 text-foreground"
                    >Active</Badge>
                  {/if}
                {:else}
                  <Badge variant="destructive">Unregistered</Badge>
                {/if}
              </td>
              <td class="px-4 py-4 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => openUnstake(r.address, r.name)}
                >
                  Unstake
                </Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

{#if dialogValidator}
  <DelegateDialog
    bind:open={dialogOpen}
    mode="unstake"
    validator={dialogValidator}
    validatorName={dialogValidatorName}
  />
{/if}
