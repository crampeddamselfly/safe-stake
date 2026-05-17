<script lang="ts">
  import type { Address } from "viem"
  import * as Dialog from "$lib/components/ui/dialog"
  import * as Alert from "$lib/components/ui/alert"
  import { Button } from "$lib/components/ui/button"
  import AlertTriangleIcon from "@lucide/svelte/icons/triangle-alert"
  import AmountInput from "./AmountInput.svelte"
  import WithdrawDelay from "./WithdrawDelay.svelte"
  import TxProgressSteps from "$lib/components/tx/TxProgressSteps.svelte"
  import { buttonLabel, type TxFlow } from "$lib/components/tx/steps"
  import { account, chainId } from "$lib/wallet/appkit"
  import { safeBalanceQuery, stakedAtValidatorQuery } from "$lib/hooks/useStakingReads"
  import { sanctionsQuery } from "$lib/hooks/useSanctions"
  import {
    approveAndStake,
    initiateWithdrawal,
    type TxStep
  } from "$lib/hooks/useStakingWrites"
  import { useQueryClient } from "@tanstack/svelte-query"
  import { truncateAddress } from "$lib/utils/format"
  import { formatContractError } from "$lib/utils/errors"
  import { txUrl } from "$lib/utils/explorer"
  import { toast } from "svelte-sonner"

  let {
    open = $bindable<boolean>(false),
    mode,
    validator,
    validatorName
  }: {
    open: boolean
    mode: "stake" | "unstake"
    validator: Address
    validatorName?: string
  } = $props()

  const balance = safeBalanceQuery()
  const stakedHere = stakedAtValidatorQuery(() => validator)
  const sanctioned = sanctionsQuery()
  const qc = useQueryClient()

  let amount = $state<bigint | undefined>(undefined)
  let step = $state<TxStep>("idle")
  let busy = $state(false)

  const max = $derived(mode === "stake" ? $balance.data : $stakedHere.data)
  const errorText = $derived(
    mode === "stake"
      ? "You do not have enough SAFE to stake."
      : "You do not have enough stake here to unstake."
  )

  const title = $derived(mode === "stake" ? "Stake SAFE" : "Unstake SAFE")
  const subtitle = $derived(
    mode === "stake"
      ? `Stake tokens to validator ${truncateAddress(validator)}`
      : `Unstake from validator ${truncateAddress(validator)}`
  )
  const defaultCta = $derived(mode === "stake" ? "STAKE" : "INITIATE UNSTAKE")
  const hasError = $derived(step === "error")

  // Flow inference for the progress UI — batched path only fires when the
  // wallet signals atomicBatch support, which happens between
  // awaiting-batch-sig and confirming-batch.
  const flow: TxFlow = $derived(
    step === "awaiting-batch-sig" || step === "confirming-batch"
      ? "stake-batched"
      : mode === "stake"
        ? "stake"
        : "unstake"
  )

  const canSubmit = $derived(
    $account.isConnected &&
      !!amount &&
      amount > 0n &&
      !$sanctioned.data &&
      !busy
  )

  function resetState() {
    amount = undefined
    step = "idle"
    busy = false
  }

  async function submit() {
    if (!amount || !$account.address) return
    busy = true
    step = "idle"
    try {
      const res =
        mode === "stake"
          ? await approveAndStake(
              $chainId,
              $account.address,
              validator,
              amount,
              (s) => (step = s)
            )
          : await initiateWithdrawal($chainId, validator, amount, (s) => (step = s))
      step = "done"
      toast.success(mode === "stake" ? "Staked" : "Withdrawal initiated", {
        description: `Tx ${truncateAddress(res.hash)}`,
        action: {
          label: "View",
          onClick: () => window.open(txUrl($chainId, res.hash), "_blank")
        }
      })
      await qc.invalidateQueries()
      resetState()
      open = false
    } catch (err) {
      step = "error"
      toast.error(mode === "stake" ? "Stake failed" : "Unstake failed", {
        description: formatContractError(err)
      })
    } finally {
      busy = false
    }
  }

  $effect(() => {
    if (!open) resetState()
  })
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>
        {subtitle}
        {#if validatorName}
          <span class="text-foreground"> ({validatorName})</span>
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    {#if $sanctioned.data}
      <Alert.Root variant="destructive">
        <AlertTriangleIcon class="size-4" />
        <Alert.Title>Address blocked</Alert.Title>
        <Alert.Description>
          The connected address appears on the sanctions list. Writes are disabled.
        </Alert.Description>
      </Alert.Root>
    {/if}

    <AmountInput
      bind:value={amount}
      {max}
      balanceLabel={mode === "stake" ? "SAFE Balance" : "Your stake"}
      {errorText}
    />

    {#if mode === "stake"}
      <WithdrawDelay />
    {/if}

    {#if step !== "idle"}
      <div class="rounded-md border border-border bg-muted/30 p-4">
        <TxProgressSteps {step} {flow} {hasError} />
      </div>
    {/if}

    <Dialog.Footer>
      <Button onclick={submit} disabled={!canSubmit} class="w-full" size="lg">
        {buttonLabel(step, flow, defaultCta)}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
