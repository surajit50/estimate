// Utility functions for export features

export function numberToWords(num: number): string {
  if (num === 0) return "Zero"

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]

  function convertLessThanThousand(n: number): string {
    if (n === 0) return ""
    if (n < 10) return ones[n]
    if (n < 20) return teens[n - 10]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "")
  }

  let integerPart = Math.floor(num)
  let result = ""

  // Indian numbering system
  if (integerPart >= 10000000) {
    result += convertLessThanThousand(Math.floor(integerPart / 10000000)) + " Crore "
    integerPart %= 10000000
  }
  if (integerPart >= 100000) {
    result += convertLessThanThousand(Math.floor(integerPart / 100000)) + " Lakh "
    integerPart %= 100000
  }
  if (integerPart >= 1000) {
    result += convertLessThanThousand(Math.floor(integerPart / 1000)) + " Thousand "
    integerPart %= 1000
  }
  if (integerPart > 0) {
    result += convertLessThanThousand(integerPart)
  }

  return result.trim()
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9]/gi, "-").toLowerCase()
}
