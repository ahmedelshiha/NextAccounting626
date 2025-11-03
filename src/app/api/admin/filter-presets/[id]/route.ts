import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'

/**
 * GET /api/admin/filter-presets/[id]
 * Get a specific filter preset
 */
export const GET = withTenantContext(async (
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

    if (!preset) {
      return respond.notFound()
    }

    // Check authorization (public presets or owner)
    if (!preset.isPublic && preset.createdBy !== ctx.userId) {
      return respond.forbidden()
    }

    return respond.ok({
      ...preset,
      filterConfig: JSON.parse(preset.filterConfig),
    })
  } catch (error) {
    console.error('Failed to fetch filter preset:', error)
    return respond.serverError('Failed to fetch preset')
  }
})

/**
 * PATCH /api/admin/filter-presets/[id]
 * Update a filter preset
 */
export const PATCH = withTenantContext(async (
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

    // Only owner can update
    if (preset.createdBy !== ctx.userId) {
      return respond.forbidden()
    }

    const body = await request.json()
    const { name, description, isPublic, icon, color, filterConfig } = body

    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (filterConfig !== undefined) {
      updateData.filterConfig = JSON.stringify(filterConfig)
      updateData.filterLogic = filterConfig.logic || 'AND'
    }

    updateData.updatedAt = new Date()

    // Check if new name already exists (if name is being changed)
    if (name && name !== preset.name) {
      const existing = await prisma.filter_presets.findFirst({
        where: {
          tenantId: preset.tenantId,
          name,
          createdBy: ctx.userId,
          NOT: { id: params.id },
        },
      })

      if (existing) {
        return respond.conflict('Another preset with this name already exists')
      }
    }

    const updatedPreset = await prisma.filter_presets.update({
      where: { id: params.id },
      data: updateData,
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
    console.error('Failed to update filter preset:', error)
    return respond.serverError('Failed to update preset')
  }
})

/**
 * DELETE /api/admin/filter-presets/[id]
 * Delete a filter preset
 */
export const DELETE = withTenantContext(async (
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

    // Only owner can delete
    if (preset.createdBy !== ctx.userId) {
      return respond.forbidden()
    }

    await prisma.filter_presets.delete({
      where: { id: params.id },
    })

    return respond.ok({ message: 'Preset deleted successfully' })
  } catch (error) {
    console.error('Failed to delete filter preset:', error)
    return respond.serverError('Failed to delete preset')
  }
})
