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

    // Prepare data for Excel
    const entriesData = measurementBook.entries.map(entry => ({
      'Entry No': entry.entryNo || '',
      'Description': entry.description || '',
      'Unit': entry.unit?.unitSymbol || '',
      'Quantity': entry.quantity || 0,
      'Rate (₹)': entry.rate || 0,
      'Amount (₹)': entry.amount || 0,
      'Date': entry.date ? new Date(entry.date).toLocaleDateString() : '',
    }))

    // Calculate totals
    const totalAmount = measurementBook.entries.reduce((sum, entry) => sum + entry.amount, 0)

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Add measurement book details sheet
    const bookDetails = [
      ['Measurement Book Details', ''],
      ['Title', measurementBook.title],
      ['Estimate', measurementBook.estimate.title],
      ['Category', measurementBook.estimate.category],
      ['Created', new Date(measurementBook.createdAt).toLocaleDateString()],
      ['Description', measurementBook.description || ''],
      ['Total Amount', totalAmount],
      ['', ''],
      ['Entries', ''],
    ]

    const detailsSheet = XLSX.utils.aoa_to_sheet(bookDetails)
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Book Details')

    // Add entries sheet
    const entriesSheet = XLSX.utils.json_to_sheet(entriesData)
    XLSX.utils.book_append_sheet(workbook, entriesSheet, 'Entries')

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Generate filename
    const filename = sanitizeFilename(`measurement-book-${measurementBook.title}-${new Date().toISOString().split('T')[0]}.xlsx`)

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating measurement book Excel:', error)
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 })
  }
}
