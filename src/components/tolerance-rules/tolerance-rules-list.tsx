'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  toggleToleranceRule,
  deleteToleranceRule,
} from '@/lib/actions/tolerance-rules'
import type {
  Feedback360Config,
  InitiativeCheckInConfig,
  ManagerSpanConfig,
  OneOnOneFrequencyConfig,
  ToleranceRule,
  ToleranceRuleConfig,
} from '@/types/tolerance-rule'
import { Pencil, Trash2, AlertCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ToleranceRulesListProps {
  rules: ToleranceRule[]
}

export function ToleranceRulesList({ rules }: ToleranceRulesListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    setTogglingId(id)
    try {
      await toggleToleranceRule(id, !currentEnabled)
      router.refresh()
    } catch (error) {
      console.error('Error toggling rule:', error)
      alert(error instanceof Error ? error.message : 'Failed to toggle rule')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(null)
    try {
      await deleteToleranceRule(id)
      router.refresh()
    } catch (error) {
      console.error('Error deleting rule:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete rule')
    }
  }

  const getRuleTypeLabel = (ruleType: string) => {
    switch (ruleType) {
      case 'one_on_one_frequency':
        return '1:1 Frequency'
      case 'initiative_checkin':
        return 'Initiative Check-In'
      case 'feedback_360':
        return '360 Feedback'
      case 'manager_span':
        return 'Manager Span'
      default:
        return ruleType
    }
  }

  const getConfigSummary = (rule: ToleranceRule) => {
    const config = rule.config as ToleranceRuleConfig
    switch (rule.ruleType) {
      case 'one_on_one_frequency':
        return `Warning: ${config as OneOnOneFrequencyConfig}.warningThresholdDays days, Urgent: ${config as OneOnOneFrequencyConfig}.urgentThresholdDays days`
      case 'initiative_checkin':
        return `Warning: ${config as InitiativeCheckInConfig}.warningThresholdDays days`
      case 'feedback_360':
        return `Warning: ${config as Feedback360Config}.warningThresholdMonths months`
      case 'manager_span':
        return `Max: ${config as ManagerSpanConfig}.maxDirectReports reports`
      default:
        return 'N/A'
    }
  }

  if (rules.length === 0) {
    return (
      <div className='text-center py-8'>
        <AlertCircle className='w-12 h-12 mx-auto text-muted-foreground mb-4' />
        <p className='text-muted-foreground mb-4'>
          No tolerance rules configured
        </p>
        <Button asChild>
          <a href='/organization/settings/tolerance-rules/new'>
            Create your first rule
          </a>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Configuration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map(rule => (
            <TableRow key={rule.id}>
              <TableCell className='font-medium'>{rule.name}</TableCell>
              <TableCell>
                <Badge variant='outline'>
                  {getRuleTypeLabel(rule.ruleType)}
                </Badge>
              </TableCell>
              <TableCell className='text-sm text-muted-foreground'>
                {getConfigSummary(rule)}
              </TableCell>
              <TableCell>
                <Switch
                  checked={rule.isEnabled}
                  onCheckedChange={() => handleToggle(rule.id, rule.isEnabled)}
                  disabled={togglingId === rule.id}
                />
              </TableCell>
              <TableCell className='text-right'>
                <div className='flex justify-end gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      router.push(
                        `/organization/settings/tolerance-rules/${rule.id}`
                      )
                    }
                  >
                    <Pencil className='w-4 h-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setDeletingId(rule.id)}
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={open => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tolerance Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rule? This action cannot be
              undone. Existing exceptions created by this rule will remain, but
              no new exceptions will be created.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
