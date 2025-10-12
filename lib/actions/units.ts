"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getUnits() {
  try {
    const units = await prisma.unitMaster.findMany({
      orderBy: { unitName: "asc" },
    })
    return { success: true, data: units }
  } catch (error) {
    console.error("Error fetching units:", error)
    return { success: false, error: "Failed to fetch units" }
  }
}

export async function createUnit(data: {
  unitName: string
  unitSymbol: string
}) {
  try {
    const { unitName, unitSymbol } = data

    const unit = await prisma.unitMaster.create({
      data: {
        unitName,
        unitSymbol,
      },
    })

    revalidatePath("/admin/units")
    return { success: true, data: unit }
  } catch (error) {
    console.error("Error creating unit:", error)
    return { success: false, error: "Failed to create unit" }
  }
}

export async function updateUnit(id: string, data: {
  unitName?: string
  unitSymbol?: string
}) {
  try {
    const unit = await prisma.unitMaster.update({
      where: { id },
      data,
    })

    revalidatePath("/admin/units")
    return { success: true, data: unit }
  } catch (error) {
    console.error("Error updating unit:", error)
    return { success: false, error: "Failed to update unit" }
  }
}

export async function deleteUnit(id: string) {
  try {
    await prisma.unitMaster.delete({
      where: { id },
    })

    revalidatePath("/admin/units")
    return { success: true }
  } catch (error) {
    console.error("Error deleting unit:", error)
    return { success: false, error: "Failed to delete unit. It may be in use by work items." }
  }
}
