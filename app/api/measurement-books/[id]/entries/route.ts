import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entries = await prisma.measurementEntry.findMany({
      where: { measurementBookId: id },
      include: {
        unit: true,
      },
      orderBy: { entryDate: "desc" },
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error("Error fetching measurement entries:", error)
    return NextResponse.json(
      { error: "Failed to fetch measurement entries" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    if (!entryDate || !pageNo || !itemNo || !description || !unitId || !quantity) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 }
      )
    }

    const { id } = await params
    
    // Verify measurement book exists
    const measurementBook = await prisma.measurementBook.findUnique({
      where: { id },
    })

    if (!measurementBook) {
      return NextResponse.json(
        { error: "Measurement book not found" },
        { status: 404 }
      )
    }

    // Verify unit exists
    const unit = await prisma.unitMaster.findUnique({
      where: { id: unitId },
    })

    if (!unit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      )
    }

    const entry = await prisma.measurementEntry.create({
      data: {
        measurementBookId: id,
        entryDate: new Date(entryDate),
        pageNo,
        itemNo,
        description,
        unitId,
        length: length || 0,
        width: width || 0,
        height: height || 0,
        quantity,
        remarks,
      },
      include: {
        unit: true,
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error("Error creating measurement entry:", error)
    return NextResponse.json(
      { error: "Failed to create measurement entry" },
      { status: 500 }
    )
  }
}
