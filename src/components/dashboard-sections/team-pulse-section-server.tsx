import { getCurrentUser } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { TeamPulseSection } from './team-pulse-section'
import { format, isFuture, differenceInDays } from 'date-fns'

interface TeamPulseMember {
  id: string
  name: string
  avatar: string | null
  nextOneOnOne: Date | null
  lastOneOnOne: Date | null
  taskCount: number
  feedbackPending: boolean
}

export async function TeamPulseSectionServer() {
  const user = await getCurrentUser()

  if (!user.organizationId || !user.personId) {
    return null
  }

  // Get current person's direct reports
  const directReports = await prisma.person.findMany({
    where: {
      managerId: user.personId,
      organizationId: user.organizationId,
      status: 'active',
    },
    select: {
      id: true,
      name: true,
      avatar: true,
    },
    orderBy: { name: 'asc' },
    take: 10,
  })

  if (directReports.length === 0) {
    return null
  }

  // Get 1:1 meetings for each report
  const reportIds = directReports.map(r => r.id)
  const oneOnOnes = await prisma.oneOnOne.findMany({
    where: {
      OR: [
        { managerId: user.personId, reportId: { in: reportIds } },
        { managerId: { in: reportIds }, reportId: user.personId },
      ],
    },
    select: {
      managerId: true,
      reportId: true,
      scheduledAt: true,
    },
    orderBy: { scheduledAt: 'desc' },
  })

  // Get task counts for each report
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: { in: reportIds },
      status: { notIn: ['done', 'dropped'] },
    },
    select: {
      assigneeId: true,
    },
  })

  // Get pending feedback campaigns
  const feedbackCampaigns = await prisma.feedbackCampaign.findMany({
    where: {
      userId: user.id,
      status: 'active',
      targetPersonId: { in: reportIds },
      endDate: { gte: new Date() },
    },
    select: {
      targetPersonId: true,
    },
  })

  // Build the team pulse data
  const teamMembers: TeamPulseMember[] = directReports.map(report => {
    // Find upcoming 1:1
    const upcomingOneOnOne = oneOnOnes.find(
      ooo =>
        ((ooo.managerId === user.personId && ooo.reportId === report.id) ||
          (ooo.reportId === user.personId && ooo.managerId === report.id)) &&
        ooo.scheduledAt &&
        isFuture(new Date(ooo.scheduledAt))
    )

    // Find most recent past 1:1
    const pastOneOnOnes = oneOnOnes
      .filter(
        ooo =>
          ((ooo.managerId === user.personId && ooo.reportId === report.id) ||
            (ooo.reportId === user.personId && ooo.managerId === report.id)) &&
          ooo.scheduledAt &&
          !isFuture(new Date(ooo.scheduledAt))
      )
      .sort((a, b) => {
        if (!a.scheduledAt || !b.scheduledAt) return 0
        return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      })

    const lastOneOnOne = pastOneOnOnes[0]?.scheduledAt || null

    // Count tasks
    const taskCount = tasks.filter(t => t.assigneeId === report.id).length

    // Check for pending feedback
    const feedbackPending = feedbackCampaigns.some(
      fc => fc.targetPersonId === report.id
    )

    return {
      id: report.id,
      name: report.name,
      avatar: report.avatar,
      nextOneOnOne: upcomingOneOnOne?.scheduledAt || null,
      lastOneOnOne,
      taskCount,
      feedbackPending,
    }
  })

  return <TeamPulseSection members={teamMembers} />
}
