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

    // Colors for professional look - using simpler format
    const primaryColor = [41, 128, 185] as [number, number, number]
    const secondaryColor = [52, 152, 219] as [number, number, number]
    const accentColor = [46, 204, 113] as [number, number, number]
    const lightGray = [250, 250, 250] as [number, number, number]
    const borderGray = [220, 220, 220] as [number, number, number]

    let currentY = 20

    // --- Header with Company Info ---
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 50, 'F')
    
    // Company Name
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("CONSTRUCTION SOLUTIONS LTD.", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" })

    // Tagline
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Quality Construction Services Since 2010", doc.internal.pageSize.getWidth() / 2, 27, { align: "center" })

    // Contact Info
    doc.setFontSize(8)
    doc.text("123 Construction Ave, City • +91 98765 43210 • info@constructionsolutions.com", doc.internal.pageSize.getWidth() / 2, 34, { align: "center" })

    // Document Type
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("DETAILED ESTIMATE REPORT", doc.internal.pageSize.getWidth() / 2, 45, { align: "center" })

    currentY = 60

    // --- Estimate Overview Box ---
    doc.setDrawColor(...borderGray)
    doc.setFillColor(...lightGray)
    doc.rect(15, currentY, doc.internal.pageSize.getWidth() - 30, 35, 'F')
    doc.rect(15, currentY, doc.internal.pageSize.getWidth() - 30, 35, 'S')

    // Project Title
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("PROJECT:", 20, currentY + 8)
    doc.setFont("helvetica", "normal")
    doc.text(estimate.title, 45, currentY + 8)

    // Two-column layout for details
    const leftCol = 20
    const rightCol = 110

    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("Estimate No:", leftCol, currentY + 16)
    doc.text("Date Prepared:", leftCol, currentY + 22)
    doc.text("Category:", leftCol, currentY + 28)
    
    doc.setFont("helvetica", "normal")
    doc.text(`EST-${estimate.id.slice(-8).toUpperCase()}`, leftCol + 25, currentY + 16)
    doc.text(format(new Date(estimate.createdAt), "dd/MM/yyyy"), leftCol + 25, currentY + 22)
    doc.text(estimate.category, leftCol + 25, currentY + 28)

    doc.setFont("helvetica", "bold")
    doc.text("Location:", rightCol, currentY + 16)
    doc.text("Prepared By:", rightCol, currentY + 22)
    
    doc.setFont("helvetica", "normal")
    doc.text(estimate.location || "Not specified", rightCol + 20, currentY + 16)
    doc.text("Project Manager", rightCol + 20, currentY + 22)

    currentY += 45

    // Project Description if available
    if (estimate.description) {
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("PROJECT DESCRIPTION:", 15, currentY)
      doc.setFont("helvetica", "normal")
      
      const splitDescription = doc.splitTextToSize(estimate.description, doc.internal.pageSize.getWidth() - 30)
      doc.text(splitDescription, 15, currentY + 6)
      
      currentY += 6 + (splitDescription.length * 4)
    }

    currentY += 5

    // --- Work Items Table ---
    const tableData: any[] = []
    let totalAmount = 0
    let totalQuantity = 0

    estimate.workItems.forEach((item, index) => {
      // Main work item row
      tableData.push([
        item.itemNo.toString(),
        item.description,
        item.unit.unitSymbol,
        item.quantity.toFixed(2),
        `₹${item.rate.toFixed(2)}`,
        `₹${item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      ])

      totalAmount += item.amount
      totalQuantity += item.quantity

      // Sub-items with detailed breakdown
      if (item.subItems && item.subItems.length > 0) {
        item.subItems.forEach((subItem, subIndex) => {
          const dimensionText = subItem.length && subItem.breadth && subItem.depth 
            ? `${subItem.length} × ${subItem.breadth} × ${subItem.depth}`
            : "Direct calculation"
            
          tableData.push([
            `  ${subIndex + 1}`,
            `  ${subItem.description}`,
            subItem.unitSymbol || "-",
            dimensionText,
            "",
            "",
          ])
        })
        
        // Add calculation row for main item
        tableData.push([
          "",
          "Calculation:",
          "",
          item.quantity.toFixed(2),
          `₹${item.rate.toFixed(2)}`,
          `₹${item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        ])
        
        // Add empty row for spacing
        tableData.push(["", "", "", "", "", ""])
      }
    })

    autoTable(doc, {
      startY: currentY,
      head: [["Item No.", "Description", "Unit", "Quantity", "Rate (₹)", "Amount (₹)"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        valign: 'top',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: borderGray,
        lineWidth: 0.1,
      },
      didParseCell: (data) => {
        // Style main work item rows
        if (data.section === "body" && data.row.index % 2 === 0 && 
            data.cell.raw && typeof data.cell.raw === 'string' && 
            !data.cell.raw.startsWith('  ') && data.cell.raw !== '') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.lineWidth = 0.3;
        }
        
        // Style sub-item rows
        if (data.section === "body" && data.cell.raw && typeof data.cell.raw === 'string' && data.cell.raw.startsWith('  ')) {
          data.cell.styles.fillColor = [245, 249, 255];
          data.cell.styles.textColor = [80, 80, 80];
          data.cell.styles.fontSize = 8;
        }
        
        // Style calculation rows
        if (data.section === "body" && data.cell.raw === "Calculation:") {
          data.cell.styles.fontStyle = 'italic';
          data.cell.styles.fontSize = 8;
        }
      },
    })

    const tableEndY = (doc as any).lastAutoTable.finalY
    currentY = tableEndY + 10

    // --- Summary Section ---
    doc.setDrawColor(...primaryColor)
    doc.setFillColor(...primaryColor)
    doc.rect(15, currentY, doc.internal.pageSize.getWidth() - 30, 8, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("ESTIMATE SUMMARY", 20, currentY + 5.5)

    currentY += 15

    // Summary details in a clean layout
    const summaryLeft = 20
    const summaryRight = 120

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    
    doc.text("Total Items:", summaryLeft, currentY)
    doc.text("Total Quantity:", summaryLeft, currentY + 6)
    doc.text("Base Estimate:", summaryLeft, currentY + 12)
    
    doc.setFont("helvetica", "normal")
    doc.text(estimate.workItems.length.toString(), summaryLeft + 25, currentY)
    doc.text(totalQuantity.toFixed(2), summaryLeft + 25, currentY + 6)
    doc.text(`₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, summaryLeft + 25, currentY + 12)

    // Add contingency and grand total
    const contingencyRate = 0.10 // 10% contingency
    const contingencyAmount = totalAmount * contingencyRate
    const grandTotal = totalAmount + contingencyAmount

    doc.setFont("helvetica", "bold")
    doc.text("Contingency (10%):", summaryRight, currentY)
    doc.text("GRAND TOTAL:", summaryRight, currentY + 12)
    
    doc.setFont("helvetica", "normal")
    doc.text(`₹${contingencyAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, summaryRight + 35, currentY)
    
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...accentColor)
    doc.text(`₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, summaryRight + 35, currentY + 12)

    currentY += 25

    // --- Notes and Footer ---
    doc.setDrawColor(...borderGray)
    doc.setFillColor(...lightGray)
    doc.rect(15, currentY, doc.internal.pageSize.getWidth() - 30, 25, 'F')
    doc.rect(15, currentY, doc.internal.pageSize.getWidth() - 30, 25, 'S')

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("Notes:", 20, currentY + 6)
    
    doc.setFont("helvetica", "normal")
    const notes = [
      "• This estimate is valid for 30 days from the date of issue",
      "• Prices are subject to change based on market conditions",
      "• Contingency of 10% has been included for unforeseen circumstances",
      "• Payment terms: 40% advance, 40% during execution, 20% on completion"
    ]
    
    notes.forEach((note, index) => {
      doc.text(note, 20, currentY + 12 + (index * 4))
    })

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text("This is a computer-generated estimate and requires authorized signature for approval", 
      doc.internal.pageSize.getWidth() / 2, pageHeight - 15, { align: "center" })
    
    // Page numbers
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 20, pageHeight - 10)
      doc.text(`Generated on ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 20, pageHeight - 10)
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output("arraybuffer")

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Estimate-${estimate.title.replace(/[^a-z0-9]/gi, "-")}-${format(new Date(), "yyyyMMdd")}.pdf"`,
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
