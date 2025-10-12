"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getMeasurementBooks() {
  try {
    const measurementBooks = await prisma.measurementBook.findMany({
      include: {
        estimate: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        entries: {
          include: {
            unit: true,
          },
          orderBy: { entryDate: "desc" },
        },
        _count: {
          select: {
            entries: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: measurementBooks }
  } catch (error) {
    console.error("Error fetching measurement books:", error)
    return { success: false, error: "Failed to fetch measurement books" }
  }
}

export async function getMeasurementBook(id: string) {
  try {
    const measurementBook = await prisma.measurementBook.findUnique({
      where: { id },
      include: {
        estimate: {
          select: {
            id: true,
            title: true,
            category: true,
            description: true,
            location: true,
          },
        },
        entries: {
          include: {
            unit: true,
          },
          orderBy: { entryDate: "desc" },
        },
        abstractBills: {
          include: {
            measurementBook: {
              include: {
                estimate: {
                  select: {
                    id: true,
                    title: true,
                    category: true,
                  },
                },
              },
            },
            items: {
              include: {
                unit: true,
                measurementEntry: true,
              },
            },
          },
          orderBy: { billDate: "desc" },
        },
      },
    })

    if (!measurementBook) {
      return { success: false, error: "Measurement book not found" }
    }

    return { success: true, data: measurementBook }
  } catch (error) {
    console.error("Error fetching measurement book:", error)
    return { success: false, error: "Failed to fetch measurement book" }
  }
}

export async function createMeasurementBook(data: {
  estimateId: string
  title: string
  description?: string
  location?: string
  contractor?: string
  engineer?: string
}) {
  try {
    const { estimateId, title, description, location, contractor, engineer } = data

    // Validation
    if (!estimateId || !title) {
      return { success: false, error: "Estimate and title are required" }
    }

    if (title.length > 255) {
      return { success: false, error: "Title must be less than 255 characters" }
    }

    const measurementBook = await prisma.measurementBook.create({
      data: {
        estimateId,
        title: title.trim(),
        description: description?.trim() || null,
        location: location?.trim() || null,
        contractor: contractor?.trim() || null,
        engineer: engineer?.trim() || null,
      },
      include: {
        estimate: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    })

    revalidatePath("/measurement-books")
    return { success: true, data: measurementBook }
  } catch (error) {
    console.error("Error creating measurement book:", error)
    
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      return { success: false, error: "Invalid estimate reference" }
    }

    return { success: false, error: "Failed to create measurement book" }
  }
}

export async function updateMeasurementBook(id: string, data: {
  title?: string
  description?: string
  location?: string
  contractor?: string
  engineer?: string
  status?: string
}) {
  try {
    const { title, description, location, contractor, engineer, status } = data

    const measurementBook = await prisma.measurementBook.update({
      where: { id },
      data: {
        title: title?.trim(),
        description: description?.trim(),
        location: location?.trim(),
        contractor: contractor?.trim(),
        engineer: engineer?.trim(),
        status: status as any,
      },
      include: {
        estimate: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    })

    revalidatePath("/measurement-books")
    revalidatePath(`/measurement-books/${id}`)
    return { success: true, data: measurementBook }
  } catch (error) {
    console.error("Error updating measurement book:", error)
    return { success: false, error: "Failed to update measurement book" }
  }
}

export async function deleteMeasurementBook(id: string) {
  try {
    await prisma.measurementBook.delete({
      where: { id },
    })

    revalidatePath("/measurement-books")
    return { success: true }
  } catch (error) {
    console.error("Error deleting measurement book:", error)
    return { success: false, error: "Failed to delete measurement book" }
  }
}
