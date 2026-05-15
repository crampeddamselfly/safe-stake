import { z } from "zod"
import { getAddress, isAddress } from "viem"

const evmAddress = z
  .object({
    value: z.string(),
    format: z.literal("evm")
  })
  .refine((a) => isAddress(a.value), { message: "Invalid EVM address" })
  .transform((a) => ({ value: getAddress(a.value), format: "evm" as const }))

const chainName = z.string().regex(/^[a-z][a-z0-9_-]*$/)

const metadata = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  kind: z.string().regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9-]*){2,}$/),
  description: z.string().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+/),
  lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string()).optional(),
  source: z
    .object({
      repository: z.string().optional(),
      references: z.array(z.string()).optional()
    })
    .optional()
})

// io.denna.defi.address-registry
const addressGroup = z.object({
  description: z.string().optional(),
  source: z.string().optional(),
  entries: z
    .array(
      z.object({
        chain: chainName,
        address: evmAddress,
        notes: z.string().optional()
      })
    )
    .min(1)
})

export const addressRegistrySchema = z.object({
  $schema: z.string(),
  metadata,
  addresses: z.record(z.string(), addressGroup)
})

// io.safe.staking-ui-config
const validatorEntry = z.object({
  address: evmAddress,
  name: z.string().min(1),
  websiteUrl: z.string().url().optional(),
  commissionBps: z.number().int().min(0).max(10_000).optional(),
  description: z.string().optional()
})

const chainEntry = z.object({
  chain: chainName,
  chainId: z.number().int().min(1),
  deployBlock: z.number().int().min(0).optional(),
  rpcUrl: z.string().url().optional(),
  validators: z.array(validatorEntry).default([]),
  rewards: z
    .object({
      merkleJsonUrl: z.string().url().optional(),
      claimWindowSeconds: z.number().int().min(0).optional()
    })
    .optional(),
  features: z
    .object({
      eip5792Batch: z.boolean().default(false),
      geoBlock: z.boolean().default(false),
      sanctionsGate: z.boolean().default(false)
    })
    .default({})
})

export const stakingUiConfigSchema = z.object({
  $schema: z.string(),
  metadata,
  addressRegistry: z.string().optional(),
  chains: z.array(chainEntry).min(1)
})

export type AddressRegistry = z.output<typeof addressRegistrySchema>
export type StakingUiConfig = z.output<typeof stakingUiConfigSchema>
export type ChainEntry = z.output<typeof chainEntry>
export type ValidatorEntry = z.output<typeof validatorEntry>
