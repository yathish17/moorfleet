"use client"

import { motion } from "framer-motion"
import type { KPIData } from "@/lib/types"
import { GlowingCard } from "@/components/ui/glowing-card"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Clock, AlertTriangle, Activity, Gauge } from "lucide-react"

interface KPIOverviewProps {
  kpiData: KPIData[]
}

export function KPIOverview({ kpiData }: KPIOverviewProps) {
  const avgMTBF = kpiData.reduce((sum, kpi) => sum + kpi.mtbf, 0) / kpiData.length
  const avgUtilization = kpiData.reduce((sum, kpi) => sum + kpi.utilization, 0) / kpiData.length
  const totalAlarms = kpiData.reduce((sum, kpi) => sum + kpi.alarmFrequency, 0)
  const avgUptime = kpiData.reduce((sum, kpi) => sum + kpi.uptime, 0) / kpiData.length
  const avgEfficiency = kpiData.reduce((sum, kpi) => sum + kpi.efficiency, 0) / kpiData.length

  const kpis = [
    {
      title: "Average MTBF",
      value: avgMTBF,
      suffix: "h",
      icon: Clock,
      trend: 5.2,
      description: "Mean time between failures",
      color: "blue",
      progress: Math.min((avgMTBF / 300) * 100, 100),
    },
    {
      title: "MM Utilization",
      value: avgUtilization,
      suffix: "%",
      icon: TrendingUp,
      trend: 2.1,
      description: "Overall asset utilization",
      color: "green",
      progress: avgUtilization,
    },
    {
      title: "Daily Alarms",
      value: totalAlarms,
      suffix: "",
      icon: AlertTriangle,
      trend: -8.3,
      description: "Total alarms across all units",
      color: "red",
      progress: Math.max(100 - (totalAlarms / 50) * 100, 0),
    },
    {
      title: "Average Uptime",
      value: avgUptime,
      suffix: "%",
      icon: Activity,
      trend: 1.8,
      description: "MM uptime percentage",
      color: "purple",
      progress: avgUptime,
    },
    {
      title: "MM Efficiency",
      value: avgEfficiency,
      suffix: "%",
      icon: Gauge,
      trend: 3.4,
      description: "Overall operational efficiency",
      color: "yellow",
      progress: avgEfficiency,
    },
  ]

  return (
    <section className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h2 className="text-3xl font-bold mb-2">Key Performance Indicators</h2>
        <p className="text-muted-foreground">Real-time metrics and performance insights</p>
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
                  <div className={`flex items-center ${kpi.trend > 0 ? "text-green-600" : "text-red-600"}`}>
                    {kpi.trend > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(kpi.trend)}%
                  </div>
                </div>
              </CardContent>
            </GlowingCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
