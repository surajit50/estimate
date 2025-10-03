import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const units = await prisma.unitMaster.findMany({
      orderBy: { unitName: "asc" },
    })
    return NextResponse.json(units)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { unitName, unitSymbol } = body

    const unit = await prisma.unitMaster.create({
      data: {
        unitName,
        unitSymbol,
      },
    })

    return NextResponse.json(unit)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 })
  }
}
