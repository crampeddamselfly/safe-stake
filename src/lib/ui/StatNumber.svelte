<script lang="ts">
  let {
    label,
    value,
    suffix = "SAFE",
    hint
  }: { label: string; value: string; suffix?: string; hint?: string } = $props()
</script>

<div class="flex flex-col gap-1">
  <span class="text-xs uppercase tracking-wide text-fg-muted">{label}</span>
  <span class="font-mono text-2xl text-fg tabular-nums">
    {value}
    <span class="ml-1 text-sm font-normal text-fg-muted">{suffix}</span>
  </span>
  {#if hint}
    <span class="text-xs text-fg-muted">{hint}</span>
  {/if}
</div>
