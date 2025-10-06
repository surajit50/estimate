import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { description, unitId, standardRate, year } = body
    const { id } = context.params

    const rate = await prisma.rateLibrary.update({
      where: { id },
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

    return NextResponse.json(rate)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update rate" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params
    await prisma.rateLibrary.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete rate" }, { status: 500 })
  }
}
