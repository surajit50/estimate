import { AddMeasurementEntryDialog } from '@/components/add-measurement-entry-dialog'
import React from 'react'

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return (
    <div>
        <AddMeasurementEntryDialog
            open={true}
            onOpenChange={() => {}}
            measurementBookId={id}
            onSuccess={() => {}}
        />
    </div>
  )
}

export default page