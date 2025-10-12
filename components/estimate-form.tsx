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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
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
    clientName?: string | null
    clientContact?: string | null
    clientEmail?: string | null
    clientAddress?: string | null
    startDate?: Date | null
    endDate?: Date | null
    duration?: number | null
    estimatedBudget?: number
    actualCost?: number
    status?: string
    priority?: string
    tags?: string[]
    cgstPercent?: number
    sgstPercent?: number
    cessPercent?: number
    contingency?: number
    overhead?: number
    profitMargin?: number
    discount?: number
    notes?: string | null
  }
}

export function EstimateForm({ estimate }: EstimateFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [newTag, setNewTag] = React.useState("")

  const addTag = () => {
    if (newTag.trim() && !form.getValues("tags").includes(newTag.trim())) {
      const currentTags = form.getValues("tags")
      form.setValue("tags", [...currentTags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags")
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove))
  }

  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      title: estimate?.title || "",
      category: (estimate?.category as any) || "",
      description: estimate?.description || "",
      location: estimate?.location || "",
      activityCode: estimate?.activityCode || "",
      
      // Client Information
      clientName: estimate?.clientName || "",
      clientContact: estimate?.clientContact || "",
      clientEmail: estimate?.clientEmail || "",
      clientAddress: estimate?.clientAddress || "",
      
      // Project Timeline
      startDate: estimate?.startDate ? estimate.startDate.toISOString().split('T')[0] : "",
      endDate: estimate?.endDate ? estimate.endDate.toISOString().split('T')[0] : "",
      duration: estimate?.duration || undefined,
      
      // Budget Tracking
      estimatedBudget: estimate?.estimatedBudget ?? 0,
      actualCost: estimate?.actualCost ?? 0,
      
      // Status and Priority
      status: (estimate?.status as any) || "draft",
      priority: (estimate?.priority as any) || "medium",
      
      // Tags
      tags: estimate?.tags || [],
      
      // Tax Configuration
      cgstPercent: estimate?.cgstPercent ?? 9,
      sgstPercent: estimate?.sgstPercent ?? 9,
      cessPercent: estimate?.cessPercent ?? 1,
      
      // Additional Costs
      contingency: estimate?.contingency ?? 0,
      overhead: estimate?.overhead ?? 0,
      profitMargin: estimate?.profitMargin ?? 10,
      discount: estimate?.discount ?? 0,
      
      // Notes
      notes: estimate?.notes || "",
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

            {/* Client Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Client Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter client name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="clientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Enter client address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Project Timeline Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Project Timeline</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (Days)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Budget & Status Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Budget & Status</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estimatedBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Budget (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="actualCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Cost (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Tags</h3>
              
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Tags</FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <Button type="button" onClick={addTag} variant="outline">
                          Add Tag
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tax & Additional Charges Section */}
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
                        <Input type="number" step="0.01" placeholder="9.00" {...field} />
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
                        <Input type="number" step="0.01" placeholder="9.00" {...field} />
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
                        <Input type="number" step="0.01" placeholder="1.00" {...field} />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="overhead"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overhead (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profitMargin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profit Margin (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="10.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Additional Notes</h3>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Enter any additional notes or comments" {...field} />
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
