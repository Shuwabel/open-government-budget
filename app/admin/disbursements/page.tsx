"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, FileText, DollarSign, CheckCircle2, Clock } from "lucide-react"
import { toast } from "sonner"

interface Disbursement {
  id: string
  amount: number
  status: string
  disbursement_date: string
  blockchain_tx_hash: string | null
  budget_allocations?: { project_name: string; id: string }
  contractors?: { name: string; id: string }
}

interface BudgetAllocation {
  id: string
  project_name: string
  project_code: string
  allocated_amount: number
  status: string
}

interface Contractor {
  id: string
  name: string
  registration_number: string
}

export default function DisbursementsPage() {
  const [disbursements, setDisbursements] = useState<Disbursement[]>([])
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    allocationId: '',
    contractorId: '',
    amount: '',
    disbursementReason: '',
    disbursementType: 'initial',
    disbursementDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer'
  })

  useEffect(() => {
    fetchDisbursements()
    fetchAllocations()
    fetchContractors()
  }, [])

  const fetchDisbursements = async () => {
    try {
      const response = await fetch('/api/disbursements')
      const data = await response.json()
      if (data.success) {
        setDisbursements(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching disbursements:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllocations = async () => {
    try {
      // Fetch allocations that can be disbursed (approved or allocated)
      const response = await fetch('/api/budget-allocations')
      const data = await response.json()
      if (data.success) {
        // Filter to only show allocations that can be disbursed
        const availableAllocations = (data.data || []).filter(
          (a: BudgetAllocation) => a.status === 'approved' || a.status === 'allocated'
        )
        setAllocations(availableAllocations)
      }
    } catch (error) {
      console.error('Error fetching allocations:', error)
    }
  }

  const fetchContractors = async () => {
    try {
      const response = await fetch('/api/contractors')
      const data = await response.json()
      if (data.success) {
        setContractors(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching contractors:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/disbursements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocationId: formData.allocationId,
          contractorId: formData.contractorId,
          amount: parseFloat(formData.amount),
          disbursementReason: formData.disbursementReason,
          disbursementType: formData.disbursementType,
          disbursementDate: formData.disbursementDate,
          paymentMethod: formData.paymentMethod
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(
          data.blockchain?.success 
            ? `Disbursement created! Blockchain TX: ${data.blockchain.transactionHash.substring(0, 10)}...`
            : 'Disbursement created successfully!'
        )
        setIsDialogOpen(false)
        setFormData({
          allocationId: '',
          contractorId: '',
          amount: '',
          disbursementReason: '',
          disbursementType: 'initial',
          disbursementDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'bank_transfer'
        })
        fetchDisbursements()
      } else {
        toast.error(data.error || 'Failed to create disbursement')
      }
    } catch (error) {
      console.error('Error creating disbursement:', error)
      toast.error('Failed to create disbursement')
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

  const stats = {
    total: disbursements.length,
    totalAmount: disbursements.reduce((sum, d) => sum + d.amount, 0),
    disbursed: disbursements.filter(d => d.status === 'disbursed').length,
    pending: disbursements.filter(d => d.status === 'pending').length
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Disbursements</h1>
          <p className="text-muted-foreground">Track fund disbursements to contractors</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Create Disbursement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Disbursement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="allocationId">Budget Allocation *</Label>
                  <select
                    id="allocationId"
                    value={formData.allocationId}
                    onChange={(e) => setFormData({ ...formData, allocationId: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Allocation</option>
                    {allocations.map((allocation) => (
                      <option key={allocation.id} value={allocation.id}>
                        {allocation.project_name} ({allocation.project_code}) - {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(allocation.allocated_amount)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="contractorId">Contractor *</Label>
                  <select
                    id="contractorId"
                    value={formData.contractorId}
                    onChange={(e) => setFormData({ ...formData, contractorId: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Contractor</option>
                    {contractors.map((contractor) => (
                      <option key={contractor.id} value={contractor.id}>
                        {contractor.name} ({contractor.registration_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (₦) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <Label htmlFor="disbursementType">Disbursement Type *</Label>
                  <select
                    id="disbursementType"
                    value={formData.disbursementType}
                    onChange={(e) => setFormData({ ...formData, disbursementType: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="initial">Initial</option>
                    <option value="milestone">Milestone</option>
                    <option value="final">Final</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="disbursementReason">Disbursement Reason *</Label>
                <Textarea
                  id="disbursementReason"
                  value={formData.disbursementReason}
                  onChange={(e) => setFormData({ ...formData, disbursementReason: e.target.value })}
                  required
                  placeholder="Reason for this disbursement"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="disbursementDate">Disbursement Date *</Label>
                  <Input
                    id="disbursementDate"
                    type="date"
                    value={formData.disbursementDate}
                    onChange={(e) => setFormData({ ...formData, disbursementDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="cash">Cash</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
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
                  {submitting ? 'Creating...' : 'Create Disbursement'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Disbursements</CardTitle>
            <FileText className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            <DollarSign className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disbursed</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.disbursed}</div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="w-5 h-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Disbursements List */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>All Disbursements</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : disbursements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No disbursements found. Create your first disbursement to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {disbursements.map((disbursement) => (
                <div
                  key={disbursement.id}
                  className="p-4 border border-border rounded-lg hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {disbursement.budget_allocations?.project_name || 'Unknown Project'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {disbursement.contractors?.name || 'Unknown Contractor'}
                      </p>
                      {disbursement.blockchain_tx_hash && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          Tx: {disbursement.blockchain_tx_hash.substring(0, 10)}...
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(disbursement.amount)}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        disbursement.status === 'disbursed'
                          ? 'bg-green-500/10 text-green-600'
                          : disbursement.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-600'
                          : 'bg-gray-500/10 text-gray-600'
                      }`}>
                        {disbursement.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



