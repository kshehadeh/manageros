/**
 * TypeScript types for Clerk API responses
 * These types correspond to Clerk's REST API response schemas
 */

/**
 * Fee structure used in Clerk billing plans
 */
export interface ClerkFee {
  amount: number
  amount_formatted: string
  currency: string
  currency_symbol: string
}

/**
 * Clerk Commerce Plan Feature
 */
export interface ClerkCommercePlanFeature {
  object: 'feature'
  id: string
  name: string
  description: string
  slug: string
  avatar_url: string
}

/**
 * Clerk Commerce Plan object
 * Represents a billing plan in Clerk's commerce system
 */
export interface ClerkCommercePlan {
  object: 'commerce_plan'
  id: string
  name: string
  fee: ClerkFee
  annual_monthly_fee: ClerkFee | null
  annual_fee: ClerkFee | null
  description: string | null
  product_id: string
  is_default: boolean
  is_recurring: boolean
  publicly_visible: boolean
  has_base_fee: boolean
  for_payer_type: string
  slug: string
  avatar_url: string | null
  features?: ClerkCommercePlanFeature[]
  free_trial_enabled: boolean
  free_trial_days: number | null
}

/**
 * Response from Clerk's billing/plans API endpoint
 * GET /v1/billing/plans
 */
export interface ClerkBillingPlansResponse {
  data: ClerkCommercePlan[]
  total_count: number
}

/**
 * Clerk Commerce Payer
 */
export interface ClerkCommercePayer {
  object: 'commerce_payer'
  id: string
  instance_id: string
  user_id: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  organization_id: string | null
  organization_name: string | null
  image_url: string
  created_at: number
  updated_at: number
}

/**
 * Clerk Commerce Payment Method
 */
export interface ClerkCommercePaymentMethod {
  object: 'commerce_payment_method'
  id: string
  payer_id: string
  payment_type: 'card' | 'link'
  is_default: boolean
  gateway: string
  gateway_external_id: string
  gateway_external_account_id: string | null
  last4: string | null
  status: 'active' | 'disconnected'
  wallet_type: string | null
  card_type: string | null
  expiry_year: number | null
  expiry_month: number | null
  created_at: number
  updated_at: number
  is_removable: boolean
}

/**
 * Credit information for subscription items
 */
export interface ClerkSubscriptionItemCredit {
  amount: ClerkFee | null
  cycle_remaining_percent: number
}

/**
 * Next payment information
 */
export interface ClerkNextPayment {
  date: number | null
  amount: ClerkFee | null
}

/**
 * Lifetime paid amount
 */
export interface ClerkLifetimePaid {
  amount: number
  amount_formatted: string
  currency: string
  currency_symbol: string
}

/**
 * Clerk Commerce Subscription Item
 * Represents an individual item within a subscription
 */
export interface ClerkCommerceSubscriptionItem {
  object: 'commerce_subscription_item'
  id: string
  instance_id: string
  status:
    | 'active'
    | 'canceled'
    | 'expired'
    | 'ended'
    | 'past_due'
    | 'upcoming'
    | 'incomplete'
    | 'abandoned'
  plan_id: string | null
  plan: ClerkCommercePlan | null
  plan_period: 'month' | 'annual'
  payment_method?: ClerkCommercePaymentMethod
  lifetime_paid?: ClerkLifetimePaid
  next_payment?: ClerkNextPayment | null
  payer_id: string
  payer?: ClerkCommercePayer
  credit?: ClerkSubscriptionItemCredit
  is_free_trial: boolean
  period_start: number
  period_end: number | null
  proration_date?: string
  canceled_at: number | null
  past_due_at: number | null
  ended_at: number | null
  created_at: number
  updated_at: number
}

/**
 * Clerk Commerce Subscription
 * Represents a subscription in Clerk's commerce system
 */
export interface ClerkCommerceSubscription {
  object: 'commerce_subscription'
  id: string
  instance_id: string
  status:
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'ended'
    | 'abandoned'
    | 'incomplete'
  payer_id: string
  created_at: number
  updated_at: number
  active_at: number | null
  past_due_at: number | null
  subscription_items: ClerkCommerceSubscriptionItem[]
  next_payment?: {
    date: number
    amount: ClerkFee
  }
  eligible_for_free_trial?: boolean
}
