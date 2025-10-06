import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const measurementBook = await prisma.measurementBook.findUnique({
      where: { id },
      include: {
        estimate: {
          select: {
            id: true,
            title: true,
            category: true,
            description: true,
            location: true,
          },
        },
        entries: {
          include: {
            unit: true,
          },
          orderBy: { entryDate: "desc" },
        },
        abstractBills: {
          include: {
            items: {
              include: {
                unit: true,
                measurementEntry: true,
              },
            },
          },
          orderBy: { billDate: "desc" },
        },
      },
    })

    if (!measurementBook) {
      return NextResponse.json(
        { error: "Measurement book not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(measurementBook)
  } catch (error) {
    console.error("Error fetching measurement book:", error)
    return NextResponse.json(
      { error: "Failed to fetch measurement book" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { title, description, location, contractor, engineer, status } = body

    const { id } = await params
    const measurementBook = await prisma.measurementBook.update({
      where: { id },
      data: {
        title,
        description,
        location,
        contractor,
        engineer,
        status,
        ...(status === "submitted" && { submittedAt: new Date() }),
        ...(status === "approved" && { approvedAt: new Date() }),
      },
      include: {
        estimate: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        entries: {
          include: {
            unit: true,
          },
        },
        abstractBills: true,
      },
    })

    return NextResponse.json(measurementBook)
  } catch (error) {
    console.error("Error updating measurement book:", error)
    return NextResponse.json(
      { error: "Failed to update measurement book" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.measurementBook.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Measurement book deleted successfully" })
  } catch (error) {
    console.error("Error deleting measurement book:", error)
    return NextResponse.json(
      { error: "Failed to delete measurement book" },
      { status: 500 }
    )
  }
}
