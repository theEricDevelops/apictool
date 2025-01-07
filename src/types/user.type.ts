export type UserTier = 'tier1' | 'tier2' | 'tier3';

// We can add friendly display names for the tiers
export const TIER_DISPLAY_NAMES: Record<UserTier, string> = {
  tier1: 'Basic',
  tier2: 'Advanced',
  tier3: 'Ultimate'
} as const;

export interface User {
  id: string;
  email: string;
  name: string;
  tier: UserTier;
  createdAt: Date;
  updatedAt: Date;
  // Subscription related
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'trial';
  subscriptionEndsAt?: Date;
  // Usage related
  totalConversions: number;
  monthlyConversions: number;
  lastConversionAt?: Date;
  // Preferences
  preferredOutputFormat?: string;
  emailNotifications: boolean;
}

export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'totalConversions' | 'monthlyConversions'>;

export type UpdateUserInput = Partial<Omit<User, 'id' | 'email' | 'createdAt' | 'updatedAt'>>;

export type UserState = Pick<User, 'id' | 'email' | 'name' | 'tier' | 'subscriptionStatus' | 'monthlyConversions'>;