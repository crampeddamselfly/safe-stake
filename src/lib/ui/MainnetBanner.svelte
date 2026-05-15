<script lang="ts">
  import { chainId } from "$lib/wallet/appkit"
</script>

{#if $chainId === 1}
  <div
    role="status"
    class="border-b border-warning/40 bg-warning/10 text-warning"
  >
    <p class="mx-auto max-w-5xl px-4 py-2 text-xs">
      <strong>Mainnet</strong> — these transactions move real SAFE. Double-check
      amounts and validator addresses before signing. This UI is non-custodial:
      it never holds your funds.
    </p>
  </div>
{/if}
