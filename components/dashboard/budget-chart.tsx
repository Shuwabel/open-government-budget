"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface BudgetChartProps {
  data: Array<{
    name: string
    allocated: number
    disbursed: number
    color: string
  }>
}

export function BudgetChart({ data }: BudgetChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data.length) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 40
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Find max value for scaling
    const maxValue = Math.max(...data.map(d => Math.max(d.allocated, d.disbursed)))

    // Draw bars
    const barWidth = chartWidth / data.length / 2 - 10
    data.forEach((item, index) => {
      const x = padding + (index * chartWidth / data.length) + 5
      const allocatedHeight = (item.allocated / maxValue) * chartHeight
      const disbursedHeight = (item.disbursed / maxValue) * chartHeight

      // Allocated bar (lighter)
      ctx.fillStyle = item.color + '40'
      ctx.fillRect(x, height - padding - allocatedHeight, barWidth, allocatedHeight)

      // Disbursed bar (darker)
      ctx.fillStyle = item.color
      ctx.fillRect(x + barWidth + 5, height - padding - disbursedHeight, barWidth, disbursedHeight)
    })

    // Draw labels
    ctx.fillStyle = '#666'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    data.forEach((item, index) => {
      const x = padding + (index * chartWidth / data.length) + chartWidth / data.length / 2
      ctx.fillText(item.name.substring(0, 8), x, height - 10)
    })
  }, [data])

  if (!data.length) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Budget Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Budget Distribution by Ministry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} width={600} height={300} className="w-full h-auto" />
        <div className="flex gap-4 mt-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/40"></div>
            <span className="text-sm text-muted-foreground">Allocated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary"></div>
            <span className="text-sm text-muted-foreground">Disbursed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

