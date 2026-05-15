import { createQuery } from "@tanstack/svelte-query"
import { getAddress, type Address } from "viem"

export type ValidatorMeta = {
  address: Address
  label: string
  commissionBps: number
  isActive: boolean
  participationRateBps: number
}

const DEFAULT_URL =
  "https://raw.githubusercontent.com/safe-fndn/safenet-beta-data/refs/heads/main/assets/validator-info.json"

type RawValidator = {
  address: string
  label?: string
  commission?: number
  is_active?: boolean
  participation_rate_14d?: number
}

function isRaw(v: unknown): v is RawValidator {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as RawValidator).address === "string"
  )
}

export async function fetchValidatorMeta(): Promise<Map<Address, ValidatorMeta>> {
  const res = await fetch(DEFAULT_URL)
  if (!res.ok) throw new Error(`validator-info ${res.status}`)
  const text = await res.text()
  // Reference repo sanitizes trailing/empty commas — copy that.
  const sanitized = text.replace(/,\s*,/g, ",").replace(/,\s*([}\]])/g, "$1")
  const json: unknown = JSON.parse(sanitized)
  if (!Array.isArray(json)) throw new Error("expected array")
  const map = new Map<Address, ValidatorMeta>()
  for (const v of json) {
    if (!isRaw(v)) continue
    try {
      const addr = getAddress(v.address)
      map.set(addr, {
        address: addr,
        label: v.label ?? addr,
        commissionBps: Math.round((v.commission ?? 0) * 10_000),
        isActive: v.is_active ?? true,
        participationRateBps: Math.round((v.participation_rate_14d ?? 0) * 10_000)
      })
    } catch {
      // skip malformed address
    }
  }
  return map
}

export function validatorMetaQuery() {
  return createQuery({
    queryKey: ["validator-meta"],
    queryFn: fetchValidatorMeta,
    staleTime: 5 * 60_000
  })
}
