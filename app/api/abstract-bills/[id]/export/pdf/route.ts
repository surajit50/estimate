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

    const abstractBill = await prisma.abstractBill.findUnique({
      where: { id },
      include: {
        measurementBook: {
          include: {
            estimate: {
              select: { id: true, title: true, category: true, cgstPercent: true, sgstPercent: true, cessPercent: true, contingency: true },
            },
          },
        },
        items: {
          include: {
            unit: true,
            measurementEntry: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!abstractBill) {
      return NextResponse.json({ error: 'Abstract bill not found' }, { status: 404 })
    }

    // Create PDF
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.text('ABSTRACT BILL', 105, 20, { align: 'center' })
    
    // Add bill details
    doc.setFontSize(12)
    doc.text(`Bill No: ${abstractBill.billNo}`, 20, 35)
    doc.text(`Bill Date: ${new Date(abstractBill.billDate).toLocaleDateString()}`, 20, 45)
    doc.text(`Period: ${new Date(abstractBill.periodFrom).toLocaleDateString()} - ${new Date(abstractBill.periodTo).toLocaleDateString()}`, 20, 55)
    doc.text(`Work: ${abstractBill.measurementBook.estimate.title}`, 20, 65)
    doc.text(`Measurement Book: ${abstractBill.measurementBook.title}`, 20, 75)
    
    if (abstractBill.contractor) {
      doc.text(`Contractor: ${abstractBill.contractor}`, 20, 85)
    }
    if (abstractBill.engineer) {
      doc.text(`Engineer: ${abstractBill.engineer}`, 20, 95)
    }

    // Calculate totals
    const total = abstractBill.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const cgstPercent = Number(abstractBill.measurementBook.estimate?.cgstPercent ?? 0)
    const sgstPercent = Number(abstractBill.measurementBook.estimate?.sgstPercent ?? 0)
    const cessPercent = Number(abstractBill.measurementBook.estimate?.cessPercent ?? 0)
    const cgst = (total * cgstPercent) / 100
    const sgst = (total * sgstPercent) / 100
    const cess = (total * cessPercent) / 100
    const gross = total + cgst + sgst + cess

    // Add items table
    const tableData = abstractBill.items.map(item => [
      item.measurementEntry?.itemNo || '',
      item.description || '',
      item.unit?.unitSymbol || '',
      item.quantity?.toFixed(3) || '0.000',
      formatCurrency(item.rate || 0),
      formatCurrency(item.amount || 0)
    ])

    ;(doc as any).autoTable({
      head: [['Item No', 'Description', 'Unit', 'Quantity', 'Rate (₹)', 'Amount (₹)']],
      body: tableData,
      startY: 105,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    // Add totals
    const finalY = (doc as any).lastAutoTable.finalY + 20
    doc.setFontSize(10)
    doc.text(`Sub Total: ${formatCurrency(total)}`, 120, finalY)
    doc.text(`CGST (${cgstPercent}%): ${formatCurrency(cgst)}`, 120, finalY + 10)
    doc.text(`SGST (${sgstPercent}%): ${formatCurrency(sgst)}`, 120, finalY + 20)
    doc.text(`CESS (${cessPercent}%): ${formatCurrency(cess)}`, 120, finalY + 30)
    doc.setFontSize(12)
    doc.text(`Gross Total: ${formatCurrency(gross)}`, 120, finalY + 45)

    // Generate filename
    const filename = sanitizeFilename(`abstract-bill-${abstractBill.billNo}-${new Date().toISOString().split('T')[0]}.pdf`)

    // Return PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating abstract bill PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
