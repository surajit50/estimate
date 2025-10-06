import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { MeasurementEntriesTable } from "@/components/measurement-entries-table"
import { AbstractBillsTable } from "@/components/abstract-bills-table"
import { ArrowLeft, Edit, Calendar, MapPin, User, Building } from "lucide-react"

interface MeasurementBookPageProps {
  params: { id: string }
}

export default async function MeasurementBookPage({ params }: MeasurementBookPageProps) {
  const measurementBook = await prisma.measurementBook.findUnique({
    where: { id: params.id },
    include: {
      estimate: {
        select: {
          id: true,
          title: true,
          category: true,
          description: true,
          location: true,
        },
      },
      entries: {
        include: {
          unit: true,
        },
        orderBy: { entryDate: "desc" },
      },
      abstractBills: {
        include: {
          measurementBook: {
            include: {
              estimate: {
                select: {
                  id: true,
                  title: true,
                  category: true,
                },
              },
            },
          },
          items: {
            include: {
              unit: true,
              measurementEntry: true,
            },
          },
        },
        orderBy: { billDate: "desc" },
      },
    },
  })

  if (!measurementBook) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      case "submitted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardHeader />
      <main className="container mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Link href="/measurement-books">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{measurementBook.title}</h1>
              <p className="text-muted-foreground">
                Measurement book for {measurementBook.estimate.title}
              </p>
            </div>
            <Badge className={getStatusColor(measurementBook.status)}>
              {measurementBook.status}
            </Badge>
            <Link href={`/measurement-books/${measurementBook.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-semibold">
                      {new Date(measurementBook.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold">
                      {measurementBook.location || "Not specified"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contractor</p>
                    <p className="font-semibold">
                      {measurementBook.contractor || "Not specified"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Engineer</p>
                    <p className="font-semibold">
                      {measurementBook.engineer || "Not specified"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {measurementBook.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{measurementBook.description}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MeasurementEntriesTable
              measurementBookId={measurementBook.id}
              entries={measurementBook.entries}
            />

            <AbstractBillsTable abstractBills={measurementBook.abstractBills} />
          </div>
        </div>
      </main>
    </div>
  )
}
