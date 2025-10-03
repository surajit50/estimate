import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import * as XLSX from "xlsx"
import { format } from "date-fns"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const estimate = await prisma.estimate.findUnique({
      where: { id: params.id },
      include: {
        workItems: {
          include: {
            unit: true,
          },
          orderBy: { itemNo: "asc" },
        },
      },
    })

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 })
    }

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Estimate Details Sheet
    const detailsData = [
      ["ABSTRACT OF ESTIMATE"],
      [],
      ["Project Title:", estimate.title],
      ["Category:", estimate.category],
      ["Location:", estimate.location || "-"],
      ["Date:", format(new Date(estimate.createdAt), "dd MMMM yyyy")],
      ["Description:", estimate.description || "-"],
      [],
    ]

    // Work Items Data
    const workItemsHeader = [["S.No.", "Description of Work", "Unit", "Quantity", "Rate (₹)", "Amount (₹)"]]

    const workItemsData = estimate.workItems.map((item) => [
      item.itemNo,
      item.description,
      item.unit.unitSymbol,
      item.quantity,
      item.rate,
      item.amount,
    ])

    const totalAmount = estimate.workItems.reduce((sum, item) => sum + item.amount, 0)

    const totalRow = [["", "", "", "", "Grand Total:", totalAmount]]

    const summaryData = [
      [],
      ["Total Number of Items:", estimate.workItems.length],
      ["Estimated Project Cost:", totalAmount],
    ]

    // Combine all data
    const allData = [...detailsData, ...workItemsHeader, ...workItemsData, ...totalRow, ...summaryData]

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(allData)

    // Set column widths
    worksheet["!cols"] = [
      { wch: 10 }, // S.No.
      { wch: 50 }, // Description
      { wch: 10 }, // Unit
      { wch: 12 }, // Quantity
      { wch: 12 }, // Rate
      { wch: 15 }, // Amount
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estimate Abstract")

    // Detailed Work Items Sheet with Dimensions
    const detailedHeader = [
      ["S.No.", "Description", "Unit", "Length", "Width", "Height/Depth", "Quantity", "Rate (₹)", "Amount (₹)"],
    ]

    const detailedData = estimate.workItems.map((item) => [
      item.itemNo,
      item.description,
      item.unit.unitSymbol,
      item.length,
      item.width,
      item.height,
      item.quantity,
      item.rate,
      item.amount,
    ])

    const detailedTotal = [["", "", "", "", "", "", "", "Grand Total:", totalAmount]]

    const detailedAllData = [...detailedHeader, ...detailedData, ...detailedTotal]

    const detailedWorksheet = XLSX.utils.aoa_to_sheet(detailedAllData)

    detailedWorksheet["!cols"] = [
      { wch: 8 },
      { wch: 40 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
    ]

    XLSX.utils.book_append_sheet(workbook, detailedWorksheet, "Detailed Estimate")

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="estimate-${estimate.title.replace(/[^a-z0-9]/gi, "-")}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error generating Excel:", error)
    return NextResponse.json({ error: "Failed to generate Excel" }, { status: 500 })
  }
}
