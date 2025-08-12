"use client"

import { useState, useEffect } from "react"
import type { MooringUnit, KPIData, Alarm } from "@/lib/types"
import { fetchMooringUnits, fetchKPIData, fetchAlarms } from "@/lib/api"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
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
  const [selectedRange, setSelectedRange] = useState("30d") // added
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const [unitsData, kpiResponse, alarmsData] = await Promise.all([
        fetchMooringUnits(),
        fetchKPIData(undefined, selectedRange), // pass selected range
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
  }, [selectedRange]) // reload when range changes

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

      <main className="container mx-auto px-4 py-8 space-y-8 pt-20">
        <div className="text-center space-y-4 pt-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            MoorFleet Insights
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time monitoring and analytics for your MM Ports and Maritimes units
          </p>
        </div>

        <MooringUnitsGrid units={units} />
        <KPIOverview 
          kpiData={kpiData} 
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
        />
        <FleetAnalytics 
          units={units} 
          kpiData={kpiData} 
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
        />
      </main>
    </div>
  )
}
