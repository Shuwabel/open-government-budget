"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CredentialsTable } from "@/components/credentials-table"

export default function CredentialsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Credentials</h1>
          <p className="text-muted-foreground">Manage and issue student credentials</p>
        </div>
        <Link href="/admin/credentials/issue">
          <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Issue Credential
          </Button>
        </Link>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Issued Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <CredentialsTable />
        </CardContent>
      </Card>
    </div>
  )
}
