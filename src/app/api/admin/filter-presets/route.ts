import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { respond } from '@/lib/api-response'

/**
 * GET /api/admin/filter-presets
 * List all saved filter presets for the current tenant
 */
export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId || !ctx?.tenantId) {
      return respond.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType') || 'users'
    const isPublic = searchParams.get('isPublic') === 'true'
    const includeShared = searchParams.get('includeShared') !== 'false'

    const whereClause: any = {
      tenantId: ctx.tenantId,
      entityType,
    }

    if (isPublic) {
      whereClause.isPublic = true
    } else if (includeShared) {
      whereClause.OR = [
        { isPublic: true },
        { createdBy: ctx.userId },
      ]
    } else {
      whereClause.createdBy = ctx.userId
    }

    const presets = await prisma.filter_presets.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        entityType: true,
        filterConfig: true,
        filterLogic: true,
        isPublic: true,
        isDefault: true,
        icon: true,
        color: true,
        usageCount: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return respond.ok(
      presets.map((p) => ({
        ...p,
        filterConfig: typeof p.filterConfig === 'string' ? JSON.parse(p.filterConfig) : p.filterConfig,
      }))
    )
  } catch (error) {
    console.error('Failed to fetch filter presets:', error)
    return respond.serverError('Failed to fetch presets')
  }
})

/**
 * POST /api/admin/filter-presets
 * Create a new filter preset
 */
export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId || !ctx?.tenantId) {
      return respond.unauthorized()
    }

    const body = await request.json()
    const {
      name,
      description,
      entityType = 'users',
      filterConfig,
      isPublic = false,
      icon,
      color,
    } = body

    if (!name || !filterConfig) {
      return respond.badRequest('Missing required fields: name, filterConfig')
    }

    // Check if preset with same name exists
    const existing = await prisma.filter_presets.findFirst({
      where: {
        tenantId: ctx.tenantId,
        name,
        createdBy: ctx.userId,
      },
    })

    if (existing) {
      return respond.conflict('Preset with this name already exists')
    }

    const filterLogic = filterConfig.logic || 'AND'

    const preset = await prisma.filter_presets.create({
      data: {
        tenantId: ctx.tenantId,
        name,
        description: description || null,
        entityType,
        filterConfig: JSON.stringify(filterConfig),
        filterLogic,
        isPublic,
        icon: icon || null,
        color: color || null,
        createdBy: ctx.userId,
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

    return respond.created({
      ...preset,
      filterConfig: JSON.parse(preset.filterConfig),
    })
  } catch (error) {
    console.error('Failed to create filter preset:', error)
    return respond.serverError('Failed to create preset')
  }
})
