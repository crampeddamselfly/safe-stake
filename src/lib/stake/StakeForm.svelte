<script lang="ts">
  import type { Address } from "viem"
  import AmountInput from "./AmountInput.svelte"
  import ValidatorPicker from "./ValidatorPicker.svelte"
  import Button from "$lib/ui/Button.svelte"
  import { pushToast } from "$lib/ui/Toaster.svelte"
  import { account, chainId, openModal } from "$lib/wallet/appkit"
  import { safeBalanceQuery, allowanceQuery } from "$lib/hooks/useStakingReads"
  import { sanctionsQuery } from "$lib/hooks/useSanctions"
  import {
    approveAndStake,
    type TxStep
  } from "$lib/hooks/useStakingWrites"
  import { useQueryClient } from "@tanstack/svelte-query"
  import { truncateAddress } from "$lib/utils/format"

  const balance = safeBalanceQuery()
  const allowance = allowanceQuery()
  const sanctioned = sanctionsQuery()
  const qc = useQueryClient()

  let validator = $state<Address | undefined>(undefined)
  let amount = $state<bigint | undefined>(undefined)
  let step = $state<TxStep>("idle")
  let busy = $state(false)

  const stepLabel: Record<TxStep, string> = {
    idle: "Stake",
    approving: "Approving…",
    staking: "Staking…",
    confirming: "Confirming…",
    done: "Done",
    error: "Retry"
  }

  const canSubmit = $derived(
    $account.isConnected &&
      !!validator &&
      !!amount &&
      amount > 0n &&
      !$sanctioned.data &&
      !busy
  )

  async function submit() {
    if (!validator || !amount || !$account.address) return
    busy = true
    step = "idle"
    try {
      const res = await approveAndStake($chainId, validator, amount, (s) => (step = s))
      step = "done"
      pushToast({
        kind: "success",
        title: "Staked",
        detail: `Tx ${truncateAddress(res.hash)}`
      })
      await qc.invalidateQueries()
    } catch (err) {
      step = "error"
      pushToast({
        kind: "error",
        title: "Stake failed",
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
      Connect a wallet to stake SAFE.
      <button class="ml-2 underline" onclick={openModal}>Connect</button>
    </div>
  {/if}

  {#if $sanctioned.data}
    <div role="alert" class="rounded-md border border-danger bg-bg-elev-2 p-4 text-sm text-danger">
      This address appears on the sanctions list. Writes are disabled.
    </div>
  {/if}

  <ValidatorPicker bind:value={validator} />
  <AmountInput bind:value={amount} max={$balance.data} />

  {#if amount && $allowance.data !== undefined && $allowance.data < amount}
    <p class="text-xs text-fg-muted">
      One approval required before staking. We will batch into a single transaction
      on Safe wallets that support EIP-5792.
    </p>
  {/if}

  <Button
    onclick={submit}
    disabled={!canSubmit}
    loading={busy}
    class="w-full"
    size="lg"
  >
    {stepLabel[step]}
  </Button>
</div>
