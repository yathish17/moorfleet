"use client"

import { type StateHistory, MOORING_STATES } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts"
import { format } from "date-fns"

interface StateChartProps {
  stateHistory: StateHistory[]
}

export function StateChart({ stateHistory }: StateChartProps) {
  const chartData = stateHistory.map((entry) => ({
    time: format(entry.timestamp, "HH:mm"),
    state: entry.state,
    stateName: MOORING_STATES[entry.state as keyof typeof MOORING_STATES],
    duration: entry.duration,
  }))

  const getStateColor = (state: number) => {
    switch (state) {
      case 6:
        return "#22c55e" // Operational - green
      case 9:
      case 10:
        return "#ef4444" // Emergency/Fault - red
      case 8:
        return "#eab308" // Maintenance - yellow
      case 11:
        return "#6b7280" // Offline - gray
      default:
        return "#3b82f6" // Default - blue
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>State History (24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            duration: {
              label: "Duration (minutes)",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value, name, props) => [
                  `${value} minutes`,
                  `${props.payload.stateName} (State ${props.payload.state})`,
                ]}
              />
<Bar dataKey="duration" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStateColor(entry.state)} />
                  ))}
                </Bar>            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
