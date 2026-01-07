/**
 * Display integration links for an entity (Person, etc.)
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import { LinkIntegrationDialog } from './link-integration-dialog'
import { unlinkEntityFromIntegration } from '@/lib/actions/integrations'
import { integrationTypeLabels } from '@/lib/integrations/constants'
import type { IntegrationType } from '@/lib/integrations/base-integration'
import { toast } from 'sonner'

interface IntegrationLink {
  id: string
  integration: {
    id: string
    name: string
    integrationType: string
    scope: string
  }
  externalEntityId: string
  externalEntityUrl?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: Date
}

interface EntityIntegrationLinksProps {
  entityType: string
  entityId: string
  links: IntegrationLink[]
  onRefresh: () => void
}

export function EntityIntegrationLinks({
  entityType,
  entityId,
  links,
  onRefresh,
}: EntityIntegrationLinksProps) {
  const router = useRouter()
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)

  const handleUnlink = async (linkId: string) => {
    try {
      await unlinkEntityFromIntegration(linkId)
      toast.success('Link removed successfully')
      router.refresh()
      onRefresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove link'
      )
    }
  }

  const handleLinkSuccess = () => {
    router.refresh()
    onRefresh()
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h4 className='text-sm font-medium'>External Links</h4>
        <Button
          size='sm'
          variant='outline'
          onClick={() => setIsLinkDialogOpen(true)}
        >
          <Plus className='w-4 h-4 mr-1' />
          Link
        </Button>
      </div>

      {links.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          No external links configured.
        </p>
      ) : (
        <div className='space-y-2'>
          {links.map(link => (
            <div
              key={link.id}
              className='flex items-center justify-between p-2 border rounded-md'
            >
              <div className='flex items-center gap-2 flex-1 min-w-0'>
                <Badge variant='secondary'>
                  {integrationTypeLabels[
                    link.integration.integrationType as IntegrationType
                  ] || link.integration.integrationType}
                </Badge>
                <span className='text-sm truncate'>
                  {link.externalEntityId}
                </span>
                {link.externalEntityUrl && (
                  <a
                    href={link.externalEntityUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-muted-foreground hover:text-foreground'
                  >
                    <ExternalLink className='w-3 h-3' />
                  </a>
                )}
              </div>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => handleUnlink(link.id)}
                className='text-destructive hover:text-destructive'
              >
                <Trash2 className='w-4 h-4' />
              </Button>
            </div>
          ))}
        </div>
      )}

      <LinkIntegrationDialog
        open={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
        entityType={entityType}
        entityId={entityId}
        onSuccess={handleLinkSuccess}
      />
    </div>
  )
}
