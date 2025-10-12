"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, DollarSign, Ruler, Sun, Moon, BookOpen, FileText } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function DashboardHeader() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold gradient-text">
              Estimate Preparation System
            </h1>
            <p className="text-muted-foreground">Manage construction estimates and work items with precision</p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="group"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
              ) : (
                <Moon className="h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
              )}
            </Button>
            <Link href="/admin/units">
              <Button variant="outline" size="default" className="group">
                <Ruler className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                Unit Master
              </Button>
            </Link>
            <Link href="/admin/rates">
              <Button variant="outline" size="default" className="group">
                <DollarSign className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                Rate Library
              </Button>
            </Link>
            <Link href="/measurement-books">
              <Button variant="outline" size="default" className="group">
                <BookOpen className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                Measurement Books
              </Button>
            </Link>
            <Link href="/abstract-bills">
              <Button variant="outline" size="default" className="group">
                <FileText className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                Abstract Bills
              </Button>
            </Link>
            <Link href="/estimates/new">
              <Button size="default" className="group">
                <PlusCircle className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                New Estimate
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
