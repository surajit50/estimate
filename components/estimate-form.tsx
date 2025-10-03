"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ESTIMATE_CATEGORIES } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface EstimateFormProps {
  estimate?: {
    id: string
    title: string
    category: string
    description: string | null
    location: string | null
    activityCode?: string | null
    cgstPercent?: number
    sgstPercent?: number
    cessPercent?: number
    contingency?: number
  }
}

export function EstimateForm({ estimate }: EstimateFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: estimate?.title || "",
    category: estimate?.category || "",
    description: estimate?.description || "",
    location: estimate?.location || "",
    activityCode: estimate?.activityCode || "",
    cgstPercent: estimate?.cgstPercent?.toString() || "9",
    sgstPercent: estimate?.sgstPercent?.toString() || "9",
    cessPercent: estimate?.cessPercent?.toString() || "1",
    contingency: estimate?.contingency?.toString() || "0",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = estimate ? `/api/estimates/${estimate.id}` : "/api/estimates"
      const method = estimate ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cgstPercent: Number.parseFloat(formData.cgstPercent),
          sgstPercent: Number.parseFloat(formData.sgstPercent),
          cessPercent: Number.parseFloat(formData.cessPercent),
          contingency: Number.parseFloat(formData.contingency),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/estimates/${data.id}/work-items`)
      }
    } catch (error) {
      console.error("Error saving estimate:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">{estimate ? "Edit Estimate" : "Create New Estimate"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Estimate Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter estimate title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {ESTIMATE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityCode">Activity Code</Label>
              <Input
                id="activityCode"
                value={formData.activityCode}
                onChange={(e) => setFormData({ ...formData, activityCode: e.target.value })}
                placeholder="e.g., 70330612"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Enter project location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter estimate description"
              rows={4}
            />
          </div>

          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-sm">Tax & Additional Charges</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cgstPercent">CGST (%)</Label>
                <Input
                  id="cgstPercent"
                  type="number"
                  step="0.01"
                  value={formData.cgstPercent}
                  onChange={(e) => setFormData({ ...formData, cgstPercent: e.target.value })}
                  placeholder="9.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sgstPercent">SGST (%)</Label>
                <Input
                  id="sgstPercent"
                  type="number"
                  step="0.01"
                  value={formData.sgstPercent}
                  onChange={(e) => setFormData({ ...formData, sgstPercent: e.target.value })}
                  placeholder="9.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cessPercent">L.W. Cess (%)</Label>
                <Input
                  id="cessPercent"
                  type="number"
                  step="0.01"
                  value={formData.cessPercent}
                  onChange={(e) => setFormData({ ...formData, cessPercent: e.target.value })}
                  placeholder="1.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contingency">Contingency (₹)</Label>
                <Input
                  id="contingency"
                  type="number"
                  step="0.01"
                  value={formData.contingency}
                  onChange={(e) => setFormData({ ...formData, contingency: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {estimate ? "Update Estimate" : "Create Estimate"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
