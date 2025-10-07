import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const { entryId } = params
    const entry = await prisma.measurementEntry.findUnique({
      where: { id: entryId },
      include: {
        unit: true,
      },
    })

    if (!entry) {
      return NextResponse.json(
        { error: "Measurement entry not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error("Error fetching measurement entry:", error)
    return NextResponse.json(
      { error: "Failed to fetch measurement entry" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const body = await request.json()
    const {
      entryDate,
      pageNo,
      itemNo,
      description,
      unitId,
      length,
      width,
      height,
      quantity,
      remarks,
    } = body

    const { entryId } = params
    const entry = await prisma.measurementEntry.update({
      where: { id: entryId },
      data: {
        entryDate: entryDate ? new Date(entryDate) : undefined,
        pageNo,
        itemNo,
        description,
        unitId,
        length,
        width,
        height,
        quantity,
        remarks,
      },
      include: {
        unit: true,
      },
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error("Error updating measurement entry:", error)
    return NextResponse.json(
      { error: "Failed to update measurement entry" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const { entryId } = params
    await prisma.measurementEntry.delete({
      where: { id: entryId },
    })

    return NextResponse.json({ message: "Measurement entry deleted successfully" })
  } catch (error) {
    console.error("Error deleting measurement entry:", error)
    return NextResponse.json(
      { error: "Failed to delete measurement entry" },
      { status: 500 }
    )
  }
}
