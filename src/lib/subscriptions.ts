export const EntityNameValues = [
  'people',
  'initiatives',
  'teams',
  'feedbackcampaigns',
]
export type EntityName = (typeof EntityNameValues)[number]

export type PlanLimits = Record<EntityName, number | undefined | null>
