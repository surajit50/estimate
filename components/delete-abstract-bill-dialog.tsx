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

interface AbstractBill {
  id: string
  billNo: string
  totalAmount: number
  measurementBook: {
    title: string
  }
}

interface DeleteAbstractBillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  abstractBill: AbstractBill | null
  onConfirm: () => void
}

export function DeleteAbstractBillDialog({
  open,
  onOpenChange,
  abstractBill,
  onConfirm,
}: DeleteAbstractBillDialogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Abstract Bill</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the abstract bill{" "}
            <strong>{abstractBill?.billNo}</strong> for measurement book{" "}
            <strong>{abstractBill?.measurementBook.title}</strong>?
            <br />
            <br />
            <strong>Bill Amount:</strong> {formatCurrency(abstractBill?.totalAmount || 0)}
            <br />
            <br />
            This action cannot be undone. This will permanently delete the abstract bill
            and all associated items.
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
