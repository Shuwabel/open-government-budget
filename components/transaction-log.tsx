"use client"

import { useState, useEffect } from "react"
import { DataTable } from "./data-table"
import { CheckCircle2, Clock, AlertCircle } from "lucide-react"

interface Transaction {
  id: string
  type: string
  projectName: string
  projectCode: string
  ministry: string
  amount: number
  status: "completed" | "pending" | "disbursed" | "failed"
  timestamp: string
  transactionHash: string | null
}

export function TransactionLog() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      // Fetch allocations and disbursements
      const [allocationsRes, disbursementsRes] = await Promise.all([
        fetch('/api/budget-allocations'),
        fetch('/api/disbursements')
      ])

      const allocationsData = await allocationsRes.json()
      const disbursementsData = await disbursementsRes.json()

      const allocations = allocationsData.success ? allocationsData.data || [] : []
      const disbursements = disbursementsData.success ? disbursementsData.data || [] : []

      // Combine and format transactions
      const formattedTransactions: Transaction[] = []

      // Add allocations
      allocations.slice(0, 10).forEach((alloc: any) => {
        formattedTransactions.push({
          id: alloc.id,
          type: "Budget Allocation",
          projectName: alloc.project_name || 'N/A',
          projectCode: alloc.project_code || 'N/A',
          ministry: alloc.ministries?.name || 'Unknown',
          amount: parseFloat(alloc.allocated_amount?.toString() || '0'),
          status: alloc.status === 'approved' ? 'completed' : alloc.status === 'pending' ? 'pending' : 'pending',
          timestamp: new Date(alloc.created_at).toLocaleString(),
          transactionHash: alloc.blockchain_tx_hash
        })
      })

      // Add disbursements
      disbursements.slice(0, 10).forEach((disb: any) => {
        formattedTransactions.push({
          id: disb.id,
          type: "Disbursement",
          projectName: disb.budget_allocations?.project_name || 'N/A',
          projectCode: disb.budget_allocations?.project_code || 'N/A',
          ministry: disb.budget_allocations?.ministries?.name || 'Unknown',
          amount: parseFloat(disb.amount?.toString() || '0'),
          status: disb.status === 'disbursed' ? 'disbursed' : disb.status === 'pending' ? 'pending' : 'pending',
          timestamp: new Date(disb.created_at || disb.disbursement_date).toLocaleString(),
          transactionHash: disb.blockchain_tx_hash
        })
      })

      // Sort by timestamp (newest first) and take top 10
      formattedTransactions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      setTransactions(formattedTransactions.slice(0, 10))
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) return `₦${(amount / 1e9).toFixed(2)}B`
    if (amount >= 1e6) return `₦${(amount / 1e6).toFixed(2)}M`
    if (amount >= 1e3) return `₦${(amount / 1e3).toFixed(2)}K`
    return `₦${amount.toLocaleString()}`
  }

  const columns = [
    {
      key: "type" as const,
      label: "Type",
      sortable: true,
    },
    {
      key: "projectName" as const,
      label: "Project",
      sortable: true,
      render: (value: string, row: Transaction) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-muted-foreground">{row.projectCode}</div>
        </div>
      ),
    },
    {
      key: "ministry" as const,
      label: "Ministry",
      sortable: true,
    },
    {
      key: "amount" as const,
      label: "Amount",
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold">{formatCurrency(value)}</span>
      ),
    },
    {
      key: "status" as const,
      label: "Status",
      sortable: true,
      render: (value: Transaction["status"]) => {
        const statusConfig: Record<string, { icon: typeof CheckCircle2, color: string, bg: string, label: string }> = {
          completed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/10", label: "Completed" },
          disbursed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/10", label: "Disbursed" },
          pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-500/10", label: "Pending" },
          failed: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-500/10", label: "Failed" },
        }
        const config = statusConfig[value] || statusConfig.pending
        const Icon = config.icon
        return (
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.color} text-sm font-medium`}
          >
            <Icon className="w-4 h-4" />
            {config.label}
          </span>
        )
      },
    },
    {
      key: "timestamp" as const,
      label: "Date",
      sortable: true,
    }
  ]

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
  }

  if (transactions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No transactions found</div>
  }

  return <DataTable<Transaction> columns={columns} data={transactions} title="Transaction History" />
}

