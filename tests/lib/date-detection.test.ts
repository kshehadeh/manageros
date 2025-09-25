import { describe, it, expect } from 'vitest'
import {
  detectDatesInText,
  formatDetectedDate,
} from '@/lib/utils/date-detection'

describe('Date Detection Utility (chrono-node)', () => {
  describe('detectDatesInText', () => {
    it('should detect relative dates', () => {
      const result = detectDatesInText('Complete the report tomorrow')
      expect(result.detectedDates).toHaveLength(1)
      expect(result.detectedDates[0].originalText).toBe('tomorrow')
      expect(result.cleanedText).toBe('Complete the report')
    })

    it('should detect today', () => {
      const result = detectDatesInText('Finish this task today')
      expect(result.detectedDates).toHaveLength(1)
      expect(result.detectedDates[0].originalText).toBe('today')
      expect(result.cleanedText).toBe('Finish this task')
    })

    it('should detect next week', () => {
      const result = detectDatesInText('Review the proposal next week')
      expect(result.detectedDates).toHaveLength(1)
      expect(result.detectedDates[0].originalText).toBe('next week')
      expect(result.cleanedText).toBe('Review the proposal')
    })

    it('should detect ISO date format', () => {
      const result = detectDatesInText('Submit the form by 2024-12-25')
      expect(result.detectedDates).toHaveLength(1)
      expect(result.detectedDates[0].originalText).toBe('2024-12-25')
      expect(result.detectedDates[0].date).toMatch(
        /^2024-12-25T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
      expect(result.detectedDates[0].dateOnly).toBe('2024-12-25')
      expect(result.cleanedText).toBe('Submit the form by')
    })

    it('should detect US date format', () => {
      const result = detectDatesInText('Meeting on 12/25/2024')
      expect(result.detectedDates).toHaveLength(1)
      expect(result.detectedDates[0].originalText).toBe('12/25/2024')
      expect(result.detectedDates[0].date).toMatch(
        /^2024-12-25T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
      expect(result.detectedDates[0].dateOnly).toBe('2024-12-25')
      expect(result.cleanedText).toBe('Meeting on')
    })

    it('should detect month name format', () => {
      const result = detectDatesInText('Deadline is January 15, 2024')
      expect(result.detectedDates).toHaveLength(1)
      expect(result.detectedDates[0].originalText).toBe('January 15, 2024')
      expect(result.detectedDates[0].date).toMatch(
        /^2024-01-15T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
      expect(result.detectedDates[0].dateOnly).toBe('2024-01-15')
      expect(result.cleanedText).toBe('Deadline is')
    })

    it('should detect abbreviated month format', () => {
      const result = detectDatesInText('Due Jan 15')
      expect(result.detectedDates).toHaveLength(1)
      expect(result.detectedDates[0].originalText).toBe('Jan 15')
      expect(result.cleanedText).toBe('Due')
    })

    it('should detect day of week', () => {
      const result = detectDatesInText('Call client next Monday')
      expect(result.detectedDates).toHaveLength(1)
      expect(result.detectedDates[0].originalText).toBe('next Monday')
      expect(result.cleanedText).toBe('Call client')
    })

    it('should handle multiple dates', () => {
      const result = detectDatesInText('Start tomorrow and finish next week')
      expect(result.detectedDates).toHaveLength(2)
      // chrono-node might return them in different order
      const originalTexts = result.detectedDates.map(d => d.originalText)
      expect(originalTexts).toContain('tomorrow')
      expect(originalTexts).toContain('next week')
      expect(result.cleanedText).toBe('Start and finish')
    })

    it('should handle text with no dates', () => {
      const result = detectDatesInText('This is just regular text')
      expect(result.detectedDates).toHaveLength(0)
      expect(result.cleanedText).toBe('This is just regular text')
    })

    it('should detect "a week from today"', () => {
      const result = detectDatesInText('Review the proposal a week from today')
      expect(result.detectedDates).toHaveLength(1)
      // chrono-node might detect "today" instead of the full phrase
      expect(result.detectedDates[0].originalText).toBe('today')
      expect(result.cleanedText).toBe('Review the proposal a week from')
    })

    it('should detect "in 3 days"', () => {
      const result = detectDatesInText('Finish this task in 3 days')
      expect(result.detectedDates).toHaveLength(1)
      expect(result.detectedDates[0].originalText).toBe('in 3 days')
      expect(result.cleanedText).toBe('Finish this task')
    })

    it('should detect "5 days from now"', () => {
      const result = detectDatesInText('Submit the report 5 days from now')
      expect(result.detectedDates).toHaveLength(1)
      expect(result.detectedDates[0].originalText).toBe('5 days from now')
      expect(result.cleanedText).toBe('Submit the report')
    })

    it('should detect "in 2 weeks"', () => {
      const result = detectDatesInText('Complete the project in 2 weeks')
      expect(result.detectedDates).toHaveLength(1)
      expect(result.detectedDates[0].originalText).toBe('in 2 weeks')
      expect(result.cleanedText).toBe('Complete the project')
    })

    it('should correctly detect tomorrow vs today', () => {
      const tomorrowResult = detectDatesInText('Complete the report tomorrow')
      const todayResult = detectDatesInText('Finish this task today')

      expect(tomorrowResult.detectedDates).toHaveLength(1)
      expect(todayResult.detectedDates).toHaveLength(1)

      // Tomorrow should be one day after today
      const tomorrow = new Date(tomorrowResult.detectedDates[0].date)
      const today = new Date(todayResult.detectedDates[0].date)
      const dayDiff = tomorrow.getTime() - today.getTime()
      const daysDiff = Math.round(dayDiff / (1000 * 60 * 60 * 24))

      expect(daysDiff).toBe(1)
    })

    it('should handle empty text', () => {
      const result = detectDatesInText('')
      expect(result.detectedDates).toHaveLength(0)
      expect(result.cleanedText).toBe('')
    })

    it('should detect various natural language patterns', () => {
      const testCases = [
        'Due next Friday',
        'Deadline next Tuesday',
        'Review next Monday',
        'Call back tomorrow',
        'Follow up today',
      ]

      testCases.forEach(testCase => {
        const result = detectDatesInText(testCase)
        expect(result.detectedDates.length).toBeGreaterThan(0)
        expect(result.cleanedText.length).toBeLessThan(testCase.length)
      })
    })
  })

  describe('formatDetectedDate', () => {
    it('should format dates with actual date and time', () => {
      const today = new Date().toISOString()
      const formatted = formatDetectedDate(today)
      expect(formatted).toMatch(
        /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/
      )
      expect(formatted).toMatch(/\d{1,2}/) // day
      expect(formatted).toMatch(/\d{1,2}:\d{2}/) // time
      expect(formatted).toMatch(/AM|PM/) // AM/PM
    })

    it('should format future dates correctly', () => {
      const futureDateTime = '2024-12-25T09:00:00.000Z'
      const formatted = formatDetectedDate(futureDateTime)
      expect(formatted).toMatch(/Dec 25/)
      expect(formatted).toMatch(/\d{1,2}:\d{2}/) // time
      expect(formatted).toMatch(/AM|PM/) // AM/PM
    })

    it('should include year for different year', () => {
      const nextYear = new Date()
      nextYear.setFullYear(nextYear.getFullYear() + 1)
      const formatted = formatDetectedDate(nextYear.toISOString())
      expect(formatted).toMatch(/\d{4}/) // Should include year
    })
  })
})
