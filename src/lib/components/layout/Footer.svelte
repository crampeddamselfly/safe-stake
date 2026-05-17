<script lang="ts">
  import Container from "./Container.svelte"
</script>

<footer class="border-t border-border py-10">
  <Container>
    <div
      class="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        Independent Track A operator submission to the
        <a
          class="underline-offset-4 hover:underline"
          href="https://forum.safefoundation.org/t/rfp-safenet-beta-staking-ui-call-for-operators/6992"
          >Safe Foundation RFP</a
        >. Non-custodial. Open source on
        <a
          class="underline-offset-4 hover:underline"
          href="https://github.com/daocraft/safe-stake">GitHub</a
        >.
      </p>
      <p class="shrink-0">
        by
        <a
          class="font-medium text-foreground underline-offset-4 hover:underline"
          href="https://denna.io"
          target="_blank"
          rel="noopener">Denna Labs</a
        >
      </p>
    </div>
  </Container>
</footer>
