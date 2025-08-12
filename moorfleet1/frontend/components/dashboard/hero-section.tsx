"use client"

import { motion } from "framer-motion"
import type { MooringUnit, KPIData } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { Activity, Shield, TrendingUp, Anchor } from "lucide-react"

interface HeroSectionProps {
  units: MooringUnit[]
  kpiData: KPIData[]
}

export function HeroSection({ units, kpiData }: HeroSectionProps) {
  const onlineUnits = units.filter((unit) => unit.isOnline).length
  const mooredUnits = units.filter((unit) => unit.currentState === 6).length // Moored state
  const avgUtilization = kpiData.reduce((sum, kpi) => sum + kpi.utilization, 0) / kpiData.length
  const avgUptime = kpiData.reduce((sum, kpi) => sum + kpi.availability, 0) / kpiData.length

  const stats = [
    {
      icon: Activity,
      label: "Online Units",
      value: onlineUnits,
      total: units.length,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Anchor,
      label: "Moored",
      value: mooredUnits,
      total: units.length,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: TrendingUp,
      label: "Avg Utilization",
      value: avgUtilization,
      suffix: "%",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Shield,
      label: "MM Uptime",
      value: avgUptime,
      suffix: "%",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ]

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6 pb-2">
            MoorFleet Insights
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time monitoring and analytics for your MM Ports and Maritimes units
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="backdrop-blur-sm bg-card/80 border-border/50 hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className={`inline-flex p-3 rounded-full ${stat.bgColor} mb-4`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <div className="text-3xl font-bold">
                      <AnimatedCounter
                        value={stat.value}
                        suffix={stat.suffix || (stat.total ? `/${stat.total}` : "")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
