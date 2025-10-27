import { z } from 'zod'

export interface ExtractedField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date'
  required: boolean
  defaultValue?: unknown
  description?: string
}

/**
 * Extract field information from a Zod schema for use in dynamic forms
 */
export function extractSchemaFields(schema: z.ZodTypeAny): ExtractedField[] {
  const fields: ExtractedField[] = []

  // Check if this is a ZodObject
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape

    for (const [key, fieldSchema] of Object.entries(shape)) {
      const fieldInfo = extractFieldInfo(key, fieldSchema as z.ZodTypeAny)
      if (fieldInfo) {
        fields.push(fieldInfo)
      }
    }
  }

  return fields
}

function extractFieldInfo(
  name: string,
  schema: z.ZodTypeAny
): ExtractedField | null {
  const fieldInfo: ExtractedField = {
    name,
    type: 'string',
    required: true,
  }

  // Unwrap the schema to get to the base type
  let currentSchema: z.ZodTypeAny = schema

  // Handle ZodDefault - indicates optional with default value
  while (currentSchema instanceof z.ZodDefault) {
    fieldInfo.required = false
    // defaultValue might be a function or a value
    const defaultValue = currentSchema.def.defaultValue
    if (typeof defaultValue === 'function') {
      fieldInfo.defaultValue = defaultValue()
    } else {
      fieldInfo.defaultValue = defaultValue
    }
    currentSchema = currentSchema.def.innerType as z.ZodTypeAny
  }

  // Handle ZodOptional - indicates optional without default
  while (currentSchema instanceof z.ZodOptional) {
    fieldInfo.required = false
    currentSchema = currentSchema.def.innerType as z.ZodTypeAny
  }

  // Determine the base type
  if (currentSchema instanceof z.ZodString) {
    fieldInfo.type = 'string'
  } else if (currentSchema instanceof z.ZodNumber) {
    fieldInfo.type = 'number'
  } else if (currentSchema instanceof z.ZodBoolean) {
    fieldInfo.type = 'boolean'
  } else if (currentSchema instanceof z.ZodDate) {
    fieldInfo.type = 'date'
  } else {
    // For other types, default to string
    fieldInfo.type = 'string'
  }

  // Handle date strings (ZodString that should be treated as dates)
  if (currentSchema instanceof z.ZodString) {
    // Check field name patterns to detect dates
    const lowerName = name.toLowerCase()
    if (
      lowerName.includes('date') ||
      lowerName.includes('time') ||
      lowerName.endsWith('at')
    ) {
      fieldInfo.type = 'date'
    }
  }

  return fieldInfo
}
