import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const abstractBill = await prisma.abstractBill.findUnique({
      where: { id: params.id },
      include: {
        measurementBook: {
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

    if (!abstractBill) {
      return NextResponse.json(
        { error: "Abstract bill not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(abstractBill)
  } catch (error) {
    console.error("Error fetching abstract bill:", error)
    return NextResponse.json(
      { error: "Failed to fetch abstract bill" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      billNo,
      billDate,
      periodFrom,
      periodTo,
      contractor,
      engineer,
      status,
      items,
    } = body

    // Calculate total amount if items are provided
    const totalAmount = items?.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.rate)
    }, 0)

    const abstractBill = await prisma.abstractBill.update({
      where: { id: params.id },
      data: {
        billNo,
        billDate: billDate ? new Date(billDate) : undefined,
        periodFrom: periodFrom ? new Date(periodFrom) : undefined,
        periodTo: periodTo ? new Date(periodTo) : undefined,
        contractor,
        engineer,
        status,
        totalAmount,
        ...(status === "submitted" && { submittedAt: new Date() }),
        ...(status === "approved" && { approvedAt: new Date() }),
        ...(status === "paid" && { paidAt: new Date() }),
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

    // Update items if provided
    if (items) {
      // Delete existing items
      await prisma.abstractBillItem.deleteMany({
        where: { abstractBillId: params.id },
      })

      // Create new items
      await prisma.abstractBillItem.createMany({
        data: items.map((item: any) => ({
          abstractBillId: params.id,
          measurementEntryId: item.measurementEntryId,
          description: item.description,
          unitId: item.unitId,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate,
        })),
      })

      // Fetch updated bill with items
      const updatedBill = await prisma.abstractBill.findUnique({
        where: { id: params.id },
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

      return NextResponse.json(updatedBill)
    }

    return NextResponse.json(abstractBill)
  } catch (error) {
    console.error("Error updating abstract bill:", error)
    return NextResponse.json(
      { error: "Failed to update abstract bill" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.abstractBill.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Abstract bill deleted successfully" })
  } catch (error) {
    console.error("Error deleting abstract bill:", error)
    return NextResponse.json(
      { error: "Failed to delete abstract bill" },
      { status: 500 }
    )
  }
}
