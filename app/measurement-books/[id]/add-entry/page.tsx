"use client"
import { AddMeasurementEntryDialog } from '@/components/add-measurement-entry-dialog'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter()
  const [id, setId] = useState<string>('')

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push(`/measurement-books/${id}`)
    }
  }

  const handleSuccess = () => {
    router.push(`/measurement-books/${id}`)
    router.refresh()
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <main className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <main className="container mx-auto px-6 py-12">
      <AddMeasurementEntryDialog
        open={true}
        onOpenChange={handleOpenChange}
        measurementBookId={id}
        onSuccess={handleSuccess}
        asPage
      />
      </main>
    </div>
  )
}

export default Page