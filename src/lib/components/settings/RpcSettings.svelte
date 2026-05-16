<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import * as Dialog from "$lib/components/ui/dialog"
  import { useQueryClient } from "@tanstack/svelte-query"
  import { rpcOverrides, setRpcOverride } from "$lib/settings/rpc"
  import { clearClientCache } from "$lib/chain/clients"
  import { getAllConfigs, getRpcUrl } from "$lib/spec/loader"

  let { onClose }: { onClose: () => void } = $props()

  const chains = getAllConfigs()
  const qc = useQueryClient()

  let drafts = $state<Record<number, string>>(
    Object.fromEntries(chains.map((c) => [c.chainId, $rpcOverrides[c.chainId] ?? ""]))
  )

  function effectiveSource(chainId: number): string {
    if ($rpcOverrides[chainId]) return "this device"
    const envKey = `VITE_RPC_URL_${chainId}` as const
    if (import.meta.env[envKey]) return "env"
    const specCfg = chains.find((c) => c.chainId === chainId)
    if (specCfg?.rpcUrl) return "spec"
    return "viem default"
  }

  function save() {
    for (const [k, v] of Object.entries(drafts)) {
      setRpcOverride(Number(k), v.trim() || undefined)
    }
    clearClientCache()
    qc.invalidateQueries()
    onClose()
  }

  function reset(chainId: number) {
    drafts[chainId] = ""
  }
</script>

<div class="flex flex-col gap-5">
  {#each chains as c (c.chainId)}
    <div class="flex flex-col gap-2">
      <div class="flex items-baseline justify-between">
        <Label for="rpc-{c.chainId}" class="capitalize">
          {c.chain} <span class="text-muted-foreground">({c.chainId})</span>
        </Label>
        <span class="text-xs text-muted-foreground">
          using: {effectiveSource(c.chainId)}
        </span>
      </div>
      <div class="flex gap-2">
        <Input
          id="rpc-{c.chainId}"
          type="url"
          placeholder={getRpcUrl(c.chainId) ?? "https://…"}
          bind:value={drafts[c.chainId]}
          class="font-mono text-xs"
        />
        <Button variant="ghost" size="sm" onclick={() => reset(c.chainId)}>
          Clear
        </Button>
      </div>
    </div>
  {/each}
</div>

<Dialog.Footer>
  <Button variant="ghost" onclick={onClose}>Cancel</Button>
  <Button onclick={save}>Save</Button>
</Dialog.Footer>
