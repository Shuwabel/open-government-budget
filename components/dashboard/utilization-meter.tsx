"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, AlertCircle } from "lucide-react"

interface UtilizationMeterProps {
  allocated: number
  disbursed: number
  label: string
  color?: string
}

export function UtilizationMeter({ allocated, disbursed, label, color = "primary" }: UtilizationMeterProps) {
  const percentage = allocated > 0 ? Math.min((disbursed / allocated) * 100, 100) : 0
  const isOverBudget = disbursed > allocated

  const colorClasses = {
    primary: "from-blue-500 to-blue-600",
    success: "from-green-500 to-green-600",
    warning: "from-yellow-500 to-yellow-600",
    danger: "from-red-500 to-red-600"
  }

  const meterColor = isOverBudget ? colorClasses.danger : 
                     percentage > 80 ? colorClasses.warning : 
                     colorClasses.success

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 backdrop-blur-sm hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Circular Progress */}
          <div className="relative w-32 h-32 mx-auto">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/20"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
                strokeLinecap="round"
                className={`text-transparent bg-gradient-to-r ${meterColor} bg-clip-text`}
                style={{
                  stroke: `url(#gradient-${color})`
                }}
              />
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isOverBudget ? "#ef4444" : percentage > 80 ? "#eab308" : "#22c55e"} />
                  <stop offset="100%" stopColor={isOverBudget ? "#dc2626" : percentage > 80 ? "#ca8a04" : "#16a34a"} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-2xl font-bold bg-gradient-to-r ${meterColor} bg-clip-text text-transparent`}>
                  {percentage.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">used</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Allocated</span>
              <span className="font-semibold">₦{(allocated / 1e6).toFixed(2)}M</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Disbursed</span>
              <span className={`font-semibold ${isOverBudget ? 'text-red-500' : ''}`}>
                ₦{(disbursed / 1e6).toFixed(2)}M
              </span>
            </div>
            {isOverBudget && (
              <div className="flex items-center gap-1 text-xs text-red-500 mt-2">
                <AlertCircle className="w-3 h-3" />
                <span>Over budget</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

