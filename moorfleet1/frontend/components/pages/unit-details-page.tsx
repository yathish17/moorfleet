"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import type { MooringUnit, KPIData, Alarm, StateHistory, KPIHistory } from "@/lib/types"
import { fetchMooringUnit, fetchKPIData, fetchAlarms, fetchStateHistory, fetchKPIHistory } from "@/lib/api"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { UnitHeader } from "@/components/unit/unit-header"
import { UnitKPICards } from "@/components/unit/unit-kpi-cards"
import { UnitChartsGrid } from "@/components/unit/unit-charts-grid"
import { AlarmTable } from "@/components/unit/alarm-table"
import { UnitMetadata } from "@/components/unit/unit-metadata"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/hooks/use-toast"

interface UnitDetailsPageProps {
  unitId: string
}

export function UnitDetailsPage({ unitId }: UnitDetailsPageProps) {
  const [unit, setUnit] = useState<MooringUnit | null>(null)
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [stateHistory, setStateHistory] = useState<StateHistory[]>([])
  const [kpiHistory, setKpiHistory] = useState<KPIHistory[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const [unitData, kpiResponse, alarmsData, stateHistoryData, kpiHistoryData] = await Promise.all([
        fetchMooringUnit(unitId),
        fetchKPIData(unitId),
        fetchAlarms(unitId),
        fetchStateHistory(unitId),
        fetchKPIHistory(unitId),
      ])

      if (!unitData) {
        router.push("/not-found")
        return
      }

      setUnit(unitData)
      setKpiData(kpiResponse[0])
      setAlarms(alarmsData)
      setStateHistory(stateHistoryData)
      setKpiHistory(kpiHistoryData)
      setLoading(false)
    } catch (error) {
      console.error("Failed to load unit data:", error)
      toast({
        title: "Error",
        description: "Failed to load unit data. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [unitId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!unit || !kpiData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AnimatedBackground />
      <UnitHeader unit={unit} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <UnitMetadata unit={unit} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <UnitKPICards kpiData={kpiData} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <UnitChartsGrid stateHistory={stateHistory} kpiHistory={kpiHistory} unit={unit} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <AlarmTable alarms={alarms} />
        </motion.div>
      </main>
    </div>
  )
}
