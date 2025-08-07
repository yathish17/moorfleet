import type { Alarm } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, AlertCircle, Info, Clock, Check, CheckCircle2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface RecentAlarmsProps {
  alarms: Alarm[]
}

export function RecentAlarms({ alarms }: RecentAlarmsProps) {
  const getAlarmIcon = (type: Alarm["type"]) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getAlarmBadgeVariant = (type: Alarm["type"]) => {
    switch (type) {
      case "critical":
        return "destructive" as const
      case "warning":
        return "secondary" as const
      case "info":
        return "outline" as const
    }
  }

  const getPriorityColor = (priority: "diagnostic" | "low" | "medium" | "high" | "critical") => {
    switch (priority) {
      case "critical":
        return "text-red-600"
      case "high":
        return "text-orange-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-blue-600"
      case "diagnostic":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  const getPriorityBadgeVariant = (priority: "diagnostic" | "low" | "medium" | "high" | "critical") => {
    switch (priority) {
      case "critical":
        return "destructive" as const
      case "high":
        return "secondary" as const
      case "medium":
        return "outline" as const
      case "low":
        return "outline" as const
      case "diagnostic":
        return "outline" as const
      default:
        return "outline" as const
    }
  }

  const getStatusBadge = (status: "created" | "acknowledged" | "cleared") => {
    switch (status) {
      case "created":
        return (
          <Badge variant="secondary" className="text-orange-600">
            <Clock className="h-3 w-3 mr-1" />
            Created
          </Badge>
        )
      case "acknowledged":
        return (
          <Badge variant="outline" className="text-blue-600">
            <Check className="h-3 w-3 mr-1" />
            Acknowledged
          </Badge>
        )
      case "cleared":
        return (
          <Badge variant="outline" className="text-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Cleared
          </Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alarms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alarms.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No recent alarms</p>
          ) : (
            alarms.map((alarm) => (
              <div key={alarm.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getAlarmIcon(alarm.type)}
                  <div>
                    <p className="font-medium">{alarm.message}</p>
                    <p className="text-sm text-muted-foreground">
                      Unit {alarm.unitId} • {formatDistanceToNow(alarm.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getAlarmBadgeVariant(alarm.type)}>{alarm.type}</Badge>
                  <Badge variant={getPriorityBadgeVariant(alarm.priority)} className={getPriorityColor(alarm.priority)}>
                    {alarm.priority}
                  </Badge>
                  {getStatusBadge(alarm.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
