<script lang="ts">
  import Card from "$lib/ui/Card.svelte"
  import Button from "$lib/ui/Button.svelte"
  import { validatorsQuery, totalStakedQuery } from "$lib/hooks/useStakingReads"
  import {
    decorate,
    sortRows,
    applyRecommendedFilter,
    type SortKey,
    type SortDir
  } from "$lib/analytics/validators"
  import { toCsv, downloadCsv } from "$lib/analytics/export"
  import { formatSafe, formatBps, truncateAddress } from "$lib/utils/format"

  const validators = validatorsQuery()
  const totalStaked = totalStakedQuery()

  let sortKey = $state<SortKey>("totalStaked")
  let sortDir = $state<SortDir>("desc")
  let recommendedOnly = $state(false)
  let query = $state("")

  const rows = $derived.by(() => {
    if (!$validators.data) return []
    const decorated = decorate($validators.data, $totalStaked.data ?? 0n)
    const filtered = recommendedOnly ? applyRecommendedFilter(decorated) : decorated
    const searched = query
      ? filtered.filter(
          (r) =>
            r.name.toLowerCase().includes(query.toLowerCase()) ||
            r.address.value.toLowerCase().includes(query.toLowerCase())
        )
      : filtered
    return sortRows(searched, sortKey, sortDir)
  })

  function toggleSort(k: SortKey) {
    if (sortKey === k) {
      sortDir = sortDir === "asc" ? "desc" : "asc"
    } else {
      sortKey = k
      sortDir = "desc"
    }
  }

  function exportCsv() {
    const csv = toCsv(
      rows.map((r) => ({
        name: r.name,
        address: r.address.value,
        isRegistered: r.isRegistered ? "yes" : "no",
        commissionBps: r.commissionBps ?? "",
        totalStakedSafe: formatSafe(r.totalStaked, { precision: 6 }),
        sharePercent: (r.share * 100).toFixed(4)
      }))
    )
    downloadCsv(`safenet-validators-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  function sortIndicator(k: SortKey) {
    if (sortKey !== k) return ""
    return sortDir === "asc" ? " ▲" : " ▼"
  }
</script>

<svelte:head>
  <title>Validators — Safe Stake</title>
</svelte:head>

<Card title="Validators" description="Independent operator view. All data read directly from the staking contract.">
  <div class="mb-4 flex flex-wrap items-center gap-3">
    <input
      type="search"
      placeholder="Search by name or address…"
      bind:value={query}
      aria-label="Search validators"
      class="flex-1 rounded-md border border-border bg-bg-elev-2 px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none"
    />
    <label class="flex items-center gap-2 text-sm text-fg-muted">
      <input type="checkbox" bind:checked={recommendedOnly} />
      Recommended (commission &lt; 5%, registered)
    </label>
    <Button variant="secondary" onclick={exportCsv} disabled={rows.length === 0}>
      Export CSV
    </Button>
  </div>

  {#if $validators.isLoading}
    <p class="text-sm text-fg-muted">Loading validators…</p>
  {:else if rows.length === 0}
    <p class="text-sm text-fg-muted">No validators in this chain's config yet. Operators can add them in <code>config/safe-staking-*.denna-spec.json</code>.</p>
  {:else}
    <div class="overflow-x-auto rounded-md border border-border">
      <table class="w-full text-sm">
        <thead class="bg-bg-elev-2 text-fg-muted">
          <tr>
            <th class="px-3 py-2 text-left">
              <button class="font-medium" onclick={() => toggleSort("name")}>
                Name{sortIndicator("name")}
              </button>
            </th>
            <th class="px-3 py-2 text-left">Address</th>
            <th class="px-3 py-2 text-right">
              <button class="font-medium" onclick={() => toggleSort("commissionBps")}>
                Commission{sortIndicator("commissionBps")}
              </button>
            </th>
            <th class="px-3 py-2 text-right">
              <button class="font-medium" onclick={() => toggleSort("totalStaked")}>
                Total staked{sortIndicator("totalStaked")}
              </button>
            </th>
            <th class="px-3 py-2 text-right">
              <button class="font-medium" onclick={() => toggleSort("share")}>
                Share{sortIndicator("share")}
              </button>
            </th>
            <th class="px-3 py-2 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as r (r.address.value)}
            <tr class="border-t border-border">
              <td class="px-3 py-2">
                {#if r.websiteUrl}
                  <a class="text-fg underline" href={r.websiteUrl} target="_blank" rel="noopener">{r.name}</a>
                {:else}
                  <span class="text-fg">{r.name}</span>
                {/if}
                {#if r.description}
                  <p class="text-xs text-fg-muted">{r.description}</p>
                {/if}
              </td>
              <td class="px-3 py-2 font-mono text-xs">{truncateAddress(r.address.value)}</td>
              <td class="px-3 py-2 text-right">{formatBps(r.commissionBps)}</td>
              <td class="px-3 py-2 text-right font-mono">{formatSafe(r.totalStaked)}</td>
              <td class="px-3 py-2 text-right">{(r.share * 100).toFixed(2)}%</td>
              <td class="px-3 py-2 text-right">
                {#if r.isRegistered}
                  <span class="rounded-sm bg-accent/20 px-2 py-0.5 text-xs text-accent">Registered</span>
                {:else}
                  <span class="rounded-sm bg-warning/20 px-2 py-0.5 text-xs text-warning">Unregistered</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</Card>
