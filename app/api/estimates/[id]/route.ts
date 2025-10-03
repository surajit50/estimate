import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const estimate = await prisma.estimate.findUnique({
      where: { id: params.id },
      include: {
        workItems: {
          include: {
            unit: true,
            subItems: true,
          },
          orderBy: { itemNo: "asc" },
        },
      },
    })

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 })
    }

    return NextResponse.json(estimate)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch estimate" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, category, description, location, activityCode, cgst, sgst, lwCess, contingency } = body

    const estimate = await prisma.estimate.update({
      where: { id: params.id },
      data: {
        title,
        category,
        description: description || null,
        location: location || null,
        activityCode: activityCode || null,
        cgst: cgst || 0,
        sgst: sgst || 0,
        lwCess: lwCess || 0,
        contingency: contingency || 0,
      },
    })

    return NextResponse.json(estimate)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update estimate" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.estimate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete estimate" }, { status: 500 })
  }
}
