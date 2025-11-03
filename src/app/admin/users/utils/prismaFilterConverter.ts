import { AdvancedFilterConfig, FilterGroup, FilterCondition } from '../types/filters'

/**
 * Convert advanced filter config to Prisma WHERE clause
 * Supports complex nested conditions with AND/OR logic
 */
export function filterConfigToPrismaWhere(config: AdvancedFilterConfig): any {
  if (!config.groups || config.groups.length === 0) {
    return {}
  }

  if (config.groups.length === 1) {
    return filterGroupToPrismaWhere(config.groups[0])
  }

  const conditions = config.groups.map((group) =>
    filterGroupToPrismaWhere(group)
  )

  return config.logic === 'AND' ? { AND: conditions } : { OR: conditions }
}

function filterGroupToPrismaWhere(group: FilterGroup): any {
  if (!group.conditions || group.conditions.length === 0) {
    return {}
  }

  const conditions = group.conditions
    .filter((c) => c.field) // Skip empty conditions
    .map((c) => filterConditionToPrismaWhere(c))
    .filter((c) => Object.keys(c).length > 0)

  if (conditions.length === 0) {
    return {}
  }

  if (conditions.length === 1) {
    return conditions[0]
  }

  return group.logic === 'AND' ? { AND: conditions } : { OR: conditions }
}

function filterConditionToPrismaWhere(condition: FilterCondition): any {
  const field = condition.field
  const operator = condition.operator
  const value = condition.value

  // Build field path (supports nested fields like "user.role")
  const fieldPath = field.split('.').reduce((obj: any, key: string) => {
    return obj ? obj[key] : null
  })

  switch (operator) {
    case 'eq':
      return { [field]: value }

    case 'neq':
      return { NOT: { [field]: value } }

    case 'contains':
      return { [field]: { contains: value, mode: 'insensitive' } }

    case 'startsWith':
      return { [field]: { startsWith: value, mode: 'insensitive' } }

    case 'endsWith':
      return { [field]: { endsWith: value, mode: 'insensitive' } }

    case 'in':
      const inValues = Array.isArray(value) ? value : [value]
      return { [field]: { in: inValues } }

    case 'notIn':
      const notInValues = Array.isArray(value) ? value : [value]
      return { [field]: { notIn: notInValues } }

    case 'gt':
      return { [field]: { gt: parseFloat(value) } }

    case 'lt':
      return { [field]: { lt: parseFloat(value) } }

    case 'gte':
      return { [field]: { gte: parseFloat(value) } }

    case 'lte':
      return { [field]: { lte: parseFloat(value) } }

    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        return {
          AND: [
            { [field]: { gte: parseFloat(value[0]) } },
            { [field]: { lte: parseFloat(value[1]) } },
          ],
        }
      }
      return {}

    case 'isEmpty':
      return { OR: [{ [field]: '' }, { [field]: null }] }

    case 'isNotEmpty':
      return { AND: [{ [field]: { not: '' } }, { [field]: { not: null } }] }

    case 'isNull':
      return { [field]: null }

    case 'isNotNull':
      return { [field]: { not: null } }

    default:
      return {}
  }
}

/**
 * Validate filter config before applying
 * Returns array of validation errors
 */
export function validateFilterConfig(config: AdvancedFilterConfig): string[] {
  const errors: string[] = []

  if (!config.groups || config.groups.length === 0) {
    errors.push('At least one filter group is required')
    return errors
  }

  config.groups.forEach((group, groupIdx) => {
    if (!group.conditions || group.conditions.length === 0) {
      errors.push(`Group ${groupIdx + 1} has no conditions`)
    }

    group.conditions.forEach((condition, condIdx) => {
      if (!condition.field) {
        errors.push(`Group ${groupIdx + 1}, Condition ${condIdx + 1}: Field is required`)
      }

      if (!condition.operator) {
        errors.push(
          `Group ${groupIdx + 1}, Condition ${condIdx + 1}: Operator is required`
        )
      }

      // Check required value for non-existence operators
      if (
        !['isEmpty', 'isNotEmpty', 'isNull', 'isNotNull'].includes(
          condition.operator
        ) &&
        (condition.value === undefined ||
          condition.value === null ||
          condition.value === '')
      ) {
        errors.push(
          `Group ${groupIdx + 1}, Condition ${condIdx + 1}: Value is required for operator ${condition.operator}`
        )
      }
    })
  })

  return errors
}

/**
 * Get distinct values for a field (for filter suggestions)
 * Used to populate dropdown options
 */
export async function getFieldValues(
  field: string,
  prismaModel: any
): Promise<string[]> {
  try {
    const records = await prismaModel.findMany({
      select: { [field]: true },
      distinct: [field],
      where: {
        [field]: { not: null },
      },
      take: 100,
    })

    return records
      .map((r: any) => r[field])
      .filter(Boolean)
      .sort()
  } catch (err) {
    console.error(`Failed to get values for field ${field}:`, err)
    return []
  }
}
