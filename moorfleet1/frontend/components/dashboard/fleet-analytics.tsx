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
        
      {/* KPI Comparison */}
      

      {/* Trends */}
      

      {/* MTBF only */}
      
    </section>
  )
}
