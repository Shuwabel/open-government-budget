"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { StudentsTable } from "@/components/students-table"

export default function StudentsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Students</h1>
          <p className="text-muted-foreground">Manage student records and enrollment</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Student List</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentsTable />
        </CardContent>
      </Card>
    </div>
  )
}
