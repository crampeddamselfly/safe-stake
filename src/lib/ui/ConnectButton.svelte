<script lang="ts">
  import Button from "./Button.svelte"
  import { account, openModal } from "$lib/wallet/appkit"
  import { truncateAddress } from "$lib/utils/format"
</script>

<Button variant="primary" onclick={openModal}>
  {#if $account.isConnected && $account.address}
    {truncateAddress($account.address)}
  {:else if $account.status === "connecting" || $account.status === "reconnecting"}
    Connecting…
  {:else}
    Connect wallet
  {/if}
</Button>
