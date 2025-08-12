"use client"

import { motion } from "framer-motion"
import type { MooringUnit, KPIData } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { MOORING_STATES, STATE_COLORS } from "@/lib/types"

interface SimpleChartsProps {
  units: MooringUnit[]
  kpiData: KPIData[]
}

export function SimpleCharts({ units, kpiData }: SimpleChartsProps) {
  // Simple state distribution
  const stateData = Object.entries(MOORING_STATES)
    .map(([state, description]) => {
      const count = units.filter((unit) => unit.currentState === Number(state)).length
      return {
        state: description,
        count,
        color: STATE_COLORS[Number(state) as keyof typeof STATE_COLORS],
      }
    })
    .filter((item) => item.count > 0)

  // Simple KPI data
  const kpiChartData = kpiData.map((kpi, index) => ({
    unit: `Unit ${index + 1}`,
    utilization: kpi.utilization,
    uptime: kpi.availability,
    mtbf: kpi.mtbf,
  }))

  // Simple performance trend
  const trendData = Array.from({ length: 12 }, (_, i) => ({
    hour: `${i * 2}:00`,
    performance: 70 + Math.random() * 30,
  }))

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold mb-6">MM Analytics</h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* State Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>State Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stateData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ state, count }) => `${state}: ${count}`}
                  >
                    {stateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* KPI Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>KPI Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpiChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="unit" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="utilization" fill="#3b82f6" />
                  <Bar dataKey="uptime" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="performance" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
