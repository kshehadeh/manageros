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
    <div>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div>
          <label
            htmlFor='csv-file'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Select CSV File
          </label>
          <input
            id='csv-file'
            type='file'
            accept='.csv'
            onChange={handleFileChange}
            className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
            disabled={isLoading}
          />
          {file && (
            <p className='mt-2 text-sm text-gray-600'>
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div className='flex gap-4'>
          <button
            type='submit'
            disabled={!file || isLoading}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
          >
            {isLoading ? 'Importing...' : 'Import People'}
          </button>

          <button
            type='button'
            onClick={downloadTemplate}
            className='px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700'
          >
            Download Template
          </button>
        </div>
      </form>

      {result && (
        <div
          className={`mt-6 p-4 rounded-md ${
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
                {result.success ? 'Import Successful' : 'Import Failed'}
              </h3>
              <div
                className={`mt-2 text-sm ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}
              >
                <p>{result.message}</p>
                {result.imported > 0 && (
                  <p className='mt-1'>
                    Successfully imported {result.imported} people.
                  </p>
                )}
                {result.errorRows && result.errorRows.length > 0 && (
                  <div className='mt-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <p className='font-medium'>Rows with errors:</p>
                      <button
                        type='button'
                        onClick={downloadErrorReport}
                        className='px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700'
                      >
                        Download Error Report
                      </button>
                    </div>
                    <div className='space-y-3'>
                      {result.errorRows.map((errorRow, index) => (
                        <div
                          key={index}
                          className='bg-red-50 border border-red-200 rounded-md p-3'
                        >
                          <div className='flex items-center justify-between mb-2'>
                            <h4 className='font-medium text-red-800'>
                              Row {errorRow.rowNumber}
                            </h4>
                          </div>
                          <div className='grid grid-cols-5 gap-2 text-sm mb-2'>
                            <div>
                              <span className='font-medium text-gray-600'>
                                Name:
                              </span>
                              <div className='text-gray-900'>
                                {errorRow.data.name}
                              </div>
                            </div>
                            <div>
                              <span className='font-medium text-gray-600'>
                                Email:
                              </span>
                              <div className='text-gray-900 overflow-hidden text-ellipsis'>
                                {errorRow.data.email || '—'}
                              </div>
                            </div>
                            <div>
                              <span className='font-medium text-gray-600'>
                                Role:
                              </span>
                              <div className='text-gray-900'>
                                {errorRow.data.role || '—'}
                              </div>
                            </div>
                            <div>
                              <span className='font-medium text-gray-600'>
                                Team:
                              </span>
                              <div className='text-gray-900'>
                                {errorRow.data.team || '—'}
                              </div>
                            </div>
                            <div>
                              <span className='font-medium text-gray-600'>
                                Manager:
                              </span>
                              <div className='text-gray-900'>
                                {errorRow.data.manager || '—'}
                              </div>
                            </div>
                          </div>
                          <div className='mt-2'>
                            <span className='font-medium text-red-700'>
                              Issues:
                            </span>
                            <ul className='list-disc list-inside mt-1 space-y-1'>
                              {errorRow.errors.map((error, errorIndex) => (
                                <li
                                  key={errorIndex}
                                  className='text-red-700 text-sm'
                                >
                                  {error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
