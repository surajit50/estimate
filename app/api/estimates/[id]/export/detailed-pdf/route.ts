import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const estimate = await prisma.estimate.findUnique({
      where: { id: params.id },
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

    // Create PDF
    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("DETAILED ESTIMATE", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" })

    // Estimate Details
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    let yPos = 35

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
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [236, 240, 241], textColor: 0, fontStyle: "bold" },
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
        // Style sub-item rows differently
        if (data.section === "body" && data.cell.text[0]?.startsWith("  ")) {
          data.cell.styles.fillColor = [245, 245, 245]
          data.cell.styles.fontSize = 7
        }
      },
    })

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    
    doc.text(
      `Estimated Project Cost: ₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      15,
      finalY + 7,
    )

    // Generate PDF buffer
    const pdfBuffer = doc.output("arraybuffer")

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="detailed-estimate-${estimate.title.replace(/[^a-z0-9]/gi, "-")}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating detailed PDF:", error)
    return NextResponse.json({ error: "Failed to generate detailed PDF" }, { status: 500 })
  }
}
