<script lang="ts">
  import type { Address } from "viem"
  import AmountInput from "./AmountInput.svelte"
  import ValidatorPicker from "./ValidatorPicker.svelte"
  import Button from "$lib/ui/Button.svelte"
  import { pushToast } from "$lib/ui/Toaster.svelte"
  import { account, chainId, openModal } from "$lib/wallet/appkit"
  import { sanctionsQuery } from "$lib/hooks/useSanctions"
  import { initiateWithdrawal } from "$lib/hooks/useStakingWrites"
  import { stakedBalanceQuery } from "$lib/hooks/useStakingReads"
  import { useQueryClient } from "@tanstack/svelte-query"
  import { truncateAddress } from "$lib/utils/format"
  import { formatContractError } from "$lib/utils/errors"
  import { txUrl } from "$lib/utils/explorer"

  const staked = stakedBalanceQuery()
  const sanctioned = sanctionsQuery()
  const qc = useQueryClient()

  let validator = $state<Address | undefined>(undefined)
  let amount = $state<bigint | undefined>(undefined)
  let busy = $state(false)

  const canSubmit = $derived(
    $account.isConnected &&
      !!validator &&
      !!amount &&
      amount > 0n &&
      !$sanctioned.data &&
      !busy
  )

  async function submit() {
    if (!validator || !amount) return
    busy = true
    try {
      const res = await initiateWithdrawal($chainId, validator, amount)
      pushToast({
        kind: "success",
        title: "Withdrawal initiated",
        detail: `Tx ${truncateAddress(res.hash)} — cooldown begins now.`,
        link: { href: txUrl($chainId, res.hash), label: "View on Etherscan" }
      })
      await qc.invalidateQueries()
    } catch (err) {
      pushToast({
        kind: "error",
        title: "Withdrawal failed",
        detail: formatContractError(err)
      })
    } finally {
      busy = false
    }
  }
</script>

<div class="flex flex-col gap-5">
  {#if !$account.isConnected}
    <div class="rounded-md border border-border bg-bg-elev-2 p-4 text-sm text-fg-muted">
      Connect a wallet to initiate a withdrawal.
      <button class="ml-2 underline" onclick={openModal}>Connect</button>
    </div>
  {/if}

  {#if $sanctioned.data}
    <div role="alert" class="rounded-md border border-danger bg-bg-elev-2 p-4 text-sm text-danger">
      This address appears on the sanctions list. Writes are disabled.
    </div>
  {/if}

  <ValidatorPicker bind:value={validator} />
  <AmountInput bind:value={amount} max={$staked.data} label="Amount to withdraw" />

  <p class="text-xs text-fg-muted">
    Withdrawal enters a FIFO cooldown queue. You can claim once the on-chain
    cooldown elapses on the Claim tab.
  </p>

  <Button
    onclick={submit}
    disabled={!canSubmit}
    loading={busy}
    class="w-full"
    size="lg"
  >Initiate withdrawal</Button>
</div>
