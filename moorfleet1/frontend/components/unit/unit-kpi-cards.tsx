"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, TrendingUp, Activity } from "lucide-react"
import type { KPIData } from "@/lib/types"

interface UnitKPICardsProps {
  kpiData: KPIData | null
  selectedRange: string
  onRangeChange: (range: string) => void
}

export function UnitKPICards({ kpiData }: UnitKPICardsProps) {
  if (!kpiData) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Performance Metrics</h2>
          <p className="text-muted-foreground">Loading KPI data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Performance Metrics</h2>
        <p className="text-muted-foreground">
          {kpiData.range ? `Range: ${kpiData.range}` : "Real-time performance indicators for this unit"}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>MTBF</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{kpiData.mtbf}h</div>
            <p className="text-sm text-muted-foreground">Mean Time Between Failures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <span>Availability</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{kpiData.availability}%</div>
            <p className="text-sm text-muted-foreground">System availability percentage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Utilization</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{kpiData.utilization}%</div>
            <p className="text-sm text-muted-foreground">Current utilization rate</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
