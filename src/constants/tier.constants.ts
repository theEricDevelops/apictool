import { UserTier } from '@/types/user.type';

export const DEFAULT_USER_TIER: UserTier = 'tier1';

export const TIER_LIMITS: Record<UserTier, number> = {
  tier1: 1,
  tier2: 10,
  tier3: 20,
} as const;

export const MONTHLY_CONVERSION_LIMITS: Record<UserTier, number> = {
  tier1: 50,
  tier2: 1000,
  tier3: 5000,
} as const;

export const MAXIMUM_FILE_SIZE: Record<UserTier, number> = {
  tier1: 5 * 1024 * 1024,  // 5MB
  tier2: 25 * 1024 * 1024, // 25MB
  tier3: 100 * 1024 * 1024, // 100MB
} as const;

export const TIER_PRICING: Record<Exclude<UserTier, 'tier1'>, number> = {
  tier2: 9.99,
  tier3: 19.99,
} as const;