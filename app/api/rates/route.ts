import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const rates = await prisma.rateLibrary.findMany({
      include: {
        unit: true,
      },
      orderBy: { description: "asc" },
    })
    return NextResponse.json(rates)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, unitId, standardRate, year } = body

    const rate = await prisma.rateLibrary.create({
      data: {
        description,
        unitId,
        standardRate,
        year: year || null,
      },
      include: {
        unit: true,
      },
    })

    return NextResponse.json(rate)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create rate" }, { status: 500 })
  }
}
