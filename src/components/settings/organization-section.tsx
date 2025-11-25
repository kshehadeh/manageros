interface OrganizationSectionProps {
  organizationId: string | null
  organizationName: string | null
  organizationSlug: string | null
  billingPlanName: string | null
  isAdmin: boolean
}

export function OrganizationSection({
  organizationId,
  organizationName,
  organizationSlug,
}: OrganizationSectionProps) {
  // This component should only be used when user has an organization
  // The settings page redirects users without organizations to /organization/new
  if (!organizationId || !organizationName) {
    return null
  }

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <div>
          <p className='text-sm font-medium'>Organization Name</p>
          <p className='text-sm text-muted-foreground'>{organizationName}</p>
        </div>
        {organizationSlug && (
          <div>
            <p className='text-sm font-medium'>Organization Slug</p>
            <p className='text-sm text-muted-foreground font-mono text-xs'>
              {organizationSlug}
            </p>
          </div>
        )}
        <div>
          <p className='text-sm font-medium'>Organization ID</p>
          <p className='text-sm text-muted-foreground font-mono text-xs'>
            {organizationId}
          </p>
        </div>
      </div>
    </div>
  )
}
