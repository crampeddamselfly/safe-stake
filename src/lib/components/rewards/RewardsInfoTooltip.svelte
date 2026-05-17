<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip"
  import InfoIcon from "@lucide/svelte/icons/info"

  let {
    proposalUrl = "https://forum.safefoundation.org/",
    learnMoreUrl = "https://docs.safe.global/"
  }: { proposalUrl?: string; learnMoreUrl?: string } = $props()
</script>

<Tooltip.Provider delayDuration={120}>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <button
          {...props}
          type="button"
          aria-label="Reward conditions"
          class="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <InfoIcon class="size-3.5" />
        </button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content
      side="bottom"
      align="start"
      sideOffset={8}
      class="max-w-sm space-y-2 rounded-md bg-foreground p-3.5 text-xs leading-relaxed text-background shadow-lg"
    >
      <p>Rewards are subject to a minimum payout threshold.</p>
      <p>KYC may be required to claim rewards.</p>
      <p>
        Rewards are subject to DAO approval.
        <a
          href={proposalUrl}
          target="_blank"
          rel="noopener"
          class="font-medium underline underline-offset-2 hover:text-primary"
        >
          Follow the proposal here.
        </a>
      </p>
      <p>
        <a
          href={learnMoreUrl}
          target="_blank"
          rel="noopener"
          class="font-medium underline underline-offset-2 hover:text-primary"
        >
          Learn more
        </a>
      </p>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
