import { NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'

/**
 * POST /api/admin/filter-presets/[id]/track-usage
 * Track filter preset usage and update lastUsedAt
 */
export const POST = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId) {
      return respond.unauthorized()
    }

    const preset = await prisma.filter_presets.findUnique({
      where: { id: params.id },
    })

    if (!preset) {
      return respond.notFound()
    }

    // Check authorization (public presets or owner)
    if (!preset.isPublic && preset.createdBy !== ctx.userId) {
      return respond.forbidden()
    }

    const updatedPreset = await prisma.filter_presets.update({
      where: { id: params.id },
      data: {
        usageCount: {
          increment: 1,
        },
        lastUsedAt: new Date(),
      },
    })

    return respond.ok({
      usageCount: updatedPreset.usageCount,
      lastUsedAt: updatedPreset.lastUsedAt,
    })
  } catch (error) {
    console.error('Failed to track preset usage:', error)
    return respond.serverError('Failed to track usage')
  }
})
