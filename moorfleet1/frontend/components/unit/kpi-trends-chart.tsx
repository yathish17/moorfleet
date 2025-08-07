"use client"

import type { KPIHistory } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { format } from "date-fns"

interface KPITrendsChartProps {
  kpiHistory: KPIHistory[]
}

export function KPITrendsChart({ kpiHistory }: KPITrendsChartProps) {
  const chartData = kpiHistory.map((entry) => ({
    time: format(entry.timestamp, "HH:mm"),
    utilization: entry.utilization,
    uptime: entry.uptime,
    mtbf: entry.mtbf / 10, // Scale down for better visualization
    alarmFrequency: entry.alarmFrequency * 10, // Scale up for better visualization
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>KPI Trends (24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            utilization: {
              label: "Utilization (%)",
              color: "hsl(var(--chart-1))",
            },
            uptime: {
              label: "Uptime (%)",
              color: "hsl(var(--chart-2))",
            },
            mtbf: {
              label: "MTBF (scaled)",
              color: "hsl(var(--chart-3))",
            },
            alarmFrequency: {
              label: "Alarm Frequency (scaled)",
              color: "hsl(var(--chart-4))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="utilization"
                stroke="var(--color-utilization)"
                strokeWidth={2}
                dot={false}
              />
              <Line type="monotone" dataKey="uptime" stroke="var(--color-uptime)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="mtbf" stroke="var(--color-mtbf)" strokeWidth={2} dot={false} />
              <Line
                type="monotone"
                dataKey="alarmFrequency"
                stroke="var(--color-alarmFrequency)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
