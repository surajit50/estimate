"use client"

import * as React from "react"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { estimateSchema, type EstimateFormValues } from "@/lib/schemas"
import { ESTIMATE_CATEGORIES } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { createEstimate, updateEstimate } from "@/lib/actions/estimates"

interface EstimateFormProps {
  estimate?: {
    id: string
    title: string
    category: string
    description: string | null
    location: string | null
    activityCode?: string | null
    cgstPercent?: number | null
    sgstPercent?: number | null
    cessPercent?: number | null
    contingency?: number | null
    contractualPercent?: number | null
    
  }
}

export function EstimateForm({ estimate }: EstimateFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  

  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      title: estimate?.title || "",
      category: (estimate?.category as any) || "",
      description: estimate?.description || "",
      location: estimate?.location || "",
      activityCode: estimate?.activityCode || "",
      cgstPercent: Number(estimate?.cgstPercent ?? 0),
      sgstPercent: Number(estimate?.sgstPercent ?? 0),
      cessPercent: Number(estimate?.cessPercent ?? 0),
      contingency: Number(estimate?.contingency ?? 0),
      contractualPercent: Number(estimate?.contractualPercent ?? 0),
      
      
    },
  })

  const onSubmit = async (values: EstimateFormValues) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      let result
      if (estimate) {
        result = await updateEstimate(estimate.id, values)
      } else {
        result = await createEstimate(values)
      }

      if (result.success && result.data) {
        const estimateId = estimate ? estimate.id : result.data.id
        router.push(`/estimates/${estimateId}/work-items`)
      } else {
        setError(result.error || "Failed to save estimate")
      }
    } catch (error) {
      console.error("Error saving estimate:", error)
      setError(error instanceof Error ? error.message : "Failed to save estimate")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-3xl mx-auto shadow-lg border-border/50">
      <CardHeader className="text-center pb-8">
        <CardTitle className="text-3xl font-bold">
          {estimate ? "Edit Estimate" : "Create New Estimate"}
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          {estimate ? "Update your estimate details" : "Fill in the details to create a new construction estimate"}
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimate Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter estimate title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activityCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 70330612" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Financial configuration */}
              <h3 className="text-lg font-semibold text-foreground border-b pb-2 mt-4">Financial Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cgstPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CGST %</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value ?? 0} />
                      </FormControl>
                      <FormDescription>Central GST percentage.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sgstPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SGST %</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value ?? 0} />
                      </FormControl>
                      <FormDescription>State GST percentage.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cessPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>L.W. Cess %</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value ?? 0} />
                      </FormControl>
                      <FormDescription>Labour Welfare Cess percentage.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contingency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contingency %</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value ?? 0} />
                      </FormControl>
                      <FormDescription>Contingencies over item total.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractualPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Less Contractual %</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} value={field.value ?? 0} />
                      </FormControl>
                      <FormDescription>Deduction before taxes in Abstract Bill.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Enter estimate description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            

            

            {/* Error Display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <Button type="submit" size="lg" className="flex-1 group" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                {isSubmitting ? (estimate ? "Updating..." : "Creating...") : (estimate ? "Update Estimate" : "Create Estimate")}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} size="lg">
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
