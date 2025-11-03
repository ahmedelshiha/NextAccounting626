import { NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'

/**
 * POST /api/admin/filter-presets/[id]/set-default
 * Set a filter preset as the default for the entity type
 */
export const POST = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId || !ctx?.tenantId) {
      return respond.unauthorized()
    }

    const preset = await prisma.filter_presets.findUnique({
      where: { id: params.id },
    })

    if (!preset) {
      return respond.notFound()
    }

    // Only owner or admin can set as default
    const isAdmin = ctx.role && ['ADMIN', 'SUPER_ADMIN'].includes(ctx.role)
    if (preset.createdBy !== ctx.userId && !isAdmin) {
      return respond.forbidden()
    }

    // Clear other default presets for the same entity type
    await prisma.filter_presets.updateMany({
      where: {
        tenantId: preset.tenantId,
        entityType: preset.entityType,
        isDefault: true,
        NOT: { id: params.id },
      },
      data: {
        isDefault: false,
      },
    })

    // Set this one as default
    const updatedPreset = await prisma.filter_presets.update({
      where: { id: params.id },
      data: {
        isDefault: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return respond.ok({
      ...updatedPreset,
      filterConfig: JSON.parse(updatedPreset.filterConfig),
    })
  } catch (error) {
    console.error('Failed to set default preset:', error)
    return respond.serverError('Failed to set as default')
  }
})
