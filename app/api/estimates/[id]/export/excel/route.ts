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

    // Prepare data for Excel
    const workItemsData = estimate.workItems.map(item => ({
      'Item No': item.itemNo || '',
      'Description': item.description || '',
      'Unit': item.unit?.unitSymbol || '',
      'Quantity': item.quantity || 0,
      'Rate (₹)': item.rate || 0,
      'Amount (₹)': item.amount || 0,
    }))

    // Calculate totals
    const totalAmount = estimate.workItems.reduce((sum, item) => sum + item.amount, 0)

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Add estimate details sheet
    const estimateDetails = [
      ['Estimate Details', ''],
      ['Title', estimate.title],
      ['Category', estimate.category],
      ['Location', estimate.location || ''],
      ['Date', new Date(estimate.createdAt).toLocaleDateString()],
      ['Total Amount', totalAmount],
      ['', ''],
      ['Work Items', ''],
    ]

    const detailsSheet = XLSX.utils.aoa_to_sheet(estimateDetails)
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Estimate Details')

    // Add work items sheet
    const workItemsSheet = XLSX.utils.json_to_sheet(workItemsData)
    XLSX.utils.book_append_sheet(workbook, workItemsSheet, 'Work Items')

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Generate filename
    const filename = sanitizeFilename(`estimate-${estimate.title}-${new Date().toISOString().split('T')[0]}.xlsx`)

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating Excel:', error)
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 })
  }
}
