"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import type { MooringUnit, Alarm } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/mode-toggle"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowLeft, Wifi, WifiOff, MapPin, Clock, AlertTriangle, Check } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fetchAlarms } from "@/lib/api"

interface UnitHeaderProps {
  unit: MooringUnit
}

export function UnitHeader({ unit }: UnitHeaderProps) {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAlarms = async () => {
      try {
        setLoading(true)
        console.log(`DEBUG: Loading alarms for unit: ${unit.id}`)
        const unitAlarms = await fetchAlarms(unit.id)
        console.log(`DEBUG: Received ${unitAlarms.length} alarms for unit ${unit.id}:`, unitAlarms)
        setAlarms(unitAlarms)
      } catch (error) {
        console.error("Failed to load alarms:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAlarms()
    // Refresh alarms every 30 seconds
    const interval = setInterval(loadAlarms, 30000)
    return () => clearInterval(interval)
  }, [unit.id])

  const getStateBadgeVariant = (state: number) => {
    switch (state) {
      case 6: // Operational
        return "default" as const
      case 9: // Emergency Stop
      case 10: // Fault
        return "destructive" as const
      case 8: // Maintenance
        return "secondary" as const
      case 11: // Offline
        return "outline" as const
      default:
        return "secondary" as const
    }
  }

  const getAlarmIcon = (type: Alarm["type"]) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />
      case "info":
        return <AlertTriangle className="h-3 w-3 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: "diagnostic" | "low" | "medium" | "high" | "critical") => {
    switch (priority) {
      case "critical":
        return "text-red-600"
      case "high":
        return "text-orange-600"
      default:
        return "text-gray-600"
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

  const getStatusBadge = (status: "created" | "acknowledged" | "cleared") => {
    switch (status) {
      case "created":
        return (
          <Badge variant="secondary" className="text-orange-600 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Created
          </Badge>
        )
      case "acknowledged":
        return (
          <Badge variant="outline" className="text-blue-600 text-xs">
            <Check className="h-3 w-3 mr-1" />
            Acknowledged
          </Badge>
        )
      case "cleared":
        return (
          <Badge variant="outline" className="text-green-600 text-xs">
            <Check className="h-3 w-3 mr-1" />
            Cleared
          </Badge>
        )
    }
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>

            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold tracking-tight">{unit.name}</h1>
                <Badge variant={getStateBadgeVariant(unit.currentState)}>{unit.stateDescription}</Badge>
                {unit.isOnline ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {unit.location}
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Updated {formatDistanceToNow(unit.lastUpdated, { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Alarms Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="relative bg-transparent">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Alarms
                  {alarms.length > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {alarms.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Recent Alarms for {unit.name}</h4>
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading alarms...</p>
                  ) : alarms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent alarms</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {alarms.map((alarm) => (
                        <div key={alarm.id} className="flex items-start space-x-2 p-2 border rounded-lg">
                          {getAlarmIcon(alarm.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{alarm.message}</p>
                            <div className="flex items-center justify-between mt-1">
                              <Badge variant={getAlarmBadgeVariant(alarm.type)} className="text-xs">
                                {alarm.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(alarm.timestamp, { addSuffix: true })}
                              </span>
                            </div>
                            <div className="mt-1">
                              {getStatusBadge(alarm.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
