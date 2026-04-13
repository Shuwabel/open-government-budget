"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Users, CheckCircle2, Clock } from "lucide-react"
import { toast } from "sonner"

interface Contractor {
  id: string
  name: string
  registration_number: string
  email: string
  phone: string | null
  verification_status: string
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    registration_number: '',
    email: '',
    phone: '',
    address: '',
    contractor_type: 'individual',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchContractors()
  }, [])

  const fetchContractors = async () => {
    try {
      const response = await fetch('/api/contractors')
      const data = await response.json()
      if (data.success && data.data) {
        setContractors(data.data)
      }
    } catch (error) {
      console.error('Error fetching contractors:', error)
      toast.error('Failed to fetch contractors')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/contractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Contractor created successfully!')
        setIsDialogOpen(false)
        setFormData({
          name: '',
          registration_number: '',
          email: '',
          phone: '',
          address: '',
          contractor_type: 'individual',
          contact_person_name: '',
          contact_person_email: '',
          contact_person_phone: ''
        })
        fetchContractors()
      } else {
        toast.error(data.error || 'Failed to create contractor')
      }
    } catch (error) {
      console.error('Error creating contractor:', error)
      toast.error('Failed to create contractor')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Contractors</h1>
          <p className="text-muted-foreground">Manage contractors and vendors</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Contractor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Contractor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Contractor Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., ABC Construction Ltd"
                  />
                </div>
                <div>
                  <Label htmlFor="registration_number">Registration Number *</Label>
                  <Input
                    id="registration_number"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    required
                    placeholder="e.g., RC123456"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="contractor@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+234 800 000 0000"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Contractor address"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="contractor_type">Contractor Type</Label>
                <select
                  id="contractor_type"
                  value={formData.contractor_type}
                  onChange={(e) => setFormData({ ...formData, contractor_type: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                  <option value="ngo">NGO</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_person_name">Contact Person Name</Label>
                  <Input
                    id="contact_person_name"
                    value={formData.contact_person_name}
                    onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_person_email">Contact Person Email</Label>
                  <Input
                    id="contact_person_email"
                    type="email"
                    value={formData.contact_person_email}
                    onChange={(e) => setFormData({ ...formData, contact_person_email: e.target.value })}
                    placeholder="contact@example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="contact_person_phone">Contact Person Phone</Label>
                <Input
                  id="contact_person_phone"
                  value={formData.contact_person_phone}
                  onChange={(e) => setFormData({ ...formData, contact_person_phone: e.target.value })}
                  placeholder="+234 800 000 0000"
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
                  {submitting ? 'Registering...' : 'Register Contractor'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Loading...</div>
        ) : contractors.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-primary/20">
              <CardContent className="py-12">
                <div className="text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No contractors found</p>
                  <p className="text-sm text-muted-foreground">
                    Use the SQL script to add contractors to the database.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          contractors.map((contractor) => (
            <Card key={contractor.id} className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle>{contractor.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Reg: {contractor.registration_number}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground mb-3">{contractor.email}</p>
                <div className="flex items-center gap-2">
                  {contractor.verification_status === 'verified' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">Verified</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600 font-medium">Pending</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

