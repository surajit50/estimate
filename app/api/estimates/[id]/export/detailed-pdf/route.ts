
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
    },
  })
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    // --- Title Section ---
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("DETAILED ESTIMATE", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" })

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text("Prepared Detailed Estimate", doc.internal.pageSize.getWidth() / 2, 28, { align: "center" })

    // --- Estimate Details ---
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    let yPos = 40

    doc.text(`Project Title: `, 15, yPos)
    doc.setFont("helvetica", "bold")
    doc.text(`${estimate.title}`, 50, yPos)
    doc.setFont("helvetica", "normal")

    yPos += 7
    doc.text(`Category: `, 15, yPos)
    doc.setFont("helvetica", "bold")
    doc.text(`${estimate.category}`, 50, yPos)
    doc.setFont("helvetica", "normal")

    if (estimate.location) {
      yPos += 7
      doc.text(`Location: `, 15, yPos)
      doc.setFont("helvetica", "bold")
      doc.text(`${estimate.location}`, 50, yPos)
      doc.setFont("helvetica", "normal")
    }

    yPos += 7
    doc.text(`Date: `, 15, yPos)
    doc.setFont("helvetica", "bold")
    doc.text(`${format(new Date(estimate.createdAt), "dd MMMM yyyy")}`, 50, yPos)
    doc.setFont("helvetica", "normal")

    if (estimate.description) {
      yPos += 10
      doc.setFont("helvetica", "normal")
      doc.text(`Description: ${estimate.description}`, 15, yPos)
      yPos += 10
    } else {
      yPos += 5
    }

    // --- Work Items with Sub-Items ---
    const tableData: any[] = []
    let totalAmount = 0

    estimate.workItems.forEach((item, index) => {
      // Main work item row
      tableData.push([
        item.itemNo.toString(),
        item.description,
        item.unit.unitSymbol,
        item.quantity.toFixed(2),
        item.rate.toFixed(2),
        item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      ])

      // Sub-items
      if (item.subItems && item.subItems.length > 0) {
        item.subItems.forEach((subItem, subIndex) => {
          tableData.push([
            `   ${item.itemNo}.${subIndex + 1}`,
            `   ${subItem.description}`,
            subItem.unitSymbol || "-",
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
      head: [["S.No.", "Description of Work", "Unit", "Quantity / Dimensions", "Rate (₹)", "Amount (₹)"]],
      body: tableData,
      foot: [["", "", "", "", "Grand Total:", `₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`]],
      theme: "grid",
      headStyles: { fillColor: [0, 102, 204], textColor: 255, fontStyle: "bold" },
      bodyStyles: { valign: "top" },
      footStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 18, halign: "center" },
        1: { cellWidth: 75 },
        2: { cellWidth: 15, halign: "center" },
        3: { cellWidth: 38, halign: "center" },
        4: { cellWidth: 20, halign: "right" },
        5: { cellWidth: 30, halign: "right" },
      },
      didParseCell: (data) => {
        // Style sub-item rows
        if (data.section === "body" && data.cell.text[0]?.startsWith("   ")) {
          data.cell.styles.fillColor = [245, 245, 245]
          data.cell.styles.textColor = [80, 80, 80]
          data.cell.styles.fontSize = 7
        }
      },
    })

    // --- Summary ---
    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    const tableEndY = (doc as any).lastAutoTable.finalY
    doc.line(15, tableEndY + 5, doc.internal.pageSize.getWidth() - 15, tableEndY + 5)

    const finalY = tableEndY + 15
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(
      `Estimated Project Cost: ₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      15,
      finalY
    )

    // --- Footer with Page Numbers ---
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 20,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" }
      )
      doc.text(
        "Generated by Gram Panchayat Estimation System",
        15,
        doc.internal.pageSize.getHeight() - 10
      )
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output("arraybuffer")

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="detailed-estimate-${estimate.title.replace(
          /[^a-z0-9]/gi,
          "-"
        )}.pdf"`,
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

