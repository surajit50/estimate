import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const estimate = await prisma.estimate.findUnique({
      where: { id },
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

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const {
      title,
      category,
      description,
      location,
      activityCode,
      cgst,
      sgst,
      lwCess,
      contingency,
      cgstPercent,
      sgstPercent,
      cessPercent,
    } = body

    const { id } = await context.params
    const estimate = await prisma.estimate.update({
      where: { id },
      data: {
        title,
        category,
        description: description || null,
        location: location || null,
        activityCode: activityCode || null,
        cgstPercent: (cgstPercent ?? cgst ?? 0),
        sgstPercent: (sgstPercent ?? sgst ?? 0),
        cessPercent: (cessPercent ?? lwCess ?? 0),
        contingency: contingency ?? 0,
      },
    })

    return NextResponse.json(estimate)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update estimate" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    await prisma.estimate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete estimate" }, { status: 500 })
  }
}
