"use client"

import { motion } from "framer-motion"
import type { KPIData } from "@/lib/types"
import { GlowingCard } from "@/components/ui/glowing-card"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, Activity, TrendingUp } from "lucide-react"

interface KPIOverviewProps {
  kpiData: KPIData[]
  selectedRange: string
  onRangeChange: (range: string) => void
}

export function KPIOverview({ kpiData, selectedRange, onRangeChange }: KPIOverviewProps) {
  // Calculate averages
  const avgMTBF = kpiData.length > 0 ? kpiData.reduce((sum, kpi) => sum + kpi.mtbf, 0) / kpiData.length : 168
  const avgUtilization = kpiData.length > 0 ? kpiData.reduce((sum, kpi) => sum + kpi.utilization, 0) / kpiData.length : 75
  const avgAvailability = kpiData.length > 0 ? kpiData.reduce((sum, kpi) => sum + kpi.availability, 0) / kpiData.length : 95

  const kpis = [
    {
      title: "Average MTBF",
      value: avgMTBF,
      suffix: "h",
      icon: Clock,
      description: "Mean time between failures",
      color: "blue",
      progress: Math.min((avgMTBF / 300) * 100, 100),
    },
    {
      title: "MM Utilization",
      value: avgUtilization,
      suffix: "%",
      icon: TrendingUp,
      description: "Overall asset utilization",
      color: "green",
      progress: avgUtilization,
    },
    {
      title: "Average Availability",
      value: avgAvailability,
      suffix: "%",
      icon: Activity,
      description: "MM availability percentage",
      color: "purple",
      progress: avgAvailability,
    },
  ]

  return (
    <section className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h2 className="text-3xl font-bold mb-2">Performance Metrics</h2>
        <p className="text-muted-foreground">Monthly metrics and performance insights</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <GlowingCard glowColor={kpi.color}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                  <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                </div>

                <Progress value={kpi.progress} className="h-2" />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{kpi.description}</span>
                </div>
              </CardContent>
            </GlowingCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
