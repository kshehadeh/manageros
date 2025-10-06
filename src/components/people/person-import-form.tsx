'use client'

import { useState } from 'react'
import { importPersonsFromCSV } from '@/lib/actions/csv-import'
import { Button } from '@/components/ui/button'

interface ImportResult {
  success: boolean
  message: string
  imported: number
  errors: string[]
  errorRows?: Array<{
    rowNumber: number
    data: {
      name: string
      email: string
      role: string
      team: string
      manager: string
    }
    errors: string[]
  }>
}

export function PersonImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null) // Clear previous results
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!file) {
      alert('Please select a CSV file')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await importPersonsFromCSV(formData)
      setResult(result)
    } catch (error) {
      console.error('Import error:', error)
      setResult({
        success: false,
        message: 'An error occurred during import',
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        errorRows: [],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent =
      'name,email,role,team,manager\nJohn Doe,john.doe@company.com,Software Engineer,Engineering,\nJane Smith,jane.smith@company.com,Senior Engineer,Engineering,John Doe'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'people-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const downloadErrorReport = () => {
    if (!result?.errorRows || !result.errorRows.length) return

    const csvContent = [
      'row_number,name,email,role,team,manager,errors',
      ...result.errorRows.map(
        row =>
          `${row.rowNumber},"${row.data.name}","${row.data.email}","${row.data.role}","${row.data.team}","${row.data.manager}","${row.errors.join('; ')}"`
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import-errors.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>CSV Format</h3>

        <p className='text-muted-foreground mb-4'>
          Your CSV file should have the following columns:
        </p>
        <div className='overflow-x-auto mb-4'>
          <table className='min-w-full border rounded-lg'>
            <thead className='bg-accent/30'>
              <tr>
                <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b'>
                  Column Name
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b'>
                  Description
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b'>
                  Required
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b'>
                  Example
                </th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              <tr>
                <td className='px-4 py-3 text-sm font-medium text-foreground border-r'>
                  name
                </td>
                <td className='px-4 py-3 text-sm text-muted-foreground border-r'>
                  Person&apos;s full name
                </td>
                <td className='px-4 py-3 text-sm text-destructive border-r'>
                  Yes
                </td>
                <td className='px-4 py-3 text-sm text-muted-foreground'>John Doe</td>
              </tr>
              <tr>
                <td className='px-4 py-3 text-sm font-medium text-foreground border-r'>
                  email
                </td>
                <td className='px-4 py-3 text-sm text-muted-foreground border-r'>
                  Person&apos;s email address
                </td>
                <td className='px-4 py-3 text-sm text-emerald-400 border-r'>
                  No
                </td>
                <td className='px-4 py-3 text-sm text-muted-foreground'>
                  john.doe@company.com
                </td>
              </tr>
              <tr>
                <td className='px-4 py-3 text-sm font-medium text-foreground border-r'>
                  role
                </td>
                <td className='px-4 py-3 text-sm text-muted-foreground border-r'>
                  Person&apos;s job title/role
                </td>
                <td className='px-4 py-3 text-sm text-emerald-400 border-r'>
                  No
                </td>
                <td className='px-4 py-3 text-sm text-muted-foreground'>
                  Senior Engineer
                </td>
              </tr>
              <tr>
                <td className='px-4 py-3 text-sm font-medium text-foreground border-r'>
                  team
                </td>
                <td className='px-4 py-3 text-sm text-muted-foreground border-r'>
                  Team name (must match existing team)
                </td>
                <td className='px-4 py-3 text-sm text-emerald-400 border-r'>
                  No
                </td>
                <td className='px-4 py-3 text-sm text-muted-foreground'>
                  Engineering
                </td>
              </tr>
              <tr>
                <td className='px-4 py-3 text-sm font-medium text-foreground border-r'>
                  manager
                </td>
                <td className='px-4 py-3 text-sm text-muted-foreground border-r'>
                  Manager&apos;s name (must match existing person)
                </td>
                <td className='px-4 py-3 text-sm text-emerald-400 border-r'>
                  No
                </td>
                <td className='px-4 py-3 text-sm text-muted-foreground'>
                  Jane Smith
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className='card mb-4'>
          <h3 className='font-semibold text-foreground mb-2'>Important Notes:</h3>
          <ul className='text-muted-foreground text-sm space-y-1'>
            <li>• Email addresses must be unique within your organization</li>
            <li>• Team names must match existing teams exactly</li>
            <li>
              • Managers will be created automatically if they don&apos;t exist
            </li>
            <li>
              • Manager information will be updated when their own row is
              processed
            </li>
            <li>• All fields except name are optional</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div>
          <label htmlFor='file' className='block text-sm font-medium mb-2'>
            Select CSV File
          </label>
          <div className='relative'>
            <input
              type='file'
              id='file'
              name='file'
              accept='.csv'
              onChange={handleFileChange}
              className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
              required
            />
            <div className='input flex items-center justify-between cursor-pointer hover:bg-accent transition-colors'>
              <span className='text-muted-foreground'>
                {file ? file.name : 'Choose CSV file...'}
              </span>
              <svg
                className='w-5 h-5 text-muted-foreground'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                />
              </svg>
            </div>
          </div>
          {file && (
            <p className='mt-2 text-sm text-muted-foreground'>
              Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div className='flex space-x-4'>
          <Button type='submit' disabled={!file || isLoading} variant='outline'>
            {isLoading ? (
              <>
                <svg
                  className='animate-spin -ml-1 mr-3 h-5 w-5'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                Importing...
              </>
            ) : (
              'Import People'
            )}
          </Button>
          <Button type='button' onClick={downloadTemplate} variant='outline'>
            Download Template CSV
          </Button>
        </div>
      </form>

      {result && (
        <div className='space-y-6'>
          <div className={`card ${result.success ? 'rag-green' : 'rag-red'}`}>
            <div className='flex'>
              <div className='flex-shrink-0'>
                {result.success ? (
                  <svg
                    className='h-5 w-5 text-emerald-400'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                ) : (
                  <svg
                    className='h-5 w-5 text-red-400'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                      clipRule='evenodd'
                    />
                  </svg>
                )}
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium'>{result.message}</h3>
                {result.imported > 0 && (
                  <div className='mt-2 text-sm'>
                    <p>Successfully imported {result.imported} people</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <h3 className='text-lg font-semibold mb-2'>Errors:</h3>
              <div className='card rag-red'>
                <ul className='text-sm space-y-1'>
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {result.errorRows && result.errorRows.length > 0 && (
            <div>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold'>
                  Row Errors ({result.errorRows.length} rows with errors)
                </h3>
                <Button onClick={downloadErrorReport} variant='outline'>
                  Download Error Report
                </Button>
              </div>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y'>
                  <thead className='bg-accent/30'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                        Row
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                        Name
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                        Email
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                        Role
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                        Team
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                        Manager
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                        Errors
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {result.errorRows.map((row, index) => (
                      <tr key={index}>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground'>
                          {row.rowNumber}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground'>
                          {row.data.name}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground'>
                          {row.data.email || '—'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground'>
                          {row.data.role || '—'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground'>
                          {row.data.team || '—'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground'>
                          {row.data.manager || '—'}
                        </td>
                        <td className='px-6 py-4 text-sm text-destructive'>
                          {row.errors.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
