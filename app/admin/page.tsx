"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, DollarSign, Building2, CheckCircle2, TrendingUp, Activity } from "lucide-react"
import { TransactionLog } from "@/components/transaction-log"
import { SearchBar } from "@/components/dashboard/search-bar"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { UtilizationMeter } from "@/components/dashboard/utilization-meter"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"

interface DashboardStats {
  totalBudgetAllocated: number
  activeMinistries: number
  verifiedTransactions: number
  pendingApprovals: number
  totalDisbursed: number
  ministryData: Array<{
    name: string
    allocated: number
    disbursed: number
    color: string
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBudgetAllocated: 0,
    activeMinistries: 0,
    verifiedTransactions: 0,
    pendingApprovals: 0,
    totalDisbursed: 0,
    ministryData: []
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch allocations
      const allocationsRes = await fetch('/api/budget-allocations')
      const allocationsData = await allocationsRes.json()
      const allocations = allocationsData.success ? allocationsData.data || [] : []

      // Fetch ministries
      const ministriesRes = await fetch('/api/ministries')
      const ministriesData = await ministriesRes.json()
      const ministries = ministriesData.success ? ministriesData.data || [] : []

      // Fetch disbursements
      const disbursementsRes = await fetch('/api/disbursements')
      const disbursementsData = await disbursementsRes.json()
      const disbursements = disbursementsData.success ? disbursementsData.data || [] : []

      // Calculate stats
      const totalBudget = allocations.reduce((sum: number, a: any) => 
        sum + parseFloat(a.allocated_amount?.toString() || '0'), 0
      )
      
      const activeMinistries = ministries.filter((m: any) => m.status === 'active').length
      
      const verifiedTransactions = disbursements.filter((d: any) => 
        d.blockchain_tx_hash && d.status === 'disbursed'
      ).length
      
      const pendingApprovals = allocations.filter((a: any) => 
        a.status === 'pending' || a.status === 'allocated'
      ).length

      const totalDisbursed = disbursements
        .filter((d: any) => d.status === 'disbursed')
        .reduce((sum: number, d: any) => sum + parseFloat(d.amount?.toString() || '0'), 0)

      // Group by ministry for chart data
      const ministryMap = new Map<string, { allocated: number; disbursed: number }>()
      allocations.forEach((alloc: any) => {
        const ministryName = alloc.ministries?.name || 'Unknown'
        const allocated = parseFloat(alloc.allocated_amount?.toString() || '0')
        if (!ministryMap.has(ministryName)) {
          ministryMap.set(ministryName, { allocated: 0, disbursed: 0 })
        }
        const current = ministryMap.get(ministryName)!
        current.allocated += allocated
      })

      disbursements.forEach((disb: any) => {
        const ministryName = disb.budget_allocations?.ministries?.name || 'Unknown'
        const amount = parseFloat(disb.amount?.toString() || '0')
        if (ministryMap.has(ministryName)) {
          ministryMap.get(ministryName)!.disbursed += amount
        }
      })

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
      const ministryData = Array.from(ministryMap.entries())
        .slice(0, 6)
        .map(([name, data], index) => ({
          name,
          allocated: data.allocated,
          disbursed: data.disbursed,
          color: colors[index % colors.length]
        }))

      setStats({
        totalBudgetAllocated: totalBudget,
        activeMinistries,
        verifiedTransactions,
        pendingApprovals,
        totalDisbursed,
        ministryData
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1e12) return `₦${(amount / 1e12).toFixed(2)}T`
    if (amount >= 1e9) return `₦${(amount / 1e9).toFixed(2)}B`
    if (amount >= 1e6) return `₦${(amount / 1e6).toFixed(2)}M`
    return `₦${amount.toLocaleString()}`
  }

  const statsConfig = [
    { 
      label: "Total Budget Allocated", 
      value: formatCurrency(stats.totalBudgetAllocated), 
      icon: DollarSign, 
      color: "text-blue-500",
      bgGradient: "from-blue-500/10 to-blue-600/5",
      borderColor: "border-blue-500/20"
    },
    { 
      label: "Total Disbursed", 
      value: formatCurrency(stats.totalDisbursed), 
      icon: TrendingUp, 
      color: "text-green-500",
      bgGradient: "from-green-500/10 to-green-600/5",
      borderColor: "border-green-500/20"
    },
    { 
      label: "Active Ministries", 
      value: stats.activeMinistries.toString(), 
      icon: Building2, 
      color: "text-purple-500",
      bgGradient: "from-purple-500/10 to-purple-600/5",
      borderColor: "border-purple-500/20"
    },
    { 
      label: "Verified Transactions", 
      value: stats.verifiedTransactions.toString(), 
      icon: CheckCircle2, 
      color: "text-emerald-500",
      bgGradient: "from-emerald-500/10 to-emerald-600/5",
      borderColor: "border-emerald-500/20"
    },
    { 
      label: "Pending Approvals", 
      value: stats.pendingApprovals.toString(), 
      icon: BarChart3, 
      color: "text-amber-500",
      bgGradient: "from-amber-500/10 to-amber-600/5",
      borderColor: "border-amber-500/20"
    },
  ]

  const utilizationPercentage = stats.totalBudgetAllocated > 0 
    ? (stats.totalDisbursed / stats.totalBudgetAllocated) * 100 
    : 0

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gradient-to-br from-background via-background to-primary/5 min-h-screen">
      {/* Header with Search and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Budget Dashboard
          </h1>
          <p className="text-muted-foreground">Real-time monitoring of government budget allocations and spending</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar onSearch={setSearchQuery} />
          <QuickActions />
        </div>
      </div>

      {/* Enhanced Stats Grid with Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card 
              key={stat.label} 
              className={`border-2 ${stat.borderColor} bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.bgGradient}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.color} mb-1`}>
                  {loading ? (
                    <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                {stat.label === "Total Disbursed" && stats.totalBudgetAllocated > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {utilizationPercentage.toFixed(1)}% of total budget
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts and Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Utilization Meter */}
        <UtilizationMeter
          allocated={stats.totalBudgetAllocated}
          disbursed={stats.totalDisbursed}
          label="Overall Budget Utilization"
        />

        {/* Ministry Distribution Chart */}
        <Card className="lg:col-span-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Budget Distribution by Ministry
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.ministryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.ministryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => `₦${(value / 1e6).toFixed(2)}M`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="allocated" fill="#3b82f6" opacity={0.6} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="disbursed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No ministry data available
              </div>
            )}
            <div className="flex gap-4 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500 opacity-60"></div>
                <span className="text-xs text-muted-foreground">Allocated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-xs text-muted-foreground">Disbursed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Log */}
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 backdrop-blur-sm shadow-lg">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Budget Transactions
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <TransactionLog />
        </CardContent>
      </Card>
    </div>
  )
}
