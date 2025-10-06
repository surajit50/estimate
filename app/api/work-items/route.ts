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
      description,
      unitId,
      rate,
      quantity,
      amount,
      subItems,
      subCategories,
    } = body

    // Validation
    if (!estimateId || !description || !unitId || !rate || quantity === undefined) {
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
      rate,
      quantity,
      amount,
      subItemsCount: subItems?.length || 0,
      subCategoriesCount: subCategories?.length || 0,
    })

    // Calculate the total quantity from sub-items and sub-categories if provided
    let calculatedQuantity = parseFloat(quantity);
    let calculatedAmount = parseFloat(amount) || 0;

    // If no explicit quantity/amount provided but we have sub-items, calculate them
    if ((!quantity || !amount) && (subItems?.length > 0 || subCategories?.length > 0)) {
      calculatedQuantity = 0;
      
      // Calculate from direct sub-items
      if (subItems && subItems.length > 0) {
        subItems.forEach((item: any) => {
          const nos = Number(item.nos) || 0;
          const length = Number(item.length) || 0;
          const breadth = Number(item.breadth) || 0;
          const depth = Number(item.depth) || 0;
          calculatedQuantity += nos * length * breadth * depth;
        });
      }

      // Calculate from sub-categories
      if (subCategories && subCategories.length > 0) {
        subCategories.forEach((category: any) => {
          if (category.subItems && category.subItems.length > 0) {
            category.subItems.forEach((subItem: any) => {
              const nos = Number(subItem.nos) || 0;
              const length = Number(subItem.length) || 0;
              const breadth = Number(subItem.breadth) || 0;
              const depth = Number(subItem.depth) || 0;
              calculatedQuantity += nos * length * breadth * depth;
            });
          }
        });
      }

      calculatedAmount = calculatedQuantity * parseFloat(rate);
    }

    const workItem = await prisma.workItem.create({
      data: {
        estimateId,
        itemNo: parseInt(itemNo) || 1,
        pageRef: pageRef?.trim() || null,
        description: description.trim(),
        unitId,
        rate: parseFloat(rate),
        quantity: calculatedQuantity,
        amount: calculatedAmount,
        subItems:
          subItems && subItems.length > 0
            ? {
                create: subItems.map((subItem: any) => ({
                  description: subItem.description?.trim() || "",
                  nos: parseFloat(subItem.nos) || 1,
                  length: parseFloat(subItem.length) || 0,
                  breadth: parseFloat(subItem.breadth) || 0,
                  depth: parseFloat(subItem.depth) || 0,
                  quantity: (parseFloat(subItem.nos) || 1) * (parseFloat(subItem.length) || 0) * (parseFloat(subItem.breadth) || 0) * (parseFloat(subItem.depth) || 0),
                  unitSymbol: subItem.unitSymbol?.trim() || "",
                })),
              }
            : undefined,
        subCategories:
          subCategories && subCategories.length > 0
            ? {
                create: subCategories.map((category: any) => ({
                  categoryName: category.categoryName?.trim() || "",
                  description: category.description?.trim() || null,
                  subItems: {
                    create: (category.subItems || []).map((subItem: any) => ({
                      description: subItem.description?.trim() || "",
                      nos: parseFloat(subItem.nos) || 1,
                      length: parseFloat(subItem.length) || 0,
                      breadth: parseFloat(subItem.breadth) || 0,
                      depth: parseFloat(subItem.depth) || 0,
                      quantity: (parseFloat(subItem.nos) || 1) * (parseFloat(subItem.length) || 0) * (parseFloat(subItem.breadth) || 0) * (parseFloat(subItem.depth) || 0),
                      unitSymbol: subItem.unitSymbol?.trim() || "",
                    })),
                  },
                })),
              }
            : undefined,
      },
      include: {
        unit: true,
        subItems: true,
        subCategories: {
          include: {
            subItems: true,
          },
        },
      },
    })

    console.log("[v0] Work item created successfully:", workItem.id)

    // Add to rate library if it doesn't exist
    try {
      const existingRate = await prisma.rateLibrary.findFirst({
        where: {
          description: description.trim(),
          unitId: unitId,
        },
      })

      if (!existingRate) {
        await prisma.rateLibrary.create({
          data: {
            description: description.trim(),
            unitId,
            standardRate: parseFloat(rate),
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
