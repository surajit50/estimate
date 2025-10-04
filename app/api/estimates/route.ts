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

export async function GET() {
  try {
    const estimates = await prisma.estimate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        workItems: {
          include: {
            unit: true,
            subItems: true,
            subCategories: {
              include: {
                subItems: true,
              },
            },
          },
        },
      },
    })
    return NextResponse.json(estimates, { headers: corsHeaders })
  } catch (error) {
    console.error("Error fetching estimates:", error)
    return NextResponse.json(
      { error: "Failed to fetch estimates" },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, category, description, location, activityCode, cgstPercent, sgstPercent, cessPercent, contingency } = body

    // Validation
    if (!title || !category) {
      return NextResponse.json(
        { error: "Title and category are required" },
        { status: 400 }
      )
    }

    if (title.length > 255) {
      return NextResponse.json(
        { error: "Title must be less than 255 characters" },
        { status: 400 }
      )
    }

    console.log("[v0] Creating estimate with data:", { title, category, activityCode, cgstPercent, sgstPercent, cessPercent, contingency })

    const estimate = await prisma.estimate.create({
      data: {
        title: title.trim(),
        category: category.trim(),
        description: description?.trim() || null,
        location: location?.trim() || null,
        activityCode: activityCode?.trim() || null,
        cgstPercent: cgstPercent ? parseFloat(cgstPercent) : 9,
        sgstPercent: sgstPercent ? parseFloat(sgstPercent) : 9,
        cessPercent: cessPercent ? parseFloat(cessPercent) : 1,
        contingency: contingency ? parseFloat(contingency) : 0,
      },
    })

    return NextResponse.json(estimate, { status: 201, headers: corsHeaders })
  } catch (error) {
    console.error("[v0] Error creating estimate:", error)
    
    // Handle Prisma errors
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "An estimate with this title already exists" },
        { status: 409, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to create estimate",
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "Unknown error" : undefined,
      },
      { status: 500, headers: corsHeaders },
    )
  }
}
