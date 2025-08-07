import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface KPIStatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: number
  description?: string
}

export function KPIStatsCard({ title, value, icon: Icon, trend, description }: KPIStatsCardProps) {
  const isPositiveTrend = trend && trend > 0
  const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown
  const trendColor = isPositiveTrend ? "text-green-600" : "text-red-600"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className={`flex items-center text-xs ${trendColor}`}>
            <TrendIcon className="h-3 w-3 mr-1" />
            {Math.abs(trend)}% from last period
          </div>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}
