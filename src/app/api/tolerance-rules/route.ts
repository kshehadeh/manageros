import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-utils'
import type {
  ToleranceRule,
  ToleranceRuleType,
  ToleranceRuleConfig,
} from '@/types/tolerance-rule'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  try {
    // Check if user belongs to an organization
    if (!user.managerOSOrganizationId) {
      return NextResponse.json(
        {
          error: 'User must belong to an organization to view tolerance rules',
        },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const ruleType = searchParams.get('ruleType') || ''
    const isEnabled = searchParams.get('isEnabled') || ''
    const sort = searchParams.get('sort') || ''

    // Parse immutable filters from query parameter
    let immutableFilters: Record<string, unknown> = {}
    const immutableFiltersParam = searchParams.get('immutableFilters')
    if (immutableFiltersParam) {
      try {
        immutableFilters = JSON.parse(immutableFiltersParam)
      } catch (error) {
        console.error('Error parsing immutableFilters:', error)
        return NextResponse.json(
          { error: 'Invalid immutableFilters parameter' },
          { status: 400 }
        )
      }
    }

    // Build where conditions
    const where: {
      organizationId: string
      name?: { contains: string; mode: 'insensitive' }
      ruleType?: ToleranceRuleType
      isEnabled?: boolean
    } = {
      organizationId: user.managerOSOrganizationId,
    }

    // Apply search filter (immutable takes precedence)
    const searchTerm = (immutableFilters.search as string) || search
    if (searchTerm) {
      where.name = {
        contains: searchTerm,
        mode: 'insensitive',
      }
    }

    // Apply rule type filter
    const typeFilter = (immutableFilters.ruleType as string) || ruleType
    if (typeFilter && typeFilter !== 'all' && typeFilter !== '') {
      where.ruleType = typeFilter as ToleranceRuleType
    }

    // Apply enabled filter
    const enabledFilter = (immutableFilters.isEnabled as string) || isEnabled
    if (enabledFilter && enabledFilter !== 'all' && enabledFilter !== '') {
      where.isEnabled = enabledFilter === 'true'
    }

    // Build orderBy
    let orderBy: Array<{ [key: string]: 'asc' | 'desc' }> = [
      { createdAt: 'desc' },
    ]

    if (sort) {
      const [field, direction] = sort.split(':')
      if (field === 'name') {
        orderBy = [{ name: direction === 'desc' ? 'desc' : 'asc' }]
      } else if (field === 'ruleType') {
        orderBy = [{ ruleType: direction === 'desc' ? 'desc' : 'asc' }]
      } else if (field === 'isEnabled') {
        orderBy = [{ isEnabled: direction === 'desc' ? 'desc' : 'asc' }]
      } else if (field === 'createdAt') {
        orderBy = [{ createdAt: direction === 'desc' ? 'desc' : 'asc' }]
      }
    }

    // Get total count
    const totalCount = await prisma.organizationToleranceRule.count({
      where,
    })

    // Get rules with pagination
    const skip = (page - 1) * limit
    const rules = await prisma.organizationToleranceRule.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    })

    // Map to expected format
    const toleranceRules: ToleranceRule[] = rules.map(rule => ({
      ...rule,
      ruleType: rule.ruleType as ToleranceRuleType,
      config: rule.config as unknown as ToleranceRuleConfig,
    }))

    const response = {
      tolerancerules: toleranceRules,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching tolerance rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tolerance rules' },
      { status: 500 }
    )
  }
}
