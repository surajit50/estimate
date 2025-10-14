"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getEstimates() {
  try {
    const estimates = await prisma.estimate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        workItems: {
          include: {
            unit: true,
            subItems: true,
            subCategories: {
              include: {
                subItems: true,
              },
            },
          },
        },
      },
    })
    return { success: true, data: estimates }
  } catch (error) {
    console.error("Error fetching estimates:", error)
    return { success: false, error: "Failed to fetch estimates" }
  }
}

export async function getEstimate(id: string) {
  try {
    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        workItems: {
          include: {
            unit: true,
            subItems: true,
            subCategories: {
              include: {
                subItems: true,
              },
            },
          },
          orderBy: { itemNo: "asc" },
        },
      },
    })

    if (!estimate) {
      return { success: false, error: "Estimate not found" }
    }

    return { success: true, data: estimate }
  } catch (error) {
    console.error("Error fetching estimate:", error)
    return { success: false, error: "Failed to fetch estimate" }
  }
}

export async function createEstimate(data: {
  title: string
  category: string
  description?: string
  location?: string
  activityCode?: string

  // Client Information
  clientName?: string
  clientContact?: string
  clientEmail?: string
  clientAddress?: string

  // Project Timeline (dates as yyyy-mm-dd strings)
  startDate?: string
  endDate?: string
  duration?: number

  // Budget Tracking
  estimatedBudget?: number
  actualCost?: number

  // Status and Priority
  status?: string
  priority?: string

  // Tags
  tags?: string[]

  // Tax Configuration
  cgstPercent?: number
  sgstPercent?: number
  cessPercent?: number

  // Additional Costs
  contingency?: number
  overhead?: number
  profitMargin?: number
  discount?: number

  // Notes
  notes?: string
}) {
  try {
    const {
      title,
      category,
      description,
      location,
      activityCode,

      // Client
      clientName,
      clientContact,
      clientEmail,
      clientAddress,

      // Timeline
      startDate,
      endDate,
      duration,

      // Budget
      estimatedBudget,
      actualCost,

      // Status
      status,
      priority,

      // Tags
      tags,

      // Taxes
      cgstPercent,
      sgstPercent,
      cessPercent,

      // Additional
      contingency,
      overhead,
      profitMargin,
      discount,

      // Notes
      notes,
    } = data

    // Validation
    if (!title || !category) {
      return { success: false, error: "Title and category are required" }
    }

    if (title.length > 255) {
      return { success: false, error: "Title must be less than 255 characters" }
    }

    const toNullableString = (v?: string | null) => (v && v.trim().length > 0 ? v.trim() : null)
    const toNumber = (v: unknown, fallback = 0) => {
      const n = typeof v === "number" ? v : parseFloat(String(v ?? NaN))
      return Number.isFinite(n) ? n : fallback
    }

    const estimate = await prisma.estimate.create({
      data: {
        // Basic
        title: title.trim(),
        category: category.trim(),
        description: toNullableString(description ?? null),
        location: toNullableString(location ?? null),
        activityCode: toNullableString(activityCode ?? null),

        // Client
        clientName: toNullableString(clientName ?? null),
        clientContact: toNullableString(clientContact ?? null),
        clientEmail: toNullableString(clientEmail ?? null),
        clientAddress: toNullableString(clientAddress ?? null),

        // Timeline
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        duration: typeof duration === "number" ? duration : null,

        // Budget
        estimatedBudget: toNumber(estimatedBudget, 0),
        actualCost: toNumber(actualCost, 0),

        // Status & priority
        status: toNullableString(status ?? "draft") ?? "draft",
        priority: toNullableString(priority ?? "medium") ?? "medium",

        // Tags
        tags: Array.isArray(tags) ? tags : [],

        // Taxes
        cgstPercent: toNumber(cgstPercent, 9),
        sgstPercent: toNumber(sgstPercent, 9),
        cessPercent: toNumber(cessPercent, 1),

        // Additional costs
        contingency: toNumber(contingency, 0),
        overhead: toNumber(overhead, 0),
        profitMargin: toNumber(profitMargin, 10),
        discount: toNumber(discount, 0),

        // Notes
        notes: toNullableString(notes ?? null),
      },
    })

    revalidatePath("/")
    return { success: true, data: estimate }
  } catch (error) {
    console.error("Error creating estimate:", error)
    
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "An estimate with this title already exists" }
    }

    return { success: false, error: "Failed to create estimate" }
  }
}

