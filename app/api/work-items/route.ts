import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// CORS headers for API routes
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      estimateId,
      itemNo,
      pageRef,
      itemRef,
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

    // Validation
    if (!estimateId || !description || !unitId || !rate || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields: estimateId, description, unitId, rate, quantity" },
        { status: 400, headers: corsHeaders }
      )
    }

    if (rate < 0 || quantity < 0) {
      return NextResponse.json(
        { error: "Rate and quantity must be positive numbers" },
        { status: 400, headers: corsHeaders }
      )
    }

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
        pageRef: pageRef?.trim() || null,
        // itemRef field removed from schema; retained in request but not stored
        description: description.trim(),
        unitId,
        rate: parseFloat(rate),
        length: parseFloat(length) || 0,
        width: parseFloat(width) || 0,
        height: parseFloat(height) || 0,
        quantity: parseFloat(quantity),
        amount: parseFloat(amount) || 0,
        subItems:
          subItems && subItems.length > 0
            ? {
                create: subItems.map((subItem: any) => ({
                  description: subItem.description?.trim() || "",
                  nos: parseInt(subItem.nos) || 1,
                  length: parseFloat(subItem.length) || 0,
                  breadth: parseFloat(subItem.breadth) || 0,
                  depth: parseFloat(subItem.depth) || 0,
                  quantity: parseFloat(subItem.quantity) || 0,
                  unitSymbol: subItem.unitSymbol?.trim() || "",
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

    return NextResponse.json(workItem, { status: 201, headers: corsHeaders })
  } catch (error) {
    console.error("[v0] Error creating work item:", error)
    
    // Handle Prisma errors
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      return NextResponse.json(
        { error: "Invalid estimate or unit reference" },
        { status: 400, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to create work item",
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "Unknown error" : undefined,
      },
      { status: 500, headers: corsHeaders },
    )
  }
}
