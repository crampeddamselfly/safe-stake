<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import WalletIcon from "@lucide/svelte/icons/wallet"
  import { account, openModal } from "$lib/wallet/appkit"
  import { truncateAddress } from "$lib/utils/format"
</script>

{#if $account.isConnected && $account.address}
  <Button variant="secondary" size="sm" onclick={openModal}>
    <WalletIcon class="size-4" />
    <span class="font-mono">{truncateAddress($account.address)}</span>
  </Button>
{:else}
  <Button variant="default" size="sm" onclick={openModal}>
    <WalletIcon class="size-4" />
    {$account.status === "connecting" || $account.status === "reconnecting"
      ? "Connecting…"
      : "Connect"}
  </Button>
{/if}
