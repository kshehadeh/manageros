import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { getOrganizationMembers } from '@/lib/actions/organization'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  try {
    // Check if user is admin or owner
    if (!isAdminOrOwner(user)) {
      return NextResponse.json(
        {
          error:
            'Only organization admins or owners can view organization members',
        },
        { status: 403 }
      )
    }

    // Check if user belongs to an organization
    if (!user.managerOSOrganizationId) {
      return NextResponse.json({ members: [] })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const sort = searchParams.get('sort') || ''

    // Get all members
    let members = await getOrganizationMembers()

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      members = members.filter(
        member =>
          member.name.toLowerCase().includes(searchLower) ||
          member.email.toLowerCase().includes(searchLower) ||
          member.person?.name.toLowerCase().includes(searchLower)
      )
    }

    // Apply role filter
    if (role && role !== 'all') {
      members = members.filter(member => member.role === role)
    }

    // Apply sorting
    if (sort) {
      const [field, direction] = sort.split(':')
      const dir = direction === 'desc' ? -1 : 1

      members.sort((a, b) => {
        let aVal: string | Date
        let bVal: string | Date

        switch (field) {
          case 'name':
            aVal = a.name
            bVal = b.name
            break
          case 'email':
            aVal = a.email
            bVal = b.email
            break
          case 'role':
            aVal = a.role
            bVal = b.role
            break
          case 'createdAt':
            aVal = a.createdAt
            bVal = b.createdAt
            break
          default:
            return 0
        }

        if (aVal < bVal) return -1 * dir
        if (aVal > bVal) return 1 * dir
        return 0
      })
    }

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching organization members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization members' },
      { status: 500 }
    )
  }
}
