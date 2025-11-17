# Clerk Billing Integration Setup

This document explains how to set up Clerk's integrated billing system for the pricing page.

## Overview

The pricing page has been integrated with Clerk's billing system to handle subscriptions using Clerk's official billing components. The integration includes:

- **Solo Plan**: Free tier (redirects to signup)
- **Orchestrator Plan**: $4.99/month with 14-day trial (uses Clerk's `<CheckoutButton />` component)

## Setup Steps

### 1. Enable Billing in Clerk Dashboard

1. Navigate to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Go to **Billing** settings
3. Follow the on-screen instructions to enable billing
4. Connect your Stripe account (Clerk will guide you through this)

### 2. Create Subscription Plans

In the Clerk Dashboard, create your subscription plans:

#### Solo Plan (Free)

- Plan Name: `Solo`
- Price: `$0` (Free)
- Features: Up to 5 employees, 10 open initiatives, 2 concurrent feedback campaigns, 2 teams

#### Orchestrator Plan (Paid)

- Plan Name: `Orchestrator`
- Price: `$4.99/month`
- Trial Period: `14 days`
- Features: Unlimited employees, initiatives, feedback campaigns, and teams

### 3. Configure Environment Variables

Add the following to your `.env` file:

```bash
# Clerk Billing - Orchestrator Plan ID
# Get this from your Clerk Dashboard after creating the plan
NEXT_PUBLIC_CLERK_ORCHESTRATOR_PLAN_ID=plan_xxxxx
```

**How to find the Plan ID:**

1. Go to Clerk Dashboard → Billing → Plans
2. Click on your Orchestrator plan
3. Copy the Plan ID (it will look like `plan_xxxxx`)

### 4. Update Plan IDs in Code (if needed)

If you need to change the plan ID or add more plans, edit `src/app/(marketing)/pricing/page.tsx`:

```typescript
const pricingTiers = [
  {
    // ... Solo plan config
    planId: undefined, // Free plan
  },
  {
    // ... Orchestrator plan config
    planId: process.env.NEXT_PUBLIC_CLERK_ORCHESTRATOR_PLAN_ID,
  },
]
```

## How It Works

### Clerk Organization-Based Subscription Model

Subscriptions are tied to Clerk organizations, which correspond to ManagerOS organizations. Each ManagerOS organization has a corresponding Clerk organization, and subscriptions are managed at the Clerk organization level.

**Key Points:**

- Each ManagerOS organization has a `clerkOrganizationId` that links to a Clerk organization
- Each organization has a `billingUserId` that references the user who selected the subscription (for reference)
- Subscription details (`subscriptionPlanId`, `subscriptionPlanName`, `subscriptionStatus`) are stored on the organization and synced from Clerk
- Subscriptions are created and managed through Clerk's organization billing system
- Limits are enforced at the organization level based on the stored subscription plan
- Users can view existing entities even if over limit, but cannot create new ones (per rule #10)

### Free Plan (Solo)

- Clicking "Get started" redirects users to `/auth/signup`
- When creating an organization, users select the free plan
- Subscription info is stored on the organization with `subscriptionPlanId: 'free'` and `subscriptionPlanName: 'Solo'`
- The creating user becomes the billing user and is assigned the ADMIN role

### Paid Plan (Orchestrator)

1. User clicks "Start 14-day trial" on the `<CheckoutButton />` component
2. Clerk's `CheckoutButton` handles authentication automatically
3. If not signed in, Clerk redirects to signup first
4. If signed in, Clerk opens the checkout drawer/modal
5. After successful subscription, Clerk sends a webhook
6. The webhook handler updates the organization's subscription information
7. The component uses Clerk's official billing UI for a seamless experience

## Webhook Setup

Clerk sends webhooks for subscription events, which are handled in `src/app/api/webhooks/clerk/route.ts`.

### Implemented Webhook Handlers

- **`subscription.created`**: Updates organization subscription when a new subscription is created for a Clerk organization
- **`subscription.updated`**: Updates organization subscription when subscription changes (plan upgrade/downgrade)
- **`subscriptionItem.canceled`**: Marks organization subscription as canceled
- **`organizationMembership.created`**: No longer used - membership is managed directly via Clerk API
- **`organizationMembership.deleted`**: No longer used - membership is managed directly via Clerk API

### How Webhooks Work

1. Clerk sends webhook with `organization_id` (Clerk organization ID), `plan_id`, `plan_name`, and `status`
2. Webhook handler finds the ManagerOS organization by `clerkOrganizationId`
3. Updates the organization's subscription fields (`subscriptionPlanId`, `subscriptionPlanName`, `subscriptionStatus`)
4. Falls back to user-based lookup for backward compatibility (if `organization_id` is not present)

### Additional Webhook Events (Not Yet Implemented)

- `billing.payment.succeeded`
- `billing.payment.failed`

These can be added later if needed for payment tracking or notifications.

## Testing

1. **Test Mode**: Use Stripe test mode in development
2. **Test Cards**: Use Stripe's test cards to simulate different scenarios
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - See [Stripe Testing](https://stripe.com/docs/testing) for more

3. **Test Flow**:
   - Visit `/pricing`
   - Click "Start 14-day trial" on Orchestrator plan
   - Complete the checkout flow
   - Verify subscription in Clerk Dashboard

## Troubleshooting

### Checkout URL Not Working

The checkout URL format may need adjustment based on Clerk's actual billing API. Check the [Clerk Billing Documentation](https://clerk.com/docs/guides/billing/overview) for the latest API endpoints.

If the URL format changes, update `src/app/api/billing/checkout/route.ts`.

### Plan ID Not Found

- Verify `NEXT_PUBLIC_CLERK_ORCHESTRATOR_PLAN_ID` is set in your `.env` file
- Ensure the plan ID matches exactly what's in your Clerk Dashboard
- Restart your development server after adding the environment variable

### Users Not Redirected Properly

- Check that billing is enabled in Clerk Dashboard
- Verify the user is authenticated before checkout
- Check browser console for errors

## Subscription Limits

Subscription limits are enforced at the organization level. Limits are defined in `src/lib/subscription-utils.ts`:

### Solo Plan (Free)

- Max People: 5
- Max Initiatives: 10
- Max Teams: 2
- Max Feedback Campaigns: 2

### Orchestrator Plan (Paid)

- All limits: Unlimited (null)

### Limit Enforcement

- Limits are checked before creating new entities (people, initiatives, teams, feedback campaigns)
- If a limit is exceeded, creation is blocked with an error message
- Users can still view existing entities even if over limit (per rule #10)
- Limit checking is implemented in:
  - `src/lib/actions/person.ts` (createPerson)
  - `src/lib/actions/initiative.ts` (createInitiative)
  - `src/lib/actions/team.ts` (createTeam)
  - `src/lib/actions/feedback-campaign.ts` (createFeedbackCampaign)

## Migration Notes

### Existing Organizations

For existing ManagerOS organizations created before Clerk organization-based billing:

- Clerk organizations are automatically created on first access (when `getOrganizationDetails()` is called)
- The organization slug is used as the Clerk organization slug
- Existing subscription data is preserved
- Users are automatically added to Clerk organizations when they access organization features

### Clerk Organization Creation

- Clerk organizations are created automatically when:
  - A new ManagerOS organization is created
  - An existing organization is accessed for the first time after migration
  - A user accepts an invitation to an organization that doesn't have a Clerk org yet

## Additional Resources

- [Clerk Billing Overview](https://clerk.com/docs/guides/billing/overview)
- [Clerk Billing for B2C SaaS](https://clerk.com/docs/guides/billing/b2c)
- [Clerk Billing for B2B SaaS](https://clerk.com/docs/guides/billing/b2b)
- [Clerk Webhooks](https://clerk.com/docs/integrations/webhooks/overview)
