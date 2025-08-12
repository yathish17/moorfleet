"use client"

import type { StateHistory, KPIHistory, MooringUnit } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart } from "@/components/charts/line-chart"
import { Calendar, TrendingUp } from "lucide-react"
import { format, subDays, subMonths, subYears } from "date-fns"
import { STATE_COLORS, MOORING_STATES } from "@/lib/types"

interface UnitChartsGridProps {
  stateHistory: StateHistory[]
  kpiHistory: KPIHistory[]
  unit: MooringUnit
  selectedRange: "1day" | "7days" | "1month" | "1year"
}

export function UnitChartsGrid({ stateHistory, kpiHistory, unit, selectedRange }: UnitChartsGridProps) {
  const timeRangeOptions = {
    "1day": "Last 24 Hours",
    "7days": "Last 7 Days",
    "1month": "Last 30 Days",
    "1year": "Last 12 Months",
  }

  // Filter data based on selected time range
  const getFilteredData = (timeRange: UnitChartsGridProps["selectedRange"]) => {
    const now = new Date()
    let cutoffDate: Date

    switch (timeRange) {
      case "1day":
        cutoffDate = subDays(now, 1)
        break
      case "7days":
        cutoffDate = subDays(now, 7)
        break
      case "1month":
        cutoffDate = subMonths(now, 1)
        break
      case "1year":
        cutoffDate = subYears(now, 1)
        break
    }

    const filteredStateHistory = stateHistory.filter((entry) => entry.timestamp >= cutoffDate)
    const filteredKpiHistory = kpiHistory.filter((entry) => entry.timestamp >= cutoffDate)

    return { filteredStateHistory, filteredKpiHistory }
  }

  const { filteredStateHistory, filteredKpiHistory } = getFilteredData(selectedRange)

  // KPI Trends Chart Data
  const kpiTrendsData = {
    labels: filteredKpiHistory.map((entry) => {
      const formatString =
        selectedRange === "1day"
          ? "HH:mm"
          : selectedRange === "7days"
          ? "MMM dd"
          : selectedRange === "1month"
          ? "MMM dd"
          : "MMM yyyy"
      return format(entry.timestamp, formatString)
    }),
    datasets: [
      {
        label: "Utilization %",
        data: filteredKpiHistory.map((entry) => entry.utilization),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Availability %",
        data: filteredKpiHistory.map((entry) => entry.uptime),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "MTBF (hours)",
        data: filteredKpiHistory.map((entry) => entry.mtbf),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  // State Distribution Data
  const stateDistribution = Object.entries(MOORING_STATES)
    .map(([state, description]) => {
      const totalDuration = filteredStateHistory
        .filter((entry) => entry.state === Number(state))
        .reduce((sum, entry) => sum + entry.duration, 0)

      return {
        state: description,
        duration: totalDuration,
        color: STATE_COLORS[Number(state) as keyof typeof STATE_COLORS],
      }
    })
    .filter((item) => item.duration > 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="text-center sm:text-left">
          <h2 className="text-3xl font-bold mb-2">Asset Performance Analytics</h2>
          <p className="text-muted-foreground">Detailed insights for {unit.name}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-5 w-5" />
          {timeRangeOptions[selectedRange]}
        </div>
      </div>

      {/* KPI Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              KPI Performance Trends
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {timeRangeOptions[selectedRange]}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={kpiTrendsData} height={400} />
        </CardContent>
      </Card>
    </div>
  )
}
