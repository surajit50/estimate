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

    const measurementBook = await prisma.measurementBook.findUnique({
      where: { id },
      include: {
        estimate: {
          select: { id: true, title: true, category: true },
        },
        entries: {
          include: {
            unit: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!measurementBook) {
      return NextResponse.json({ error: 'Measurement book not found' }, { status: 404 })
    }

    // Create PDF
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.text('MEASUREMENT BOOK', 105, 20, { align: 'center' })
    
    // Add measurement book details
    doc.setFontSize(12)
    doc.text(`Title: ${measurementBook.title}`, 20, 35)
    doc.text(`Estimate: ${measurementBook.estimate.title}`, 20, 45)
    doc.text(`Category: ${measurementBook.estimate.category}`, 20, 55)
    doc.text(`Created: ${new Date(measurementBook.createdAt).toLocaleDateString()}`, 20, 65)
    
    if (measurementBook.description) {
      doc.text(`Description: ${measurementBook.description}`, 20, 75)
    }

    // Calculate totals
    const totalAmount = measurementBook.entries.reduce((sum, entry) => sum + entry.amount, 0)
    doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 20, 85)

    // Add entries table
    const tableData = measurementBook.entries.map(entry => [
      entry.entryNo || '',
      entry.description || '',
      entry.unit?.unitSymbol || '',
      entry.quantity?.toFixed(3) || '0.000',
      formatCurrency(entry.rate || 0),
      formatCurrency(entry.amount || 0),
      entry.date ? new Date(entry.date).toLocaleDateString() : '',
    ])

    ;(doc as any).autoTable({
      head: [['Entry No', 'Description', 'Unit', 'Quantity', 'Rate (₹)', 'Amount (₹)', 'Date']],
      body: tableData,
      startY: 95,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    // Generate filename
    const filename = sanitizeFilename(`measurement-book-${measurementBook.title}-${new Date().toISOString().split('T')[0]}.pdf`)

    // Return PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating measurement book PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
