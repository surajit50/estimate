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
  length?: number | null
  width?: number | null
  height?: number | null
  amount: number
  
  // Cost Breakdown
  materialCost?: number | null
  laborCost?: number | null
  equipmentCost?: number | null
  overheadCost?: number | null
  
  // Additional Fields
  discount?: number | null
  profitMargin?: number | null
  notes?: string | null
  
  // Status and Priority
  status?: string | null
  priority?: string | null
  
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
      length,
      width,
      height,
      amount,
      materialCost,
      laborCost,
      equipmentCost,
      overheadCost,
      discount,
      profitMargin,
      notes,
      status,
      priority,
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
        length: length || 0,
        width: width || 0,
        height: height || 0,
        amount: calculatedAmount,
        
        // Cost Breakdown
        materialCost: materialCost || 0,
        laborCost: laborCost || 0,
        equipmentCost: equipmentCost || 0,
        overheadCost: overheadCost || 0,
        
        // Additional Fields
        discount: discount || 0,
        profitMargin: profitMargin || 10,
        notes: notes?.trim() || null,
        
        // Status and Priority
        status: status || "active",
        priority: priority || "medium",
        
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
  length?: number | null
  width?: number | null
  height?: number | null
  quantity?: number
  amount?: number
  
  // Cost Breakdown
  materialCost?: number | null
  laborCost?: number | null
  equipmentCost?: number | null
  overheadCost?: number | null
  
  // Additional Fields
  discount?: number | null
  profitMargin?: number | null
  notes?: string | null
  
  // Status and Priority
  status?: string | null
  priority?: string | null
  
  subItems?: any[]
  subCategories?: any[]
}) {
  try {
    const { 
      pageRef, 
      itemRef, 
      itemNo, 
      description, 
      unitId, 
      rate, 
      length, 
      width, 
      height, 
      quantity, 
      amount,
      materialCost,
      laborCost,
      equipmentCost,
      overheadCost,
      discount,
      profitMargin,
      notes,
      status,
      priority,
      subItems, 
      subCategories 
    } = data

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
        length: length ?? undefined,
        width: width ?? undefined,
        height: height ?? undefined,
        quantity,
        amount,
        
        // Cost Breakdown
        materialCost: materialCost ?? undefined,
        laborCost: laborCost ?? undefined,
        equipmentCost: equipmentCost ?? undefined,
        overheadCost: overheadCost ?? undefined,
        
        // Additional Fields
        discount: discount ?? undefined,
        profitMargin: profitMargin ?? undefined,
        notes,
        
        // Status and Priority
        status: status ?? undefined,
        priority: priority ?? undefined,
        
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

export async function createWorkItemsFromDatabase(data: {
  estimateId: string
  sourceItemIds: string[]
}) {
  try {
    const { estimateId, sourceItemIds } = data

    if (!estimateId || sourceItemIds.length === 0) {
      return { success: false, error: "Missing required fields" }
    }

    // Get the source work items
    const sourceItems = await prisma.workItem.findMany({
      where: { id: { in: sourceItemIds } },
      include: { unit: true },
    })

    if (sourceItems.length === 0) {
      return { success: false, error: "No source items found" }
    }

    // Get the next item numbers for the target estimate
    const existingItems = await prisma.workItem.findMany({
      where: { estimateId },
      select: { itemNo: true },
      orderBy: { itemNo: "desc" },
    })

    const nextItemNo = existingItems.length > 0 ? existingItems[0].itemNo + 1 : 1

    // Create new work items based on source items
    const newWorkItems = await Promise.all(
      sourceItems.map(async (item, index) => {
        const calculatedAmount = item.quantity * item.rate

        return prisma.workItem.create({
          data: {
            estimateId,
            itemNo: nextItemNo + index,
            pageRef: item.pageRef,
            description: item.description,
            unitId: item.unitId,
            rate: item.rate,
            quantity: item.quantity,
            length: item.length || 0,
            width: item.width || 0,
            height: item.height || 0,
            amount: calculatedAmount,
            
            // Cost Breakdown
            materialCost: item.materialCost || 0,
            laborCost: item.laborCost || 0,
            equipmentCost: item.equipmentCost || 0,
            overheadCost: item.overheadCost || 0,
            
            // Additional Fields
            discount: item.discount || 0,
            profitMargin: item.profitMargin || 10,
            notes: item.notes,
            
            // Status and Priority
            status: item.status || "active",
            priority: item.priority || "medium",
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
      })
    )

    revalidatePath(`/estimates/${estimateId}`)
    revalidatePath(`/estimates/${estimateId}/work-items`)
    
    return { success: true, data: newWorkItems }
  } catch (error) {
    console.error("Error creating work items from database:", error)
    return { success: false, error: "Failed to create work items from database" }
  }
}

export async function createWorkItemsFromRates(data: {
  estimateId: string
  rateIds: string[]
  quantity?: number
}) {
  try {
    const { estimateId, rateIds, quantity } = data

    if (!estimateId || !rateIds || rateIds.length === 0) {
      return { success: false, error: "Missing required fields" }
    }

    const defaultQuantity = typeof quantity === "number" && quantity > 0 ? quantity : 1

    // Fetch selected rates
    const rates = await prisma.rateLibrary.findMany({
      where: { id: { in: rateIds } },
      include: { unit: true },
      orderBy: { description: "asc" },
    })

    if (rates.length === 0) {
      return { success: false, error: "No rates found for the given IDs" }
    }

    // Determine next item number for target estimate
    const existingItems = await prisma.workItem.findMany({
      where: { estimateId },
      select: { itemNo: true },
      orderBy: { itemNo: "desc" },
    })
    let nextItemNo = existingItems.length > 0 ? existingItems[0].itemNo + 1 : 1

    // Create items for each selected rate
    const createdItems = await Promise.all(
      rates.map(async (rate) => {
        const amount = Number(rate.standardRate) * defaultQuantity
        const created = await prisma.workItem.create({
          data: {
            estimateId,
            itemNo: nextItemNo++,
            pageRef: null,
            description: rate.description.trim(),
            unitId: rate.unitId,
            rate: Number(rate.standardRate),
            quantity: defaultQuantity,
            length: 0,
            width: 0,
            height: 0,
            amount: amount,
            materialCost: 0,
            laborCost: 0,
            equipmentCost: 0,
            overheadCost: 0,
            discount: 0,
            profitMargin: 10,
            notes: null,
            status: "active",
            priority: "medium",
          },
          include: {
            unit: true,
            subItems: true,
            subCategories: {
              include: { subItems: true },
            },
          },
        })
        return created
      })
    )

    revalidatePath(`/estimates/${estimateId}`)
    revalidatePath(`/estimates/${estimateId}/work-items`)
    return { success: true, data: createdItems }
  } catch (error) {
    console.error("Error creating work items from rates:", error)
    return { success: false, error: "Failed to create work items from rates" }
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
