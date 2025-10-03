import { prisma } from "@/lib/db"
import { EstimateForm } from "@/components/estimate-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

export default async function EditEstimatePage(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const estimate = await prisma.estimate.findUnique({
    where: { id },
  })

  if (!estimate) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <EstimateForm estimate={estimate} />
      </div>
    </div>
  )
}
