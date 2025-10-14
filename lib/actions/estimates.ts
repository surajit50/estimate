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
}) {
  try {
    const { title, category, description, location, activityCode } = data

    // Validation
    if (!title || !category) {
      return { success: false, error: "Title and category are required" }
    }

    if (title.length > 255) {
      return { success: false, error: "Title must be less than 255 characters" }
    }

    const estimate = await prisma.estimate.create({
      data: {
        title: title.trim(),
        category: category.trim(),
        description: description?.trim() || null,
        location: location?.trim() || null,
        activityCode: activityCode?.trim() || null,
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
}) {
  try {
    const estimate = await prisma.estimate.update({
      where: { id },
      data: {
        ...data,
        description: data.description || null,
        location: data.location || null,
        activityCode: data.activityCode || null,
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

export async function freezeEstimate(id: string) {
  try {
    const estimate = await prisma.estimate.update({
      where: { id },
      data: { isFrozen: true },
    })
    revalidatePath(`/estimates/${id}`)
    revalidatePath(`/estimates/${id}/work-items`)
    return { success: true, data: estimate }
  } catch (error) {
    console.error("Error freezing estimate:", error)
    return { success: false, error: "Failed to freeze estimate" }
  }
}

export async function unfreezeEstimate(id: string) {
  try {
    const estimate = await prisma.estimate.update({
      where: { id },
      data: { isFrozen: false },
    })
    revalidatePath(`/estimates/${id}`)
    revalidatePath(`/estimates/${id}/work-items`)
    return { success: true, data: estimate }
  } catch (error) {
    console.error("Error unfreezing estimate:", error)
    return { success: false, error: "Failed to unfreeze estimate" }
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
