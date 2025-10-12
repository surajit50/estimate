import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { formatCurrency, sanitizeFilename } from '@/lib/export-utils'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        workItems: {
          include: {
            unit: true,
          },
          orderBy: { itemNo: 'asc' },
        },
      },
    })

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Create PDF
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.text('ESTIMATE', 105, 20, { align: 'center' })
    
    // Add estimate details
    doc.setFontSize(12)
    doc.text(`Title: ${estimate.title}`, 20, 35)
    doc.text(`Category: ${estimate.category}`, 20, 45)
    if (estimate.location) {
      doc.text(`Location: ${estimate.location}`, 20, 55)
    }
    doc.text(`Date: ${new Date(estimate.createdAt).toLocaleDateString()}`, 20, 65)
    
    // Calculate totals
    const totalAmount = estimate.workItems.reduce((sum, item) => sum + item.amount, 0)
    doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 20, 75)

    // Add work items table
    const tableData = estimate.workItems.map(item => [
      item.itemNo || '',
      item.description || '',
      item.unit?.unitSymbol || '',
      item.quantity?.toFixed(3) || '0.000',
      formatCurrency(item.rate || 0),
      formatCurrency(item.amount || 0)
    ])

    ;(doc as any).autoTable({
      head: [['Item No', 'Description', 'Unit', 'Quantity', 'Rate (₹)', 'Amount (₹)']],
      body: tableData,
      startY: 85,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    // Generate filename
    const filename = sanitizeFilename(`estimate-${estimate.title}-${new Date().toISOString().split('T')[0]}.pdf`)

    // Return PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
