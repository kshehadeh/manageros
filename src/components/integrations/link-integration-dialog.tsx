/**
 * Dialog for linking entities to external integration entities
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getOrganizationIntegrations,
  getUserIntegrations,
} from '@/lib/actions/integrations'
import {
  searchExternalEntities,
  linkEntityToIntegration,
} from '@/lib/actions/integrations'
import type { ExternalEntity } from '@/lib/integrations/base-integration'
import { toast } from 'sonner'

interface Integration {
  id: string
  type: string
  name: string
}

interface LinkIntegrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: string
  entityId: string
  onSuccess: () => void
}

export function LinkIntegrationDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  onSuccess,
}: LinkIntegrationDialogProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [selectedIntegrationId, setSelectedIntegrationId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ExternalEntity[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLinking, setIsLinking] = useState(false)

  useEffect(() => {
    if (open) {
      loadIntegrations()
    } else {
      // Reset state when dialog closes
      setSelectedIntegrationId('')
      setSearchQuery('')
      setSearchResults([])
    }
  }, [open])

  const loadIntegrations = async () => {
    try {
      // Load both organization and user integrations
      const [orgIntegrations, userIntegrations] = await Promise.all([
        getOrganizationIntegrations().catch(() => []),
        getUserIntegrations().catch(() => []),
      ])
      setIntegrations([...orgIntegrations, ...userIntegrations])
    } catch (error) {
      console.error('Failed to load integrations:', error)
    }
  }

  const handleSearch = async () => {
    if (!selectedIntegrationId || !searchQuery.trim()) {
      return
    }

    setIsSearching(true)
    try {
      const result = await searchExternalEntities({
        integrationId: selectedIntegrationId,
        query: searchQuery,
        limit: 20,
      })

      if (result.success) {
        setSearchResults(result.results || [])
      } else {
        toast.error(result.error || 'Search failed')
        setSearchResults([])
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Search failed')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleLink = async (externalEntity: ExternalEntity) => {
    if (!selectedIntegrationId) {
      return
    }

    setIsLinking(true)
    try {
      await linkEntityToIntegration({
        entityType,
        entityId,
        integrationId: selectedIntegrationId,
        externalEntityId: externalEntity.id,
        externalEntityUrl: externalEntity.url,
        metadata: externalEntity.metadata,
      })
      toast.success('Link created successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create link'
      )
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size='md'>
        <DialogHeader>
          <DialogTitle>Link to External System</DialogTitle>
          <DialogDescription>
            Search for and link this {entityType.toLowerCase()} to an external
            entity
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='integration'>Integration</Label>
            <Select
              value={selectedIntegrationId}
              onValueChange={setSelectedIntegrationId}
            >
              <SelectTrigger id='integration'>
                <SelectValue placeholder='Select an integration' />
              </SelectTrigger>
              <SelectContent>
                {integrations.map(integration => (
                  <SelectItem key={integration.id} value={integration.id}>
                    {integration.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedIntegrationId && (
            <div className='space-y-2'>
              <Label htmlFor='search'>Search</Label>
              <div className='flex gap-2'>
                <Input
                  id='search'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                  placeholder='Search for external entity...'
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className='space-y-2'>
              <Label>Results</Label>
              <div className='border rounded-md max-h-64 overflow-y-auto'>
                {searchResults.map((result, index) => (
                  <div
                    key={result.id || index}
                    className='p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer'
                    onClick={() => handleLink(result)}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium truncate'>
                          {result.title || result.id}
                        </p>
                        {result.description && (
                          <p className='text-sm text-muted-foreground truncate'>
                            {result.description}
                          </p>
                        )}
                      </div>
                      <Button
                        size='sm'
                        onClick={e => {
                          e.stopPropagation()
                          handleLink(result)
                        }}
                        disabled={isLinking}
                      >
                        Link
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className='flex justify-end'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
