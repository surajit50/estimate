import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { unitName, unitSymbol } = body

    const unit = await prisma.unitMaster.update({
      where: { id: params.id },
      data: {
        unitName,
        unitSymbol,
      },
    })

    return NextResponse.json(unit)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update unit" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.unitMaster.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete unit. It may be in use by work items." }, { status: 500 })
  }
}
