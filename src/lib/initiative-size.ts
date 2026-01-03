/**
 * Centralized initiative size types and utilities
 * This file provides a single source of truth for all initiative size-related functionality
 */

// Initiative size enum values
const INITIATIVE_SIZE = {
  XS: 'xs',
  S: 's',
  M: 'm',
  L: 'l',
  XL: 'xl',
} as const

// Type for initiative size values
export type InitiativeSize =
  (typeof INITIATIVE_SIZE)[keyof typeof INITIATIVE_SIZE]

// Human-readable labels for each size
export const INITIATIVE_SIZE_LABELS: Record<InitiativeSize, string> = {
  [INITIATIVE_SIZE.XS]: 'Extra Small',
  [INITIATIVE_SIZE.S]: 'Small',
  [INITIATIVE_SIZE.M]: 'Medium',
  [INITIATIVE_SIZE.L]: 'Large',
  [INITIATIVE_SIZE.XL]: 'Extra Large',
}

// Short labels for compact display
const INITIATIVE_SIZE_SHORT_LABELS: Record<InitiativeSize, string> = {
  [INITIATIVE_SIZE.XS]: 'XS',
  [INITIATIVE_SIZE.S]: 'S',
  [INITIATIVE_SIZE.M]: 'M',
  [INITIATIVE_SIZE.L]: 'L',
  [INITIATIVE_SIZE.XL]: 'XL',
}

// Default descriptions for sizes (can be customized per organization)
export const INITIATIVE_SIZE_DEFAULT_DESCRIPTIONS: Record<
  InitiativeSize,
  string
> = {
  [INITIATIVE_SIZE.XS]: 'A few days of work, minimal complexity',
  [INITIATIVE_SIZE.S]: '1-2 weeks of work, low complexity',
  [INITIATIVE_SIZE.M]: '2-4 weeks of work, moderate complexity',
  [INITIATIVE_SIZE.L]: '1-2 months of work, high complexity',
  [INITIATIVE_SIZE.XL]: '2+ months of work, very high complexity',
}

// CSS class variants for each size (for badges, buttons, etc.)
const INITIATIVE_SIZE_VARIANTS: Record<InitiativeSize, string> = {
  [INITIATIVE_SIZE.XS]: 'outline',
  [INITIATIVE_SIZE.S]: 'secondary',
  [INITIATIVE_SIZE.M]: 'default',
  [INITIATIVE_SIZE.L]: 'secondary',
  [INITIATIVE_SIZE.XL]: 'destructive',
}

// Array of all initiative sizes for iteration (in order from smallest to largest)
export const ALL_INITIATIVE_SIZES: InitiativeSize[] = [
  INITIATIVE_SIZE.XS,
  INITIATIVE_SIZE.S,
  INITIATIVE_SIZE.M,
  INITIATIVE_SIZE.L,
  INITIATIVE_SIZE.XL,
]

// Type for organization size definitions
export type InitiativeSizeDefinitions = Partial<Record<InitiativeSize, string>>

// Utility functions
export const initiativeSizeUtils = {
  /**
   * Get the human-readable label for an initiative size
   */
  getLabel: (size: InitiativeSize): string => INITIATIVE_SIZE_LABELS[size],

  /**
   * Get the short label for an initiative size
   */
  getShortLabel: (size: InitiativeSize): string =>
    INITIATIVE_SIZE_SHORT_LABELS[size],

  /**
   * Get the CSS variant class for an initiative size
   */
  getVariant: (size: InitiativeSize): string => INITIATIVE_SIZE_VARIANTS[size],

  /**
   * Get the default description for a size
   */
  getDefaultDescription: (size: InitiativeSize): string =>
    INITIATIVE_SIZE_DEFAULT_DESCRIPTIONS[size],

  /**
   * Get the description for a size, using organization custom definition if available
   */
  getDescription: (
    size: InitiativeSize,
    orgDefinitions?: InitiativeSizeDefinitions | null
  ): string => {
    if (orgDefinitions && orgDefinitions[size]) {
      return orgDefinitions[size]!
    }
    return INITIATIVE_SIZE_DEFAULT_DESCRIPTIONS[size]
  },

  /**
   * Get all sizes as options for select elements
   */
  getSelectOptions: (orgDefinitions?: InitiativeSizeDefinitions | null) =>
    ALL_INITIATIVE_SIZES.map(size => ({
      value: size,
      label: INITIATIVE_SIZE_LABELS[size],
      shortLabel: INITIATIVE_SIZE_SHORT_LABELS[size],
      description: initiativeSizeUtils.getDescription(size, orgDefinitions),
    })),

  /**
   * Validate if a string is a valid initiative size
   */
  isValid: (size: string | null | undefined): size is InitiativeSize =>
    size !== null &&
    size !== undefined &&
    ALL_INITIATIVE_SIZES.includes(size as InitiativeSize),

  /**
   * Get size from a string, with fallback to undefined
   */
  fromString: (size: string | null | undefined): InitiativeSize | undefined => {
    if (initiativeSizeUtils.isValid(size)) {
      return size
    }
    return undefined
  },

  /**
   * Compare two sizes (returns -1 if a < b, 0 if equal, 1 if a > b)
   */
  compare: (a: InitiativeSize, b: InitiativeSize): number => {
    const indexA = ALL_INITIATIVE_SIZES.indexOf(a)
    const indexB = ALL_INITIATIVE_SIZES.indexOf(b)
    if (indexA < indexB) return -1
    if (indexA > indexB) return 1
    return 0
  },

  /**
   * Check if size a is smaller than size b
   */
  isSmaller: (a: InitiativeSize, b: InitiativeSize): boolean =>
    initiativeSizeUtils.compare(a, b) < 0,

  /**
   * Check if size a is larger than size b
   */
  isLarger: (a: InitiativeSize, b: InitiativeSize): boolean =>
    initiativeSizeUtils.compare(a, b) > 0,

  /**
   * Sort sizes from smallest to largest
   */
  sort: (sizes: InitiativeSize[]): InitiativeSize[] =>
    [...sizes].sort(initiativeSizeUtils.compare),

  /**
   * Get default size definitions for a new organization
   */
  getDefaultDefinitions: (): InitiativeSizeDefinitions => ({
    ...INITIATIVE_SIZE_DEFAULT_DESCRIPTIONS,
  }),
}

