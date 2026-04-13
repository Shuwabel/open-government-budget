"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Building2, X } from "lucide-react"
import { toast } from "sonner"

interface Ministry {
  id: string
  name: string
  code: string
  description: string | null
  minister_name: string | null
  minister_email: string | null
  status: string
}

export default function MinistriesPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    minister_name: '',
    minister_email: '',
    budget_code: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchMinistries()
  }, [])

  const fetchMinistries = async () => {
    try {
      const response = await fetch('/api/ministries')
      const data = await response.json()
      if (data.success && data.data) {
        setMinistries(data.data)
      }
    } catch (error) {
      console.error('Error fetching ministries:', error)
      toast.error('Failed to fetch ministries')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/ministries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Ministry created successfully!')
        setIsDialogOpen(false)
        setFormData({
          name: '',
          code: '',
          description: '',
          minister_name: '',
          minister_email: '',
          budget_code: ''
        })
        fetchMinistries()
      } else {
        toast.error(data.error || 'Failed to create ministry')
      }
    } catch (error) {
      console.error('Error creating ministry:', error)
      toast.error('Failed to create ministry')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Ministries</h1>
          <p className="text-muted-foreground">Manage government ministries and departments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Ministry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Ministry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Ministry Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Ministry of Finance"
                  />
                </div>
                <div>
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    placeholder="e.g., MOF"
                    maxLength={10}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the ministry"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minister_name">Minister Name</Label>
                  <Input
                    id="minister_name"
                    value={formData.minister_name}
                    onChange={(e) => setFormData({ ...formData, minister_name: e.target.value })}
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="minister_email">Minister Email</Label>
                  <Input
                    id="minister_email"
                    type="email"
                    value={formData.minister_email}
                    onChange={(e) => setFormData({ ...formData, minister_email: e.target.value })}
                    placeholder="minister@example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="budget_code">Budget Code</Label>
                <Input
                  id="budget_code"
                  value={formData.budget_code}
                  onChange={(e) => setFormData({ ...formData, budget_code: e.target.value })}
                  placeholder="e.g., BUD-2024-MOF"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-primary to-accent"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Ministry'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Loading...</div>
        ) : ministries.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No ministries found. Use the SQL script to add ministries to the database.
          </div>
        ) : (
          ministries.map((ministry) => (
            <Card key={ministry.id} className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{ministry.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Code: {ministry.code}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ministry.description && (
                  <p className="text-sm text-muted-foreground mb-3">{ministry.description}</p>
                )}
                {ministry.minister_name && (
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Minister:</span> {ministry.minister_name}
                  </p>
                )}
                <div className="mt-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ministry.status === 'active' 
                      ? 'bg-green-500/10 text-green-600' 
                      : 'bg-gray-500/10 text-gray-600'
                  }`}>
                    {ministry.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

