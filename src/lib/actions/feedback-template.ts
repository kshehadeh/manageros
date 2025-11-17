'use server'

import { prisma } from '@/lib/db'
import {
  feedbackTemplateSchema,
  type FeedbackTemplateFormData,
} from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-utils'

export async function createFeedbackTemplate(
  formData: FeedbackTemplateFormData
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to create feedback templates'
    )
  }

  // Validate the form data
  const validatedData = feedbackTemplateSchema.parse(formData)

  // Create the template with questions
  const template = await prisma.feedbackTemplate.create({
    data: {
      name: validatedData.name,
      description: validatedData.description,
      questions: {
        create: validatedData.questions.map((question, index) => ({
          question: question.question,
          type: question.type,
          required: question.required,
          options: question.options,
          sortOrder: question.sortOrder || index,
        })),
      },
    },
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  revalidatePath('/feedback-templates')
  return template
}

export async function getFeedbackTemplates() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to view feedback templates'
    )
  }

  const templates = await prisma.feedbackTemplate.findMany({
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return templates
}

export async function getFeedbackTemplateById(id: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to view feedback templates'
    )
  }

  const template = await prisma.feedbackTemplate.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!template) {
    throw new Error('Template not found')
  }

  return template
}

export async function getDefaultFeedbackTemplate() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to view feedback templates'
    )
  }

  const template = await prisma.feedbackTemplate.findFirst({
    where: { isDefault: true },
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  return template
}

export async function updateFeedbackTemplate(
  id: string,
  formData: FeedbackTemplateFormData
) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to update feedback templates'
    )
  }

  // Validate the form data
  const validatedData = feedbackTemplateSchema.parse(formData)

  // Check if template exists
  const existingTemplate = await prisma.feedbackTemplate.findUnique({
    where: { id },
  })

  if (!existingTemplate) {
    throw new Error('Template not found')
  }

  // Update the template and its questions
  const template = await prisma.feedbackTemplate.update({
    where: { id },
    data: {
      name: validatedData.name,
      description: validatedData.description,
      questions: {
        deleteMany: {}, // Delete all existing questions
        create: validatedData.questions.map((question, index) => ({
          question: question.question,
          type: question.type,
          required: question.required,
          options: question.options,
          sortOrder: question.sortOrder || index,
        })),
      },
    },
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  revalidatePath('/feedback-templates')
  return template
}

export async function deleteFeedbackTemplate(id: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to delete feedback templates'
    )
  }

  // Check if template exists
  const existingTemplate = await prisma.feedbackTemplate.findUnique({
    where: { id },
  })

  if (!existingTemplate) {
    throw new Error('Template not found')
  }

  // Check if template is being used by any campaigns
  const campaignsUsingTemplate = await prisma.feedbackCampaign.count({
    where: { templateId: id },
  })

  if (campaignsUsingTemplate > 0) {
    throw new Error(
      'Cannot delete template that is being used by existing campaigns'
    )
  }

  // Delete the template (this will cascade delete questions)
  await prisma.feedbackTemplate.delete({
    where: { id },
  })

  revalidatePath('/feedback-templates')
}

export async function setDefaultTemplate(id: string) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to set default templates'
    )
  }

  // Check if template exists
  const existingTemplate = await prisma.feedbackTemplate.findUnique({
    where: { id },
  })

  if (!existingTemplate) {
    throw new Error('Template not found')
  }

  // Remove default flag from all templates
  await prisma.feedbackTemplate.updateMany({
    data: { isDefault: false },
  })

  // Set this template as default
  const template = await prisma.feedbackTemplate.update({
    where: { id },
    data: { isDefault: true },
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  revalidatePath('/feedback-templates')
  return template
}
