import type { KPIData } from "@/lib/types"
import { KPIStatsCard } from "@/components/ui/kpi-stats-card"
import { Clock, TrendingUp, AlertTriangle, Activity, Wrench, Gauge } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface UnitKPICardsProps {
  kpiData: KPIData
}

export function UnitKPICards({ kpiData }: UnitKPICardsProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPIStatsCard title="MTBF" value={`${kpiData.mtbf}h`} icon={Clock} description="Mean time between failures" />
        <KPIStatsCard
          title="Utilization"
          value={`${kpiData.utilization}%`}
          icon={TrendingUp}
          description="Current utilization rate"
        />
        <KPIStatsCard
          title="Alarm Frequency"
          value={`${kpiData.alarmFrequency}/day`}
          icon={AlertTriangle}
          description="Average alarms per day"
        />
        <KPIStatsCard
          title="Uptime"
          value={`${kpiData.uptime}%`}
          icon={Activity}
          description="System uptime percentage"
        />
        <KPIStatsCard
          title="Efficiency"
          value={`${kpiData.efficiency}%`}
          icon={Gauge}
          description="Operational efficiency"
        />
        <KPIStatsCard
          title="Last Maintenance"
          value={formatDistanceToNow(kpiData.lastMaintenance, { addSuffix: true })}
          icon={Wrench}
          description="Time since last maintenance"
        />
      </div>
    </section>
  )
}
