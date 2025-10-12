import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sanitizeFilename } from '@/lib/export-utils'
import * as XLSX from 'xlsx'

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

    // Prepare data for Excel
    const itemsData = abstractBill.items.map(item => ({
      'Item No': item.measurementEntry?.itemNo || '',
      'Description': item.description || '',
      'Unit': item.unit?.unitSymbol || '',
      'Quantity': item.quantity || 0,
      'Rate (₹)': item.rate || 0,
      'Amount (₹)': item.amount || 0,
    }))

    // Calculate totals
    const total = abstractBill.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const cgstPercent = Number(abstractBill.measurementBook.estimate?.cgstPercent ?? 0)
    const sgstPercent = Number(abstractBill.measurementBook.estimate?.sgstPercent ?? 0)
    const cessPercent = Number(abstractBill.measurementBook.estimate?.cessPercent ?? 0)
    const cgst = (total * cgstPercent) / 100
    const sgst = (total * sgstPercent) / 100
    const cess = (total * cessPercent) / 100
    const gross = total + cgst + sgst + cess

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Add bill details sheet
    const billDetails = [
      ['Abstract Bill Details', ''],
      ['Bill No', abstractBill.billNo],
      ['Bill Date', new Date(abstractBill.billDate).toLocaleDateString()],
      ['Period From', new Date(abstractBill.periodFrom).toLocaleDateString()],
      ['Period To', new Date(abstractBill.periodTo).toLocaleDateString()],
      ['Work', abstractBill.measurementBook.estimate.title],
      ['Measurement Book', abstractBill.measurementBook.title],
      ['Contractor', abstractBill.contractor || ''],
      ['Engineer', abstractBill.engineer || ''],
      ['', ''],
      ['Totals', ''],
      ['Sub Total', total],
      [`CGST (${cgstPercent}%)`, cgst],
      [`SGST (${sgstPercent}%)`, sgst],
      [`CESS (${cessPercent}%)`, cess],
      ['Gross Total', gross],
    ]

    const detailsSheet = XLSX.utils.aoa_to_sheet(billDetails)
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Bill Details')

    // Add items sheet
    const itemsSheet = XLSX.utils.json_to_sheet(itemsData)
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items')

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Generate filename
    const filename = sanitizeFilename(`abstract-bill-${abstractBill.billNo}-${new Date().toISOString().split('T')[0]}.xlsx`)

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating abstract bill Excel:', error)
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 })
  }
}
