"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import type { MooringUnit, KPIData } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart } from "@/components/charts/bar-chart"
import { LineChart } from "@/components/charts/line-chart"
import { Calendar, TrendingUp } from "lucide-react"

interface FleetAnalyticsProps {
  units: MooringUnit[]
  kpiData: KPIData[]
  selectedRange: string
  onRangeChange: (range: string) => void
}


type TimeRange = "1day" | "7days" | "1month" | "1year"

export function FleetAnalytics({ units, kpiData, selectedRange, onRangeChange }: FleetAnalyticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("1day")

  const timeRangeOptions = [
    { value: "1day" as TimeRange, label: "Last 24 Hours", hours: 24 },
    { value: "7days" as TimeRange, label: "Last 7 Days", hours: 168 },
    { value: "1month" as TimeRange, label: "Last 30 Days", hours: 720 },
    { value: "1year" as TimeRange, label: "Last 12 Months", hours: 8760 },
  ]

  const getTimeRangeData = (timeRange: TimeRange) => {
    const dataPoints =
      timeRange === "1day" ? 24 : timeRange === "7days" ? 7 : timeRange === "1month" ? 30 : 12
    const labelFormat =
      timeRange === "1day"
        ? (i: number) => `${String(i).padStart(2, "0")}:00`
        : timeRange === "7days"
        ? (i: number) => `Day ${i + 1}`
        : timeRange === "1month"
        ? (i: number) => `Day ${i + 1}`
        : (i: number) => `Month ${i + 1}`

    return {
      labels: Array.from({ length: dataPoints }, (_, i) => labelFormat(i)),
      datasets: [
        {
          label: "MM Utilization %",
          data: Array.from({ length: dataPoints }, () => 70 + Math.random() * 25),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "MM Availability %",
          data: Array.from({ length: dataPoints }, () => 85 + Math.random() * 15),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    }
  }

  const kpiChartData = {
    labels: kpiData.map((kpi) => `Unit ${kpi.unitId}`),
    datasets: [
      {
        label: "Utilization %",
        data: kpiData.map((kpi) => kpi.utilization),
        backgroundColor: "#3b82f6",
        borderColor: "#3b82f6",
        borderWidth: 1,
      },
      {
        label: "Availability %",
        data: kpiData.map((kpi) => kpi.availability),
        backgroundColor: "#10b981",
        borderColor: "#10b981",
        borderWidth: 1,
      },
    ],
  }

  const mtbfBarData = {
    labels: kpiData.map((kpi) => `Unit ${kpi.unitId}`),
    datasets: [
      {
        label: "MTBF (Hours)",
        data: kpiData.map((kpi) => kpi.mtbf),
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
        borderColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
        borderWidth: 1,
      },
    ],
  }

  const performanceTrends = getTimeRangeData(selectedTimeRange)

  return (
    <section className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">MM Analysis</h2>
            <p className="text-muted-foreground">
              Comprehensive performance insights across your MM fleet
            </p>
          </div>
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
      </motion.div>

      {/* KPI Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Unit Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={kpiChartData} height={400} />
        </CardContent>
      </Card>

      {/* Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              MM Performance Trends
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {timeRangeOptions.find((opt) => opt.value === selectedTimeRange)?.label}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={performanceTrends} height={400} />
        </CardContent>
      </Card>

      {/* MTBF only */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              MTBF Distribution Across Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={mtbfBarData} height={350} horizontal />
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {Math.round(
                    kpiData.reduce((sum, kpi) => sum + kpi.mtbf, 0) / (kpiData.length || 1)
                  )}
                  h
                </div>
                <div className="text-sm text-muted-foreground">Average MM MTBF</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
