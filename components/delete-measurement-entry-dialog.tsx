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

interface MeasurementEntry {
  id: string
  pageNo: string
  itemNo: string
  description: string
  quantity: number
  unit: {
    unitSymbol: string
  }
}

interface DeleteMeasurementEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: MeasurementEntry | null
  onConfirm: () => void
}

export function DeleteMeasurementEntryDialog({
  open,
  onOpenChange,
  entry,
  onConfirm,
}: DeleteMeasurementEntryDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Measurement Entry</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the measurement entry for{" "}
            <strong>{entry?.description}</strong>?
            <br />
            <br />
            <strong>Details:</strong>
            <br />
            • Page: {entry?.pageNo}
            <br />
            • Item No: {entry?.itemNo}
            <br />
            • Quantity: {entry?.quantity} {entry?.unit.unitSymbol}
            <br />
            <br />
            This action cannot be undone.
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
