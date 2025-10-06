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

    // Create PDF with realistic dimensions
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    })

    // Colors for government-style document
    const headerColor = [0, 0, 0] as [number, number, number]
    const borderColor = [0, 0, 0] as [number, number, number]
    const lightGray = [240, 240, 240] as [number, number, number]

    let currentY = 20

    // --- Header Section ---
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Probable Estimate for the", doc.internal.pageSize.getWidth() / 2, currentY, { align: "center" })
    
    currentY += 8
    doc.setFontSize(16)
    doc.text(estimate.title.toUpperCase(), doc.internal.pageSize.getWidth() / 2, currentY, { align: "center" })

    currentY += 8
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Activity Code : ${estimate.id.slice(-8).toUpperCase()}`, doc.internal.pageSize.getWidth() / 2, currentY, { align: "center" })

    currentY += 5
    doc.setFontSize(9)
    doc.text("[ Based on P.W.D.( ROADS ), W.B. Schedule of Rates w.e.f.30.08.2018 ]", doc.internal.pageSize.getWidth() / 2, currentY, { align: "center" })

    currentY += 15

    // --- Work Items Table ---
    const tableData: any[] = []
    let totalAmount = 0

    estimate.workItems.forEach((item, index) => {
      // Main work item row
      const itemCode = item.itemNo.toString()
      const description = item.description
      
      tableData.push([
        itemCode,
        "", // Page Ref - empty as in sample
        description,
        item.quantity.toFixed(2),
        item.unit.unitSymbol,
        item.rate.toFixed(2),
        item.amount.toFixed(2)
      ])

      totalAmount += item.amount

      // Sub-items
      if (item.subItems && item.subItems.length > 0) {
        item.subItems.forEach((subItem, subIndex) => {
          tableData.push([
            "", // Empty SL No for sub-items
            "", // Empty Page Ref
            `   (${String.fromCharCode(97 + subIndex)}) ${subItem.description}`, // (a), (b), etc.
            subItem.quantity?.toFixed(2) || "",
            subItem.unitSymbol || "",
            "",
            ""
          ])
        })
      }

      // Add empty row for spacing between items
      tableData.push(["", "", "", "", "", "", ""])
    })

    // Remove last empty row if it exists
    if (tableData.length > 0 && tableData[tableData.length - 1].every((cell: string) => cell === "")) {
      tableData.pop()
    }

    autoTable(doc, {
      startY: currentY,
      head: [["SL No", "Page Ref.", "Items of work", "Quantity", "Unit", "Rate (Rs./ Unit)", "Amount (Rs.)"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: headerColor,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        valign: 'top',
        lineColor: borderColor,
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 75 },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' }
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: borderColor,
        lineWidth: 0.1
      },
      didParseCell: (data) => {
        // Style sub-item rows
        if (data.section === "body" && data.cell.raw && typeof data.cell.raw === 'string' && data.cell.raw.startsWith('   (')) {
          data.cell.styles.fontStyle = 'normal';
          data.cell.styles.textColor = [80, 80, 80];
        }
        
        // Style main item rows
        if (data.section === "body" && data.column.index === 2 && data.cell.raw && typeof data.cell.raw === 'string' && !data.cell.raw.startsWith('   (')) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    })

    const tableEndY = (doc as any).lastAutoTable.finalY
    currentY = tableEndY + 10

    // --- Summary Section ---
    const summaryData = [
      ["[A]", "Itemwise Total = Rs.", "", "", "", "", totalAmount.toFixed(2)],
      ["[B]", "GST as applicable on Itemwise Total @ 18%", "", "", "", "", (totalAmount * 0.18).toFixed(2)],
      ["[C = A+B]", "Cost of Project excluding Labour Wellfare Cess", "", "", "", "", (totalAmount * 1.18).toFixed(2)],
      ["[D]", "Labour Wellfare Cess @ 1% on C", "", "", "", "", (totalAmount * 1.18 * 0.01).toFixed(2)],
      ["[E = C+D]", "Cost of Project including Labour Wellfare Cess", "", "", "", "", (totalAmount * 1.18 * 1.01).toFixed(2)],
      ["", "Contingency Charge LS", "", "", "", "", "58.00"],
      ["", "Final Project Cost = Rs.", "", "", "", "", (totalAmount * 1.18 * 1.01 + 58).toFixed(2)],
      ["", "S A Y = Rs.", "", "", "", "", Math.round(totalAmount * 1.18 * 1.01 + 58).toFixed(2)]
    ]

    autoTable(doc, {
      startY: currentY,
      body: summaryData,
      theme: "grid",
      bodyStyles: {
        fontSize: 9,
        lineColor: borderColor,
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'left', fontStyle: 'bold' },
        1: { cellWidth: 80, halign: 'left', fontStyle: 'bold' },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      },
      styles: {
        cellPadding: 3
      },
      didParseCell: (data) => {
        // Style the final total row
        if (data.row.index === summaryData.length - 1) {
          data.cell.styles.fillColor = [220, 220, 220];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [0, 0, 0];
        }
        // Style SAY row
        if (data.row.index === summaryData.length - 2 && data.column.index === 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    })

    const summaryEndY = (doc as any).lastAutoTable.finalY
    currentY = summaryEndY + 20

    // --- Signatures Section ---
    const leftCol = 20
    const rightCol = 120

    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("Prepared & Vetted By:-", leftCol, currentY)
    
    doc.setFont("helvetica", "normal")
    doc.text("_________________________", leftCol, currentY + 10)
    doc.text("Signature of Engineer", leftCol, currentY + 15)

    doc.setFont("helvetica", "bold")
    doc.text("Signature of Pradhan:", rightCol, currentY)
    
    doc.setFont("helvetica", "normal")
    doc.text("_________________________", rightCol, currentY + 10)
    doc.text("Signature of Pradhan", rightCol, currentY + 15)

    // --- Footer ---
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 20, pageHeight - 10)
    doc.text(`Page 1 of 1`, doc.internal.pageSize.getWidth() - 20, pageHeight - 10, { align: "right" })

    // Generate PDF buffer
    const pdfBuffer = doc.output("arraybuffer")

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Estimate-${estimate.title.replace(/[^a-z0-9]/gi, "-")}.pdf"`,
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
