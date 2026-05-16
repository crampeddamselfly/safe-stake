<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import SettingsIcon from "@lucide/svelte/icons/settings"
  import RpcSettings from "./RpcSettings.svelte"

  let open = $state(false)
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="icon" aria-label="Open settings" title="Settings">
        <SettingsIcon class="size-4" />
      </Button>
    {/snippet}
  </Dialog.Trigger>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>RPC settings</Dialog.Title>
      <Dialog.Description>
        Override the public RPC endpoint per chain. Stored on this device only.
        Precedence: device override → <code>VITE_RPC_URL_&lt;chainId&gt;</code> →
        spec → viem default.
      </Dialog.Description>
    </Dialog.Header>
    <RpcSettings onClose={() => (open = false)} />
  </Dialog.Content>
</Dialog.Root>
