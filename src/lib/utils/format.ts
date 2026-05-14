import { formatUnits, type Address } from "viem"

const SAFE_DECIMALS = 18

export function formatSafe(value: bigint | undefined, opts?: { precision?: number }): string {
  if (value === undefined) return "—"
  const raw = formatUnits(value, SAFE_DECIMALS)
  const precision = opts?.precision ?? 4
  const num = Number(raw)
  if (!Number.isFinite(num)) return raw
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision
  })
}

export function truncateAddress(addr: Address | string | undefined): string {
  if (!addr) return ""
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function formatBps(bps: number | undefined): string {
  if (bps === undefined) return "—"
  return `${(bps / 100).toFixed(2)}%`
}

export function formatCountdown(secondsUntil: bigint): string {
  const s = Number(secondsUntil)
  if (s <= 0) return "Ready"
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
