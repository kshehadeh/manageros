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
import { ClipboardList } from 'lucide-react'
import { StartOnboardingModal } from '@/components/onboarding/start-onboarding-modal'
import type { Person } from '@/generated/prisma'

interface OnboardingEmptyStateCardProps {
  person: Pick<Person, 'id' | 'name' | 'teamId' | 'jobRoleId' | 'managerId'>
  people: Pick<Person, 'id' | 'name'>[]
}

export function OnboardingEmptyStateCard({
  person,
  people,
}: OnboardingEmptyStateCardProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Card className='flex-1 min-w-[300px]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ClipboardList className='w-5 h-5' />
            Start the Onboarding Process
          </CardTitle>
          <CardDescription>
            Onboarding helps new team members get up to speed with structured
            checklists, tasks, and milestones. Assign an onboarding template to
            guide them through their first days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant='outline'
            className='w-full'
            onClick={() => setShowModal(true)}
          >
            Start Onboarding
          </Button>
        </CardContent>
      </Card>
      <StartOnboardingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        person={person}
        people={people}
      />
    </>
  )
}
