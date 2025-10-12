"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createWorkItem(data: {
  estimateId: string
  itemNo: number
  pageRef?: string | null
  description: string
  unitId: string
  rate: number
  quantity: number
  amount: number
  subItems?: any[]
  subCategories?: any[]
}) {
  try {
    const {
      estimateId,
      itemNo,
      pageRef,
      description,
      unitId,
      rate,
      quantity,
      amount,
      subItems,
      subCategories,
    } = data

    // Validation
    if (!estimateId || !description || !unitId || !rate || quantity === undefined) {
      return { success: false, error: "Missing required fields: estimateId, description, unitId, rate, quantity" }
    }

    if (rate < 0 || quantity < 0) {
      return { success: false, error: "Rate and quantity must be positive numbers" }
    }

    // For simplified work items, use the provided quantity and amount directly
    const calculatedQuantity = parseFloat(quantity.toString())
    const calculatedAmount = parseFloat(amount.toString()) || (calculatedQuantity * parseFloat(rate.toString()))

    const workItem = await prisma.workItem.create({
      data: {
        estimateId,
        itemNo: parseInt(itemNo.toString()) || 1,
        pageRef: pageRef?.trim() || null,
        description: description.trim(),
        unitId,
        rate: parseFloat(rate.toString()),
        quantity: calculatedQuantity,
        amount: calculatedAmount,
        // For simplified work items, we don't create sub-items or sub-categories
        subItems: undefined,
        subCategories: undefined,
      },
      include: {
        unit: true,
        subItems: true,
        subCategories: {
          include: {
            subItems: true,
          },
        },
      },
    })

    // Add to rate library if it doesn't exist
    try {
      const existingRate = await prisma.rateLibrary.findFirst({
        where: {
          description: description.trim(),
          unitId: unitId,
        },
      })

      if (!existingRate) {
        await prisma.rateLibrary.create({
          data: {
            description: description.trim(),
            unitId,
            standardRate: parseFloat(rate.toString()),
            year: new Date().getFullYear().toString(),
          },
        })
      }
    } catch (rateLibError) {
      // Don't fail the request if rate library update fails
      console.error("Failed to update rate library:", rateLibError)
    }

    revalidatePath(`/estimates/${estimateId}`)
    revalidatePath(`/estimates/${estimateId}/work-items`)
    return { success: true, data: workItem }
  } catch (error) {
    console.error("Error creating work item:", error)
    
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      return { success: false, error: "Invalid estimate or unit reference" }
    }

    return { success: false, error: "Failed to create work item" }
  }
}

export async function updateWorkItem(id: string, data: {
  pageRef?: string | null
  itemRef?: string
  itemNo?: number
  description?: string
  unitId?: string
  rate?: number
  length?: number
  width?: number
  height?: number
  quantity?: number
  amount?: number
  subItems?: any[]
  subCategories?: any[]
}) {
  try {
    const { pageRef, itemRef, itemNo, description, unitId, rate, length, width, height, quantity, amount, subItems, subCategories } = data

    // Delete existing sub-items and sub-categories
    await prisma.subWorkItem.deleteMany({
      where: { workItemId: id },
    })
    
    await prisma.subCategory.deleteMany({
      where: { workItemId: id },
    })

    const workItem = await prisma.workItem.update({
      where: { id },
      data: {
        pageRef,
        itemNo,
        description,
        unitId,
        rate,
        length,
        width,
        height,
        quantity,
        amount,
        subItems: subItems
          ? {
              create: subItems.map((subItem: any) => ({
                description: subItem.description,
                nos: subItem.nos,
                length: subItem.length,
                breadth: subItem.breadth,
                depth: subItem.depth,
                quantity: subItem.quantity,
                unitSymbol: subItem.unitSymbol,
              })),
            }
          : undefined,
        subCategories: subCategories
          ? {
              create: subCategories.map((category: any) => ({
                categoryName: category.categoryName,
                description: category.description,
                subItems: {
                  create: (category.subItems || []).map((subItem: any) => ({
                    description: subItem.description,
                    nos: subItem.nos,
                    length: subItem.length,
                    breadth: subItem.breadth,
                    depth: subItem.depth,
                    quantity: subItem.quantity,
                    unitSymbol: subItem.unitSymbol,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: {
        unit: true,
        subItems: true,
        subCategories: {
          include: {
            subItems: true,
          },
        },
      },
    })

    revalidatePath(`/estimates/${workItem.estimateId}`)
    revalidatePath(`/estimates/${workItem.estimateId}/work-items`)
    return { success: true, data: workItem }
  } catch (error) {
    console.error("Error updating work item:", error)
    return { success: false, error: "Failed to update work item" }
  }
}

export async function deleteWorkItem(id: string) {
  try {
    const workItem = await prisma.workItem.findUnique({
      where: { id },
      select: { estimateId: true },
    })

    await prisma.workItem.delete({
      where: { id },
    })

    if (workItem) {
      revalidatePath(`/estimates/${workItem.estimateId}`)
      revalidatePath(`/estimates/${workItem.estimateId}/work-items`)
    }
    return { success: true }
  } catch (error) {
    console.error("Error deleting work item:", error)
    return { success: false, error: "Failed to delete work item" }
  }
}
