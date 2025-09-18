'use client'

import { useState } from 'react'
import { importPersonsFromCSV } from '@/lib/actions'

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
    <div className='max-w-4xl mx-auto p-6'>
      <div className='bg-white rounded-lg shadow-md p-6'>
        <h1 className='text-2xl font-bold text-gray-900 mb-6'>
          Import People from CSV
        </h1>

        <div className='mb-6'>
          <h2 className='text-lg font-semibold text-gray-800 mb-3'>
            CSV Format
          </h2>
          <p className='text-gray-600 mb-4'>
            Your CSV file should have the following columns:
          </p>
          <ul className='list-disc list-inside text-gray-600 mb-4 space-y-1'>
            <li>
              <strong>name</strong> - Person&apos;s full name (required)
            </li>
            <li>
              <strong>email</strong> - Person&apos;s email address (optional)
            </li>
            <li>
              <strong>role</strong> - Person&apos;s job title/role (optional)
            </li>
            <li>
              <strong>team</strong> - Team name (optional, must match existing
              team)
            </li>
            <li>
              <strong>manager</strong> - Manager&apos;s name (optional, must
              match existing person)
            </li>
          </ul>
          <div className='bg-blue-50 border border-blue-200 rounded-md p-4 mb-4'>
            <h3 className='font-semibold text-blue-800 mb-2'>
              Important Notes:
            </h3>
            <ul className='text-blue-700 text-sm space-y-1'>
              <li>• Email addresses must be unique within your organization</li>
              <li>• Team names must match existing teams exactly</li>
              <li>
                • Managers will be created automatically if they don&apos;t
                exist
              </li>
              <li>
                • Manager information will be updated when their own row is
                processed
              </li>
              <li>• All fields except name are optional</li>
            </ul>
          </div>
          <button
            type='button'
            onClick={downloadTemplate}
            className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            Download Template CSV
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label
              htmlFor='file'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Select CSV File
            </label>
            <input
              type='file'
              id='file'
              name='file'
              accept='.csv'
              onChange={handleFileChange}
              className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
              required
            />
            {file && (
              <p className='mt-2 text-sm text-gray-600'>
                Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className='flex space-x-4'>
            <button
              type='submit'
              disabled={!file || isLoading}
              className='inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
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
                'Import People'
              )}
            </button>
          </div>
        </form>

        {result && (
          <div className='mt-8'>
            <div
              className={`rounded-md p-4 mb-4 ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className='flex'>
                <div className='flex-shrink-0'>
                  {result.success ? (
                    <svg
                      className='h-5 w-5 text-green-400'
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
                  <h3
                    className={`text-sm font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.message}
                  </h3>
                  {result.imported > 0 && (
                    <div className='mt-2 text-sm text-green-700'>
                      <p>Successfully imported {result.imported} people</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className='mb-4'>
                <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                  Errors:
                </h3>
                <div className='bg-red-50 border border-red-200 rounded-md p-4'>
                  <ul className='text-sm text-red-700 space-y-1'>
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
                  <h3 className='text-lg font-semibold text-gray-800'>
                    Row Errors ({result.errorRows.length} rows with errors)
                  </h3>
                  <button
                    onClick={downloadErrorReport}
                    className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    Download Error Report
                  </button>
                </div>
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Row
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Name
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Email
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Role
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Team
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Manager
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Errors
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {result.errorRows.map((row, index) => (
                        <tr key={index}>
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                            {row.rowNumber}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {row.data.name}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {row.data.email || '—'}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {row.data.role || '—'}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {row.data.team || '—'}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {row.data.manager || '—'}
                          </td>
                          <td className='px-6 py-4 text-sm text-red-600'>
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
    </div>
  )
}