export async function updateEstimate(id: string, data: {
  title?: string
  category?: string
  description?: string
  location?: string
  activityCode?: string

  // Client Information
  clientName?: string
  clientContact?: string
  clientEmail?: string
  clientAddress?: string

  // Project Timeline (dates as yyyy-mm-dd strings)
  startDate?: string
  endDate?: string
  duration?: number

  // Budget Tracking
  estimatedBudget?: number
  actualCost?: number

  // Status and Priority
  status?: string
  priority?: string

  // Tags
  tags?: string[]

  // Tax Configuration
  cgstPercent?: number
  sgstPercent?: number
  cessPercent?: number

  // Additional Costs
  contingency?: number
  overhead?: number
  profitMargin?: number
  discount?: number

  // Notes
  notes?: string
}) {
  try {
    const toNullableString = (v?: string | null) => (v && v.trim().length > 0 ? v.trim() : null)
    const toNumber = (v: unknown, fallback = undefined as number | undefined) => {
      if (v === undefined) return undefined
      const n = typeof v === "number" ? v : parseFloat(String(v ?? NaN))
      return Number.isFinite(n) ? n : fallback
    }

    const estimate = await prisma.estimate.update({
      where: { id },
      data: {
        // Basic
        title: data.title?.trim(),
        category: data.category?.trim(),
        description: data.description !== undefined ? toNullableString(data.description) : undefined,
        location: data.location !== undefined ? toNullableString(data.location) : undefined,
        activityCode: data.activityCode !== undefined ? toNullableString(data.activityCode) : undefined,

        // Client
        clientName: data.clientName !== undefined ? toNullableString(data.clientName) : undefined,
        clientContact: data.clientContact !== undefined ? toNullableString(data.clientContact) : undefined,
        clientEmail: data.clientEmail !== undefined ? toNullableString(data.clientEmail) : undefined,
        clientAddress: data.clientAddress !== undefined ? toNullableString(data.clientAddress) : undefined,

        // Timeline
        startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
        endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
        duration: data.duration !== undefined ? data.duration : undefined,

        // Budget
        estimatedBudget: toNumber(data.estimatedBudget),
        actualCost: toNumber(data.actualCost),

        // Status & priority
        status: data.status !== undefined ? (toNullableString(data.status) ?? "draft") : undefined,
        priority: data.priority !== undefined ? (toNullableString(data.priority) ?? "medium") : undefined,

        // Tags
        tags: data.tags !== undefined ? (Array.isArray(data.tags) ? data.tags : []) : undefined,

        // Taxes
        cgstPercent: toNumber(data.cgstPercent),
        sgstPercent: toNumber(data.sgstPercent),
        cessPercent: toNumber(data.cessPercent),

        // Additional costs
        contingency: toNumber(data.contingency),
        overhead: toNumber(data.overhead),
        profitMargin: toNumber(data.profitMargin),
        discount: toNumber(data.discount),

        // Notes
        notes: data.notes !== undefined ? toNullableString(data.notes) : undefined,
      },
    })

    revalidatePath("/")
    revalidatePath(`/estimates/${id}`)
    return { success: true, data: estimate }
  } catch (error) {
    console.error("Error updating estimate:", error)
    return { success: false, error: "Failed to update estimate" }
  }
}

export async function deleteEstimate(id: string) {
  try {
    await prisma.estimate.delete({
      where: { id },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting estimate:", error)
    return { success: false, error: "Failed to delete estimate" }
  }
}
