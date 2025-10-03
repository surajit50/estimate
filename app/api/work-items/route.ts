import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      estimateId,
      itemNo,
      pageRef,
      description,
      unitId,
      rate,
      length,
      width,
      height,
      quantity,
      amount,
      subItems,
    } = body

    console.log("[v0] Creating work item with data:", {
      estimateId,
      itemNo,
      description,
      unitId,
      subItemsCount: subItems?.length || 0,
    })

    const workItem = await prisma.workItem.create({
      data: {
        estimateId,
        itemNo,
        pageRef,
        description,
        unitId,
        rate,
        length,
        width,
        height,
        quantity,
        amount,
        subItems:
          subItems && subItems.length > 0
            ? {
                create: subItems.map((subItem: any) => ({
                  description: subItem.description,
                  nos: subItem.nos,
                  length: subItem.length,
                  breadth: subItem.breadth,
                  depth: subItem.depth,
                  quantity: subItem.quantity,
                  unitSymbol: subItem.unitSymbol,
                })),
              }
            : undefined,
      },
      include: {
        unit: true,
        subItems: true,
      },
    })

    console.log("[v0] Work item created successfully:", workItem.id)

    try {
      const existingRate = await prisma.rateLibrary.findFirst({
        where: {
          description: description,
          unitId: unitId,
        },
      })

      if (!existingRate) {
        await prisma.rateLibrary.create({
          data: {
            description,
            unitId,
            standardRate: rate,
            year: new Date().getFullYear().toString(),
          },
        })
        console.log("[v0] Added to rate library:", description)
      }
    } catch (rateLibError) {
      // Don't fail the request if rate library update fails
      console.error("[v0] Failed to update rate library:", rateLibError)
    }

    return NextResponse.json(workItem)
  } catch (error) {
    console.error("[v0] Error creating work item:", error)
    return NextResponse.json(
      {
        error: "Failed to create work item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
