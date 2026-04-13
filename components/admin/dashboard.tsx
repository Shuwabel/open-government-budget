"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { CheckCircle2, XCircle, Clock, Shield } from "lucide-react"
import Link from "next/link"

const statsData = [
  { label: "Issued", value: "1,247", icon: CheckCircle2, color: "text-accent" },
  { label: "Revoked", value: "12", icon: XCircle, color: "text-destructive" },
  { label: "Pending", value: "34", icon: Clock, color: "text-primary" },
  { label: "Verified", value: "8,932", icon: Shield, color: "text-secondary" },
]

const chartData = [
  { month: "Jan", issued: 120, verified: 240 },
  { month: "Feb", issued: 150, verified: 320 },
  { month: "Mar", issued: 180, verified: 450 },
  { month: "Apr", issued: 200, verified: 580 },
  { month: "May", issued: 220, verified: 720 },
  { month: "Jun", issued: 250, verified: 890 },
]

const recentTransactions = [
  { id: "0x1a2b...", student: "John Smith", action: "Issued", date: "2 hours ago", status: "confirmed" },
  { id: "0x3c4d...", student: "Jane Doe", action: "Verified", date: "4 hours ago", status: "confirmed" },
  { id: "0x5e6f...", student: "Bob Johnson", action: "Issued", date: "1 day ago", status: "confirmed" },
]

export function AdminDashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back to your credential management system</p>
        </div>
        <Link href="/admin/issue">
          <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20">
            Issue New Credential
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.label}
              className="gradient-card border-primary/20 hover:border-primary/40 transition-all duration-200 glow-hover"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="gradient-card border-primary/20">
          <CardHeader>
            <CardTitle>Credentials Issued vs Verified</CardTitle>
            <CardDescription>Monthly trend over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="issued" stroke="var(--color-primary)" strokeWidth={2} />
                <Line type="monotone" dataKey="verified" stroke="var(--color-accent)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="gradient-card border-primary/20">
          <CardHeader>
            <CardTitle>Issuance Distribution</CardTitle>
            <CardDescription>Credentials by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { dept: "Engineering", count: 450 },
                  { dept: "Business", count: 380 },
                  { dept: "Arts", count: 290 },
                  { dept: "Science", count: 320 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="gradient-card border-primary/20">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest blockchain transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{tx.student}</p>
                  <p className="text-sm text-muted-foreground">{tx.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{tx.action}</p>
                  <p className="text-sm text-muted-foreground">{tx.date}</p>
                </div>
                <div className="ml-4">
                  <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
