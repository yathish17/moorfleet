"use client"

import { useState } from "react"
import type { StateHistory, KPIHistory, MooringUnit } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart } from "@/components/charts/line-chart"
import { BarChart } from "@/components/charts/bar-chart"
import { Calendar, TrendingUp, Clock } from "lucide-react"
import { format, subDays, subMonths, subYears } from "date-fns"
import { STATE_COLORS, MOORING_STATES } from "@/lib/types"

interface UnitChartsGridProps {
  stateHistory: StateHistory[]
  kpiHistory: KPIHistory[]
  unit: MooringUnit
}

type TimeRange = "1day" | "7days" | "1month" | "1year"

export function UnitChartsGrid({ stateHistory, kpiHistory, unit }: UnitChartsGridProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("1day")

  const timeRangeOptions = [
    { value: "1day" as TimeRange, label: "Last 24 Hours" },
    { value: "7days" as TimeRange, label: "Last 7 Days" },
    { value: "1month" as TimeRange, label: "Last 30 Days" },
    { value: "1year" as TimeRange, label: "Last 12 Months" },
  ]

  // Filter data based on selected time range
  const getFilteredData = (timeRange: TimeRange) => {
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

  const { filteredStateHistory, filteredKpiHistory } = getFilteredData(selectedTimeRange)

  // KPI Trends Chart Data
  const kpiTrendsData = {
    labels: filteredKpiHistory.map((entry) => {
      const formatString =
        selectedTimeRange === "1day"
          ? "HH:mm"
          : selectedTimeRange === "7days"
            ? "MMM dd"
            : selectedTimeRange === "1month"
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
        label: "Uptime %",
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

  // State Distribution Bar Chart (replacing pie chart)
  const stateDistribution = Object.entries(MOORING_STATES)
    .map(([state, description]) => {
      const totalDuration = filteredStateHistory
        .filter((entry) => entry.state === Number(state))
        .reduce((sum, entry) => sum + entry.duration, 0)

      return {
        state: description,
        stateNumber: Number(state),
        duration: totalDuration,
        color: STATE_COLORS[Number(state) as keyof typeof STATE_COLORS],
      }
    })
    .filter((item) => item.duration > 0)

  const stateDistributionChartData = {
    labels: stateDistribution.map((item) => item.state),
    datasets: [
      {
        label: "Duration (minutes)",
        data: stateDistribution.map((item) => item.duration),
        backgroundColor: stateDistribution.map((item) => item.color),
        borderColor: stateDistribution.map((item) => item.color),
        borderWidth: 1,
      },
    ],
  }

  // Performance Distribution Data
  const currentKPI = filteredKpiHistory[filteredKpiHistory.length - 1] || { utilization: 0, uptime: 0, mtbf: 0 }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="text-center sm:text-left">
          <h2 className="text-3xl font-bold mb-2">Asset Performance Analytics</h2>
          <p className="text-muted-foreground">Detailed insights for {unit.name}</p>
        </div>

        {/* Time Range Dropdown */}
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedTimeRange} onValueChange={(value: TimeRange) => setSelectedTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Trends - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              KPI Performance Trends
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {timeRangeOptions.find((opt) => opt.value === selectedTimeRange)?.label}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={kpiTrendsData} height={400} />
        </CardContent>
      </Card>

      {/* Second Row - State Distribution and Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              State Duration Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={stateDistributionChartData} height={350} horizontal />
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">Most Active State</div>
                <div className="text-2xl font-bold text-purple-500">
                  {stateDistribution.length > 0
                    ? stateDistribution.reduce((prev, current) => (prev.duration > current.duration ? prev : current))
                        .state
                    : "N/A"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">{currentKPI.utilization}%</div>
                  <div className="text-sm text-muted-foreground">Utilization</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-500">{currentKPI.uptime}%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-yellow-500">{currentKPI.mtbf}h</div>
                <div className="text-sm text-muted-foreground">Mean Time Between Failures</div>
              </div>
              <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-sm font-medium text-primary flex items-center justify-center gap-1">
                  <Clock className="h-4 w-4" />
                  {timeRangeOptions.find((opt) => opt.value === selectedTimeRange)?.label}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
