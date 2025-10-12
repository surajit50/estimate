"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getRates() {
  try {
    const rates = await prisma.rateLibrary.findMany({
      include: {
        unit: true,
      },
      orderBy: { description: "asc" },
    })
    return { success: true, data: rates }
  } catch (error) {
    console.error("Error fetching rates:", error)
    return { success: false, error: "Failed to fetch rates" }
  }
}

export async function createRate(data: {
  description: string
  unitId: string
  standardRate: number
  year?: string
}) {
  try {
    const { description, unitId, standardRate, year } = data

    const rate = await prisma.rateLibrary.create({
      data: {
        description,
        unitId,
        standardRate,
        year: year || null,
      },
      include: {
        unit: true,
      },
    })

    revalidatePath("/admin/rates")
    return { success: true, data: rate }
  } catch (error) {
    console.error("Error creating rate:", error)
    return { success: false, error: "Failed to create rate" }
  }
}

export async function updateRate(id: string, data: {
  description?: string
  unitId?: string
  standardRate?: number
  year?: string
}) {
  try {
    const rate = await prisma.rateLibrary.update({
      where: { id },
      data: {
        ...data,
        year: data.year || null,
      },
      include: {
        unit: true,
      },
    })

    revalidatePath("/admin/rates")
    return { success: true, data: rate }
  } catch (error) {
    console.error("Error updating rate:", error)
    return { success: false, error: "Failed to update rate" }
  }
}

export async function deleteRate(id: string) {
  try {
    await prisma.rateLibrary.delete({
      where: { id },
    })

    revalidatePath("/admin/rates")
    return { success: true }
  } catch (error) {
    console.error("Error deleting rate:", error)
    return { success: false, error: "Failed to delete rate" }
  }
}
