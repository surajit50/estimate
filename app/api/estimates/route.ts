import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const estimates = await prisma.estimate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        workItems: {
          include: {
            unit: true,
            subItems: true,
          },
        },
      },
    })
    return NextResponse.json(estimates)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch estimates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, category, description, location, activityCode, cgst, sgst, lwCess, contingency } = body

    console.log("[v0] Creating estimate with data:", { title, category, activityCode, cgst, sgst, lwCess, contingency })

    const estimate = await prisma.estimate.create({
      data: {
        title,
        category,
        description: description || null,
        location: location || null,
        activityCode: activityCode || null,
      },
    })

    return NextResponse.json(estimate)
  } catch (error) {
    console.error("[v0] Error creating estimate:", error)
    return NextResponse.json(
      {
        error: "Failed to create estimate",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
