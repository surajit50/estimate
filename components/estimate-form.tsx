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
    cgstPercent?: number
    sgstPercent?: number
    cessPercent?: number
    contingency?: number
  }
}

export function EstimateForm({ estimate }: EstimateFormProps) {
  const router = useRouter()

  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      title: estimate?.title || "",
      category: (estimate?.category as any) || "",
      description: estimate?.description || "",
      location: estimate?.location || "",
      activityCode: estimate?.activityCode || "",
      cgstPercent: estimate?.cgstPercent ?? 9,
      sgstPercent: estimate?.sgstPercent ?? 9,
      cessPercent: estimate?.cessPercent ?? 1,
      contingency: estimate?.contingency ?? 0,
    },
  })

  const onSubmit = async (values: EstimateFormValues) => {
    try {
      let result
      if (estimate) {
        result = await updateEstimate(estimate.id, values)
      } else {
        result = await createEstimate(values)
      }

      if (result.success) {
        const estimateId = estimate ? estimate.id : result.data.id
        router.push(`/estimates/${estimateId}/work-items`)
      } else {
        console.error("Error saving estimate:", result.error)
      }
    } catch (error) {
      console.error("Error saving estimate:", error)
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Enter estimate description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 p-6 bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl border border-border/50">
              <h3 className="font-semibold text-lg text-foreground">Tax & Additional Charges</h3>
              <p className="text-sm text-muted-foreground">Configure tax rates and additional charges for your estimate</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cgstPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CGST (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="9.00" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sgstPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SGST (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="9.00" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cessPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>L.W. Cess (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="1.00" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contingency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contingency (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button type="submit" size="lg" className="flex-1 group" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                {estimate ? "Update Estimate" : "Create Estimate"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={form.formState.isSubmitting} size="lg">
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
