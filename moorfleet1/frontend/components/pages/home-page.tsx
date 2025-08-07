"use client"

import { useState, useEffect } from "react"
import type { MooringUnit, KPIData, Alarm } from "@/lib/types"
import { fetchMooringUnits, fetchKPIData, fetchAlarms } from "@/lib/api"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { HeroSection } from "@/components/dashboard/hero-section"
import { MooringUnitsGrid } from "@/components/dashboard/mooring-units-grid"
import { KPIOverview } from "@/components/dashboard/kpi-overview"
import { FleetAnalytics } from "@/components/dashboard/fleet-analytics"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/hooks/use-toast"

export function HomePage() {
  const [units, setUnits] = useState<MooringUnit[]>([])
  const [kpiData, setKpiData] = useState<KPIData[]>([])
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const [unitsData, kpiResponse, alarmsData] = await Promise.all([
        fetchMooringUnits(),
        fetchKPIData(),
        fetchAlarms(),
      ])

      setUnits(unitsData)
      setKpiData(kpiResponse)
      setAlarms(alarmsData.slice(0, 10))
      setLoading(false)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AnimatedBackground />
      <DashboardHeader alarms={alarms} />
      <HeroSection units={units} kpiData={kpiData} />

      <main className="container mx-auto px-4 py-8 space-y-8 pt-20">
        {" "}
        {/* Added pt-20 here */}
        {/* Mooring Units Status - First */}
        <MooringUnitsGrid units={units} />
        {/* Key Performance Indicators - Second */}
        <KPIOverview kpiData={kpiData} />
        {/* MoorMaster Analysis - Third */}
        <FleetAnalytics units={units} kpiData={kpiData} />
      </main>
    </div>
  )
}
