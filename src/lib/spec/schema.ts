import { z } from "zod"
import { getAddress, isAddress } from "viem"

const evmAddress = z
  .object({
    value: z.string(),
    format: z.literal("evm")
  })
  .refine((a) => isAddress(a.value), {
    message: "Invalid EVM address"
  })
  .transform((a) => ({
    value: getAddress(a.value),
    format: "evm" as const
  }))

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

const validatorEntry = z.object({
  address: evmAddress,
  name: z.string().min(1),
  websiteUrl: z.string().url().optional(),
  commissionBps: z.number().int().min(0).max(10_000).optional(),
  description: z.string().optional()
})

export const stakingConfigSchema = z.object({
  $schema: z.string(),
  metadata,
  chainId: z.number().int().min(1),
  chainName: z.string().regex(/^[a-z][a-z0-9_-]*$/),
  deployBlock: z.number().int().min(0).optional(),
  rpcUrl: z.string().url().optional(),
  contracts: z.object({
    staking: evmAddress,
    safeToken: evmAddress,
    sanctionsOracle: evmAddress.optional(),
    merkleDrop: evmAddress.optional()
  }),
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

export type StakingConfig = z.output<typeof stakingConfigSchema>
export type ValidatorEntry = z.output<typeof validatorEntry>
