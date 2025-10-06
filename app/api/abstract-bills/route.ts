import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const measurementBookId = searchParams.get("measurementBookId")

    let whereClause = {}
    if (measurementBookId) {
      whereClause = { measurementBookId }
    }

    const abstractBills = await prisma.abstractBill.findMany({
      where: whereClause,
      include: {
        measurementBook: {
          include: {
            estimate: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
        },
        items: {
          include: {
            unit: true,
            measurementEntry: true,
          },
        },
      },
      orderBy: { billDate: "desc" },
    })

    return NextResponse.json(abstractBills)
  } catch (error) {
    console.error("Error fetching abstract bills:", error)
    return NextResponse.json(
      { error: "Failed to fetch abstract bills" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      measurementBookId,
      billNo,
      billDate,
      periodFrom,
      periodTo,
      contractor,
      engineer,
      items,
    } = body

    if (!measurementBookId || !billNo || !billDate || !periodFrom || !periodTo) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 }
      )
    }

    // Verify measurement book exists
    const measurementBook = await prisma.measurementBook.findUnique({
      where: { id: measurementBookId },
    })

    if (!measurementBook) {
      return NextResponse.json(
        { error: "Measurement book not found" },
        { status: 404 }
      )
    }

    // Calculate total amount
    const totalAmount = items?.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.rate)
    }, 0) || 0

    const abstractBill = await prisma.abstractBill.create({
      data: {
        measurementBookId,
        billNo,
        billDate: new Date(billDate),
        periodFrom: new Date(periodFrom),
        periodTo: new Date(periodTo),
        contractor,
        engineer,
        totalAmount,
        items: {
          create: items?.map((item: any) => ({
            measurementEntryId: item.measurementEntryId,
            description: item.description,
            unitId: item.unitId,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
          })) || [],
        },
      },
      include: {
        measurementBook: {
          include: {
            estimate: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
        },
        items: {
          include: {
            unit: true,
            measurementEntry: true,
          },
        },
      },
    })

    return NextResponse.json(abstractBill, { status: 201 })
  } catch (error) {
    console.error("Error creating abstract bill:", error)
    return NextResponse.json(
      { error: "Failed to create abstract bill" },
      { status: 500 }
    )
  }
}
