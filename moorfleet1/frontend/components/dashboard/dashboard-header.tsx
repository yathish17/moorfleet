"use client"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertTriangle, AlertCircle, Info, Clock, Check, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Alarm } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

interface DashboardHeaderProps {
  alarms: Alarm[]
}

export function DashboardHeader({ alarms }: DashboardHeaderProps) {
  const criticalAlarms = alarms.filter(
    (alarm) => (alarm.priority === "high" || alarm.priority === "critical") && alarm.status !== "cleared",
  )

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
    <header className="fixed top-0 w-full z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">MoorFleet Insights</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {" "}
            {/* Changed space-x-2 to space-x-4 */}
            {/* Alarms Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="relative bg-transparent">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Alarms
                  {criticalAlarms.length > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {criticalAlarms.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Recent Alarms</h4>
                    {criticalAlarms.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {criticalAlarms.length} Critical
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {alarms.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent alarms</p>
                      </div>
                    ) : (
                      alarms.map((alarm) => (
                        <div key={alarm.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getAlarmIcon(alarm.type)}
                              <Badge variant={getAlarmBadgeVariant(alarm.type)} className="text-xs">
                                {alarm.type}
                              </Badge>
                            </div>
                            <Badge
                              variant={getPriorityBadgeVariant(alarm.priority)}
                              className={`text-xs ${getPriorityColor(alarm.priority)}`}
                            >
                              {alarm.priority}
                            </Badge>
                          </div>

                          <p className="font-medium text-sm mb-2 leading-tight">{alarm.message}</p>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Unit {alarm.unitId}</span>
                            <span>{formatDistanceToNow(alarm.timestamp, { addSuffix: true })}</span>
                          </div>

                          <div className="mt-2">{getStatusBadge(alarm.status)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
