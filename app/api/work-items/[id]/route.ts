import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { pageRef, itemRef, description, unitId, rate, length, width, height, quantity, amount, subItems } = body

    await prisma.subItem.deleteMany({
      where: { workItemId: params.id },
    })

    const workItem = await prisma.workItem.update({
      where: { id: params.id },
      data: {
        pageRef,
        itemRef,
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
              })),
            }
          : undefined,
      },
      include: {
        unit: true,
        subItems: true,
      },
    })

    return NextResponse.json(workItem)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update work item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.workItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete work item" }, { status: 500 })
  }
}
