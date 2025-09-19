'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteFeedback } from '@/lib/actions'
import { FeedbackForm } from './feedback-form'
import { type Person } from '@prisma/client'
import { ViewButton } from './icon-button'
import { EditIconButton } from './edit-icon-button'

type FeedbackWithRelations = {
  id: string
  kind: string
  isPrivate: boolean
  body: string
  createdAt: Date
  about: {
    id: string
    name: string
  }
  from: {
    id: string
    name: string
  }
}

interface FeedbackListProps {
  person: Person
  feedback: FeedbackWithRelations[]
  currentUserId?: string
  onRefresh?: () => void
}

export function FeedbackList({
  person,
  feedback,
  currentUserId,
  onRefresh,
}: FeedbackListProps) {
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return

    setDeletingId(id)
    try {
      await deleteFeedback(id)
      onRefresh?.()
    } catch (error) {
      console.error('Failed to delete feedback:', error)
      alert('Failed to delete feedback. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    onRefresh?.()
  }

  const handleFormCancel = () => {
    setShowForm(false)
  }

  const getKindColor = (kind: string) => {
    switch (kind) {
      case 'praise':
        return 'rag-green'
      case 'concern':
        return 'rag-red'
      default:
        return 'badge'
    }
  }

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case 'praise':
        return 'Praise'
      case 'concern':
        return 'Concern'
      default:
        return 'Note'
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='font-semibold'>Feedback ({feedback.length})</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className='btn bg-blue-600 hover:bg-blue-700 text-sm'
          >
            Add Feedback
          </button>
        )}
      </div>

      {showForm && (
        <div className='border border-neutral-800 rounded-xl p-4'>
          <h4 className='font-medium mb-4'>Add New Feedback</h4>
          <FeedbackForm
            person={person}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      <div className='space-y-3'>
        {feedback.map(item => (
          <div
            key={item.id}
            className='border border-neutral-800 rounded-xl p-4'
          >
            <div className='flex items-start justify-between mb-3'>
              <div className='flex items-center gap-2'>
                <span className={`badge ${getKindColor(item.kind)}`}>
                  {getKindLabel(item.kind)}
                </span>
                {item.isPrivate && (
                  <span className='badge bg-neutral-700 text-neutral-300'>
                    Private
                  </span>
                )}
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-xs text-neutral-500'>
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <div className='flex gap-1'>
                  <ViewButton
                    href={`/feedback/${item.id}`}
                    variant='link'
                    size='sm'
                  />
                  {item.from.id === currentUserId && (
                    <>
                      <EditIconButton
                        href={`/people/${person.id}/feedback/${item.id}/edit`}
                        variant='outline'
                        size='sm'
                      />
                      <Button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        variant='outline'
                        size='sm'
                        className='text-red-400 hover:text-red-300 border-red-400 hover:border-red-300'
                      >
                        <Trash2 className='w-4 h-4 mr-2' />
                        {deletingId === item.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className='text-sm text-neutral-300 mb-2'>
              From: <span className='font-medium'>{item.from.name}</span>
            </div>

            <div className='prose prose-invert prose-sm max-w-none text-neutral-200'>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className='mb-3'>{children}</p>,
                  strong: ({ children }) => (
                    <strong className='font-semibold text-white'>
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className='italic text-neutral-300'>{children}</em>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className='text-blue-400 hover:text-blue-300 underline'
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {children}
                    </a>
                  ),
                  ul: ({ children }) => (
                    <ul className='list-disc list-inside mb-3'>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className='list-decimal list-inside mb-3'>
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className='mb-1'>{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className='border-l-4 border-neutral-600 pl-4 italic text-neutral-300 mb-3'>
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className='bg-neutral-700 px-1 py-0.5 rounded text-sm font-mono text-neutral-200'>
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className='bg-neutral-700 p-3 rounded overflow-x-auto mb-3'>
                      {children}
                    </pre>
                  ),
                }}
              >
                {item.body}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {feedback.length === 0 && !showForm && (
          <div className='text-neutral-400 text-sm text-center py-8'>
            No feedback yet. Be the first to share feedback about {person.name}.
          </div>
        )}
      </div>
    </div>
  )
}
