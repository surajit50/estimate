"use client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface MeasurementBook {
  id: string
  title: string
  description?: string | null
  estimate: {
    title: string
  }
}

interface DeleteMeasurementBookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  measurementBook: MeasurementBook | null
  onConfirm: () => void
}

export function DeleteMeasurementBookDialog({
  open,
  onOpenChange,
  measurementBook,
  onConfirm,
}: DeleteMeasurementBookDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Measurement Book</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the measurement book{" "}
            <strong>{measurementBook?.title}</strong> for estimate{" "}
            <strong>{measurementBook?.estimate.title}</strong>?
            <br />
            <br />
            This action cannot be undone. This will permanently delete the measurement book
            and all associated entries and abstract bills.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
