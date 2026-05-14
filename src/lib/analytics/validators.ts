import type { ValidatorRow } from "$lib/hooks/useStakingReads"

export type SortKey = "name" | "totalStaked" | "commissionBps" | "share"
export type SortDir = "asc" | "desc"

export type AnalyticsRow = ValidatorRow & {
  share: number
}

export function decorate(rows: ValidatorRow[], networkTotal: bigint): AnalyticsRow[] {
  const denom = networkTotal > 0n ? Number(networkTotal) : 1
  return rows.map((r) => ({
    ...r,
    share: Number(r.totalStaked) / denom
  }))
}

export function sortRows(rows: AnalyticsRow[], key: SortKey, dir: SortDir): AnalyticsRow[] {
  const sign = dir === "asc" ? 1 : -1
  const copy = [...rows]
  copy.sort((a, b) => {
    switch (key) {
      case "name":
        return a.name.localeCompare(b.name) * sign
      case "totalStaked":
        return (a.totalStaked < b.totalStaked ? -1 : a.totalStaked > b.totalStaked ? 1 : 0) * sign
      case "commissionBps":
        return ((a.commissionBps ?? 0) - (b.commissionBps ?? 0)) * sign
      case "share":
        return (a.share - b.share) * sign
    }
  })
  return copy
}

export function applyRecommendedFilter(rows: AnalyticsRow[]): AnalyticsRow[] {
  return rows.filter(
    (r) => r.isRegistered && (r.commissionBps === undefined || r.commissionBps < 500)
  )
}
