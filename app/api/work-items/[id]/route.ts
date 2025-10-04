import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const { pageRef, itemRef, description, unitId, rate, length, width, height, quantity, amount, subItems, subCategories } = body
    const { id } = await context.params

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

    return NextResponse.json(workItem)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update work item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    await prisma.workItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete work item" }, { status: 500 })
  }
}
