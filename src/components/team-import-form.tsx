'use client'

import { useState } from 'react'
import { importTeamsFromCSV } from '@/lib/actions'
import { Button } from '@/components/ui/button'

interface ImportResult {
  success: boolean
  message: string
  imported: number
  errors: string[]
  errorRows: Array<{
    rowNumber: number
    data: {
      name: string
      description: string
      parent: string
    }
    errors: string[]
  }>
}

export function TeamImportForm() {
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

      const result = await importTeamsFromCSV(formData)
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
      'name,description,parent\nEngineering,Software development team,\nFrontend,Frontend development team,Engineering\nBackend,Backend development team,Engineering\nDevOps,Infrastructure and deployment team,Engineering\nReact Team,React.js specialists,Frontend\nNode.js Team,Node.js specialists,Backend'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'teams-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const downloadErrorReport = () => {
    if (!result?.errorRows.length) return

    const csvContent = [
      'row_number,name,description,parent,errors',
      ...result.errorRows.map(
        row =>
          `${row.rowNumber},"${row.data.name}","${row.data.description}","${row.data.parent}","${row.errors.join('; ')}"`
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'team-import-errors.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className='max-w-4xl mx-auto p-6 bg-black min-h-screen'>
      <h1 className='text-2xl font-bold text-neutral-100 mb-6'>
        Import Teams from CSV
      </h1>

      <div className='mb-6'>
        <h2 className='text-lg font-semibold text-neutral-200 mb-3'>
          CSV Format
        </h2>
        <p className='text-neutral-400 mb-4'>
          Your CSV file should have the following columns:
        </p>
        <ul className='list-disc list-inside text-neutral-400 mb-4 space-y-1'>
          <li>
            <strong>name</strong> - Team name (required)
          </li>
          <li>
            <strong>description</strong> - Team description (optional)
          </li>
          <li>
            <strong>parent</strong> - Parent team name (optional)
          </li>
        </ul>
        <div className='bg-blue-900/30 border border-blue-700 rounded-md p-4 mb-4'>
          <h3 className='font-semibold text-blue-300 mb-2'>Important Notes:</h3>
          <ul className='text-blue-200 text-sm space-y-1'>
            <li>• Team names must be unique within your organization</li>
            <li>
              • If a team name is similar to an existing team, the import will
              fail to prevent duplicates
            </li>
            <li>
              • Parent teams will be created automatically if they don&apos;t
              exist
            </li>
            <li>
              • You can import teams in any order - parent teams are created as
              needed
            </li>
            <li>
              • If a team already exists (including automatically created parent
              teams), it will be updated with new information instead of
              creating a duplicate
            </li>
          </ul>
        </div>
        <Button type='button' onClick={downloadTemplate} variant='outline'>
          Download Template CSV
        </Button>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div>
          <label
            htmlFor='file'
            className='block text-sm font-medium text-neutral-200 mb-2'
          >
            Select CSV File
          </label>
          <input
            type='file'
            id='file'
            name='file'
            accept='.csv'
            onChange={handleFileChange}
            className='block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700'
            required
          />
          {file && (
            <p className='mt-2 text-sm text-neutral-400'>
              Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div className='flex space-x-4'>
          <Button type='submit' disabled={!file || isLoading}>
            {isLoading ? (
              <>
                <svg
                  className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
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
              'Import Teams'
            )}
          </Button>
        </div>
      </form>

      {result && (
        <div className='mt-8'>
          <div
            className={`rounded-md p-4 mb-4 ${
              result.success
                ? 'bg-emerald-900/30 border border-emerald-700'
                : 'bg-red-900/30 border border-red-700'
            }`}
          >
            <div className='flex'>
              <div className='flex-shrink-0'>
                {result.success ? (
                  <svg
                    className='h-5 w-5 text-emerald-300'
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
                    className='h-5 w-5 text-red-300'
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
                <h3
                  className={`text-sm font-medium ${
                    result.success ? 'text-emerald-200' : 'text-red-200'
                  }`}
                >
                  {result.message}
                </h3>
                {result.imported > 0 && (
                  <div className='mt-2 text-sm text-emerald-300'>
                    <p>Successfully processed {result.imported} teams</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className='mb-4'>
              <h3 className='text-lg font-semibold text-neutral-200 mb-2'>
                Errors:
              </h3>
              <div className='bg-red-900/30 border border-red-700 rounded-md p-4'>
                <ul className='text-sm text-red-200 space-y-1'>
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {result.errorRows.length > 0 && (
            <div>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold text-neutral-200'>
                  Row Errors ({result.errorRows.length} rows with errors)
                </h3>
                <Button
                  onClick={downloadErrorReport}
                  variant='outline'
                  size='sm'
                >
                  Download Error Report
                </Button>
              </div>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-neutral-700'>
                  <thead className='bg-neutral-800'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider'>
                        Row
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider'>
                        Name
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider'>
                        Description
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider'>
                        Parent
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider'>
                        Errors
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-neutral-900 divide-y divide-neutral-700'>
                    {result.errorRows.map((row, index) => (
                      <tr key={index}>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-100'>
                          {row.rowNumber}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-neutral-100'>
                          {row.data.name}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-neutral-100'>
                          {row.data.description}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-neutral-100'>
                          {row.data.parent}
                        </td>
                        <td className='px-6 py-4 text-sm text-red-300'>
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
