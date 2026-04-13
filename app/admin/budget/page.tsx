"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, DollarSign, TrendingUp, CheckCircle2, Clock, Search, Filter } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { toast } from "sonner"
import { SearchBar } from "@/components/dashboard/search-bar"

interface BudgetAllocation {
  id: string
  project_code: string
  project_name: string
  allocated_amount: number
  status: string
  created_at: string
  blockchain_tx_hash?: string | null
  ministries?: { name: string }
}

interface Ministry {
  id: string
  name: string
  code: string
}

interface Category {
  id: string
  name: string
  code: string
}

export default function BudgetAllocationsPage() {
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([])
  const [filteredAllocations, setFilteredAllocations] = useState<BudgetAllocation[]>([])
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [formData, setFormData] = useState({
    fiscalYearId: '',
    ministryId: '',
    categoryId: '',
    projectName: '',
    projectDescription: '',
    allocatedAmount: '',
    projectCode: '',
    priorityLevel: '1',
    expectedStartDate: '',
    expectedEndDate: ''
  })

  useEffect(() => {
    fetchAllocations()
    fetchMinistries()
    fetchCategories()
  }, [])

  const fetchAllocations = async () => {
    try {
      const response = await fetch('/api/budget-allocations')
      const data = await response.json()
      if (data.success) {
        setAllocations(data.data || [])
        setFilteredAllocations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching allocations:', error)
      toast.error('Failed to fetch allocations')
    } finally {
      setLoading(false)
    }
  }

  // Filter allocations based on search and status
  useEffect(() => {
    let filtered = allocations

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(alloc => 
        alloc.project_name?.toLowerCase().includes(query) ||
        alloc.project_code?.toLowerCase().includes(query) ||
        alloc.ministries?.name?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(alloc => alloc.status === statusFilter)
    }

    setFilteredAllocations(filtered)
  }, [searchQuery, statusFilter, allocations])

  const fetchMinistries = async () => {
    try {
      const response = await fetch('/api/ministries')
      const data = await response.json()
      if (data.success && data.data) {
        setMinistries(data.data)
      }
    } catch (error) {
      console.error('Error fetching ministries:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/budget-categories')
      const data = await response.json()
      if (data.success && data.data) {
        setCategories(data.data)
      } else {
        // Fallback to empty array if API fails
        setCategories([])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/budget-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          allocatedAmount: parseFloat(formData.allocatedAmount),
          priorityLevel: parseInt(formData.priorityLevel),
          // Don't send fiscalYearId if empty - API will handle it
          fiscalYearId: formData.fiscalYearId || undefined,
          // Don't send createdBy - API will set it to null if not provided
          // TODO: Get from auth context when authentication is implemented
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(
          data.blockchain?.success 
            ? `Allocation created! Blockchain TX: ${data.blockchain.transactionHash.substring(0, 10)}...`
            : 'Allocation created successfully!'
        )
        setIsDialogOpen(false)
        setFormData({
          fiscalYearId: '',
          ministryId: '',
          categoryId: '',
          projectName: '',
          projectDescription: '',
          allocatedAmount: '',
          projectCode: '',
          priorityLevel: '1',
          expectedStartDate: '',
          expectedEndDate: ''
        })
        fetchAllocations()
      } else {
        toast.error(data.error || 'Failed to create allocation')
      }
    } catch (error) {
      console.error('Error creating allocation:', error)
      toast.error('Failed to create allocation')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const columns = [
    {
      key: 'project_code' as const,
      label: 'Project Code',
      render: (value: string) => <span className="font-mono text-sm">{value || 'N/A'}</span>
    },
    {
      key: 'project_name' as const,
      label: 'Project Name',
    },
    {
      key: 'allocated_amount' as const,
      label: 'Amount',
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => {
        const colors = {
          approved: 'bg-green-500/10 text-green-600',
          pending: 'bg-yellow-500/10 text-yellow-600',
          allocated: 'bg-blue-500/10 text-blue-600'
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value as keyof typeof colors] || 'bg-gray-500/10 text-gray-600'}`}>
            {value}
          </span>
        )
      }
    },
    {
      key: 'created_at' as const,
      label: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString()
    }
  ]

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gradient-to-br from-background via-background to-primary/5 min-h-screen">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Budget Allocations
          </h1>
          <p className="text-muted-foreground">Manage government budget allocations across ministries</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Create Allocation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Budget Allocation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ministryId">Ministry *</Label>
                  <select
                    id="ministryId"
                    value={formData.ministryId}
                    onChange={(e) => setFormData({ ...formData, ministryId: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Ministry</option>
                    {ministries.map((ministry) => (
                      <option key={ministry.id} value={ministry.id}>
                        {ministry.name} ({ministry.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="categoryId">Category *</Label>
                  <select
                    id="categoryId"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    required
                    placeholder="e.g., Road Construction Project"
                  />
                </div>
                <div>
                  <Label htmlFor="projectCode">Project Code</Label>
                  <Input
                    id="projectCode"
                    value={formData.projectCode}
                    onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                    placeholder="e.g., PROJ-2024-001"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="projectDescription">Project Description</Label>
                <Textarea
                  id="projectDescription"
                  value={formData.projectDescription}
                  onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                  placeholder="Brief description of the project"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="allocatedAmount">Allocated Amount (₦) *</Label>
                  <Input
                    id="allocatedAmount"
                    type="number"
                    step="0.01"
                    value={formData.allocatedAmount}
                    onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
                    required
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <Label htmlFor="priorityLevel">Priority Level</Label>
                  <select
                    id="priorityLevel"
                    value={formData.priorityLevel}
                    onChange={(e) => setFormData({ ...formData, priorityLevel: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="1">Low</option>
                    <option value="2">Medium</option>
                    <option value="3">High</option>
                    <option value="4">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expectedStartDate">Expected Start Date</Label>
                  <Input
                    id="expectedStartDate"
                    type="date"
                    value={formData.expectedStartDate}
                    onChange={(e) => setFormData({ ...formData, expectedStartDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expectedEndDate">Expected End Date</Label>
                  <Input
                    id="expectedEndDate"
                    type="date"
                    value={formData.expectedEndDate}
                    onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })}
                  />
                </div>
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
                  {submitting ? 'Creating...' : 'Create Allocation'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1 w-full">
          <SearchBar 
            onSearch={setSearchQuery}
            placeholder="Search by project name, code, or ministry..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="allocated">Allocated</option>
          </select>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Allocations</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{allocations.length}</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-sm hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Amount</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {formatCurrency(allocations.reduce((sum, a) => sum + a.allocated_amount, 0))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approved</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">
              {allocations.filter(a => a.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-sm hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">
              {allocations.filter(a => a.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocations Table */}
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 backdrop-blur-sm shadow-lg">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              All Budget Allocations
              {searchQuery || statusFilter !== "all" ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredAllocations.length} of {allocations.length})
                </span>
              ) : null}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading allocations...</p>
            </div>
          ) : filteredAllocations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-foreground mb-2">
                {searchQuery || statusFilter !== "all" 
                  ? "No allocations match your filters" 
                  : "No budget allocations found"}
              </p>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first allocation to get started"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-primary to-accent"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Allocation
                </Button>
              )}
            </div>
          ) : (
            <DataTable columns={columns} data={filteredAllocations} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

