import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estimateId = searchParams.get("estimateId")

    let whereClause = {}
    if (estimateId) {
      whereClause = { estimateId }
    }

    const measurementBooks = await prisma.measurementBook.findMany({
      where: whereClause,
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
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(measurementBooks)
  } catch (error) {
    console.error("Error fetching measurement books:", error)
    return NextResponse.json(
      { error: "Failed to fetch measurement books" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      estimateId,
      title,
      description,
      location,
      contractor,
      engineer,
    } = body

    if (!estimateId || !title) {
      return NextResponse.json(
        { error: "Estimate ID and title are required" },
        { status: 400 }
      )
    }

    // Verify estimate exists
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    })

    if (!estimate) {
      return NextResponse.json(
        { error: "Estimate not found" },
        { status: 404 }
      )
    }

    const measurementBook = await prisma.measurementBook.create({
      data: {
        estimateId,
        title,
        description,
        location,
        contractor,
        engineer,
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

    return NextResponse.json(measurementBook, { status: 201 })
  } catch (error) {
    console.error("Error creating measurement book:", error)
    return NextResponse.json(
      { error: "Failed to create measurement book" },
      { status: 500 }
    )
  }
}
