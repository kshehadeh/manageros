'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Rocket, Link as LinkIcon } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { AssociateInitiativeModal } from './associate-initiative-modal'

interface InitiativesEmptyStateCardProps {
  personId: string
  organizationId: string
  existingInitiativeIds: string[]
}

export function InitiativesEmptyStateCard({
  personId,
  organizationId,
  existingInitiativeIds,
}: InitiativesEmptyStateCardProps) {
  const [showAssociateModal, setShowAssociateModal] = useState(false)

  return (
    <>
      <Card className='flex-1 min-w-[300px]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Rocket className='w-5 h-5' />
            Start with an Initiative
          </CardTitle>
          <CardDescription>
            Initiatives are long-term goals or OKRs that help organize work.
            Create an initiative to track progress on important projects and
            objectives, or associate an existing initiative.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          <Button asChild variant='outline' className='w-full'>
            <Link href={`/initiatives/new?ownerId=${personId}`}>
              Create Initiative
              <Rocket className='w-4 h-4 ml-2' />
            </Link>
          </Button>
          <Button
            variant='outline'
            className='w-full'
            onClick={() => setShowAssociateModal(true)}
          >
            Associate Existing Initiative
            <LinkIcon className='w-4 h-4 ml-2' />
          </Button>
        </CardContent>
      </Card>
      <AssociateInitiativeModal
        isOpen={showAssociateModal}
        onClose={() => setShowAssociateModal(false)}
        personId={personId}
        organizationId={organizationId}
        existingInitiativeIds={existingInitiativeIds}
      />
    </>
  )
}
