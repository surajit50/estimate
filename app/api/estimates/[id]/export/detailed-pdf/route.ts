import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { format } from "date-fns"

// Dynamic import for PDF libraries to avoid build issues
const getPDFLibraries = async () => {
  const { jsPDF } = await import("jspdf")
  const autoTable = (await import("jspdf-autotable")).default
  return { jsPDF, autoTable }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200, 
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  })
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        workItems: {
          include: {
            unit: true,
            subItems: true,
          },
          orderBy: { itemNo: "asc" },
        },
      },
    })

    if (!estimate) {
      return NextResponse.json({ error: "Estimate not found" }, { status: 404 })
    }

    // Dynamic import PDF libraries
    const { jsPDF, autoTable } = await getPDFLibraries()

    // Create PDF
    const doc = new jsPDF()

    const pageWidth = doc.internal.pageSize.getWidth()
    // Minimal centered title
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("DETAILED ESTIMATE", pageWidth / 2, 20, { align: "center" })

    // Estimate Details
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    let yPos = 30

    doc.text(`Project Title: ${estimate.title}`, 15, yPos)
    yPos += 7
    doc.text(`Category: ${estimate.category}`, 15, yPos)
    yPos += 7
    if (estimate.location) {
      doc.text(`Location: ${estimate.location}`, 15, yPos)
      yPos += 7
    }
    doc.text(`Date: ${format(new Date(estimate.createdAt), "dd MMMM yyyy")}`, 15, yPos)
    yPos += 7

    if (estimate.description) {
      doc.text(`Description: ${estimate.description}`, 15, yPos)
      yPos += 10
    } else {
      yPos += 5
    }

    // Separator
    doc.setDrawColor(210)
    doc.line(15, yPos, pageWidth - 15, yPos)
    yPos += 6

    // Drawing section removed

    // Detailed Work Items Table with Sub-Items
    const tableData: any[] = []
    let totalAmount = 0

    estimate.workItems.forEach((item) => {
      // Main work item row
      tableData.push([
        item.itemNo.toString(),
        item.description,
        item.unit.unitSymbol,
        item.quantity.toFixed(2),
        item.rate.toFixed(2),
        item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      ])

      // Sub-items rows
      if (item.subItems && item.subItems.length > 0) {
        item.subItems.forEach((subItem) => {
          tableData.push([
            `  ${item.itemNo}`,
            `  ${subItem.description}`,
            subItem.unitSymbol,
            `${subItem.length || "-"} × ${subItem.breadth || "-"} × ${subItem.depth || "-"} = ${subItem.quantity.toFixed(2)}`,
            "",
            "",
          ])
        })
      }

      totalAmount += item.amount
    })

    autoTable(doc, {
      startY: yPos,
      head: [["S.No.", "Description of Work", "Unit", "Quantity/Dimensions", "Rate (₹)", "Amount (₹)"]],
      body: tableData,
      foot: [["", "", "", "", "Grand Total:", `₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`]],
      theme: "grid",
      headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: "bold" },
      footStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: "bold" },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20, halign: "left" },
        1: { cellWidth: 70 },
        2: { cellWidth: 15, halign: "center" },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: 20, halign: "right" },
        5: { cellWidth: 30, halign: "right" },
      },
      didParseCell: (data) => {
        // Sub-items slightly shaded; main rows lightly striped
        if (data.section === "body") {
          const isSubItem = data.row.cells?.[0]?.text?.[0]?.startsWith("  ")
          if (isSubItem) {
            data.cell.styles.fillColor = [245, 245, 245]
            data.cell.styles.fontSize = 7
          } else if (data.row.index % 2 === 1) {
            data.cell.styles.fillColor = [252, 252, 252]
          }
        }
      },
    })

    // Summary with concise totals
    const finalY = (doc as any).lastAutoTable.finalY + 8
    const boxLeft = 15
    const boxTop = finalY
    const boxWidth = pageWidth - 30
    const lineHeight = 6

    // Compute taxes/charges
    const cgst = (estimate as any).cgstPercent ?? 0
    const sgst = (estimate as any).sgstPercent ?? 0
    const cess = (estimate as any).cessPercent ?? 0
    const contingency = (estimate as any).contingency ?? 0

    const subtotal = totalAmount
    const grandTotal =
      subtotal +
      subtotal * (Number(cgst) || 0) / 100 +
      subtotal * (Number(sgst) || 0) / 100 +
      subtotal * (Number(cess) || 0) / 100 +
      subtotal * (Number(contingency) || 0) / 100

    // Box (two-line summary)
    doc.setDrawColor(200)
    doc.rect(boxLeft, boxTop, boxWidth, lineHeight * 2)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    const rightX = boxLeft + boxWidth - 4
    const money = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`

    doc.text("Subtotal:", boxLeft + 4, boxTop + lineHeight)
    doc.text(money(subtotal), rightX, boxTop + lineHeight, { align: "right" })

    doc.setFont("helvetica", "bold")
    doc.text("Grand Total (incl. taxes/charges):", boxLeft + 4, boxTop + lineHeight * 2 - 1)
    doc.text(money(grandTotal), rightX, boxTop + lineHeight * 2 - 1, { align: "right" })

    // Footer page numbers
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 8, { align: "right" })
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output("arraybuffer")

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="detailed-estimate-${estimate.title.replace(/[^a-z0-9]/gi, "-")}.pdf"`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("Error generating detailed PDF:", error)
    return NextResponse.json({ error: "Failed to generate detailed PDF" }, { status: 500 })
  }
}
