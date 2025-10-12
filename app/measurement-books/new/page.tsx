"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DashboardHeader } from "@/components/dashboard-header"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"
import { getEstimates } from "@/lib/actions/estimates"

interface Estimate {
  id: string
  title: string
  category: string
}

export default function NewMeasurementBookPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [formData, setFormData] = useState({
    estimateId: "",
    title: "",
    description: "",
    location: "",
    contractor: "",
    engineer: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/measurement-books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to create measurement book")
      }

      const measurementBook = await response.json()
      toast.success("Measurement book created successfully!")
      router.push(`/measurement-books/${measurementBook.id}`)
    } catch (error) {
      console.error("Error creating measurement book:", error)
      toast.error("Failed to create measurement book")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // Load estimates on component mount
  React.useEffect(() => {
    const fetchEstimates = async () => {
      try {
        const result = await getEstimates()
        if (result.success) {
          setEstimates(result.data)
        }
      } catch (error) {
        console.error("Error fetching estimates:", error)
      }
    }

    fetchEstimates()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardHeader />
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Link href="/measurement-books">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Create Measurement Book</h1>
              <p className="text-muted-foreground">
                Create a new measurement book to track work progress and measurements
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Measurement Book Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="estimateId">Estimate *</Label>
                  <Select
                    value={formData.estimateId}
                    onValueChange={(value) => handleInputChange("estimateId", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an estimate" />
                    </SelectTrigger>
                    <SelectContent>
                      {estimates.map((estimate) => (
                        <SelectItem key={estimate.id} value={estimate.id}>
                          <div>
                            <div className="font-medium">{estimate.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {estimate.category}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter measurement book title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter description (optional)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="Project location"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractor">Contractor</Label>
                    <Input
                      id="contractor"
                      value={formData.contractor}
                      onChange={(e) => handleInputChange("contractor", e.target.value)}
                      placeholder="Contractor name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engineer">Engineer</Label>
                  <Input
                    id="engineer"
                    value={formData.engineer}
                    onChange={(e) => handleInputChange("engineer", e.target.value)}
                    placeholder="Engineer name"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Measurement Book
                      </>
                    )}
                  </Button>
                  <Link href="/measurement-books">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
