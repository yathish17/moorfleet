"use client"

import { useState } from "react"
import type { Alarm } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, AlertCircle, Info, Check, Clock, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { acknowledgeAlarm, clearAlarm } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface AlarmTableProps {
  alarms: Alarm[]
}

export function AlarmTable({ alarms: initialAlarms }: AlarmTableProps) {
  const [alarms, setAlarms] = useState(initialAlarms)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const handleAcknowledge = async (alarmId: string) => {
    setLoadingStates((prev) => ({ ...prev, [alarmId]: true }))

    try {
      const success = await acknowledgeAlarm(alarmId)
      if (success) {
        setAlarms((prev) =>
          prev.map((alarm) =>
            alarm.id === alarmId ? { ...alarm, status: "acknowledged", acknowledged: true } : alarm,
          ),
        )
        toast({
          title: "Alarm Acknowledged",
          description: "The alarm has been successfully acknowledged.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to acknowledge alarm. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingStates((prev) => ({ ...prev, [alarmId]: false }))
    }
  }

  const handleClear = async (alarmId: string) => {
    setLoadingStates((prev) => ({ ...prev, [alarmId]: true }))

    try {
      const success = await clearAlarm(alarmId)
      if (success) {
        setAlarms((prev) => prev.map((alarm) => (alarm.id === alarmId ? { ...alarm, status: "cleared" } : alarm)))
        toast({
          title: "Alarm Cleared",
          description: "The alarm has been successfully cleared.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear alarm. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingStates((prev) => ({ ...prev, [alarmId]: false }))
    }
  }

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
        return "text-red-600 bg-red-50 border-red-200"
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "diagnostic":
        return "text-gray-600 bg-gray-50 border-gray-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getPriorityIcon = (priority: "diagnostic" | "low" | "medium" | "high" | "critical") => {
    switch (priority) {
      case "critical":
        return <AlertTriangle className="h-3 w-3" />
      case "high":
        return <AlertCircle className="h-3 w-3" />
      case "medium":
        return <Info className="h-3 w-3" />
      case "low":
        return <Info className="h-3 w-3" />
      case "diagnostic":
        return <Info className="h-3 w-3" />
      default:
        return <Info className="h-3 w-3" />
    }
  }

  const getStatusBadge = (status: "created" | "acknowledged" | "cleared", alarm: Alarm) => {
    const baseClasses = "cursor-pointer transition-colors"

    switch (status) {
      case "created":
        return (
          <Badge
            variant="secondary"
            className={`text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100 ${baseClasses}`}
            onClick={() => handleAcknowledge(alarm.id)}
            title="Click to acknowledge"
          >
            {loadingStates[alarm.id] ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-orange-600 mr-1" />
            ) : (
              <Clock className="h-3 w-3 mr-1" />
            )}
            Created
          </Badge>
        )
      case "acknowledged":
        return (
          <Badge
            variant="outline"
            className={`text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 ${baseClasses}`}
            onClick={() => handleClear(alarm.id)}
            title="Click to clear"
          >
            {loadingStates[alarm.id] ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 mr-1" />
            ) : (
              <Check className="h-3 w-3 mr-1" />
            )}
            Acknowledged
          </Badge>
        )
      case "cleared":
        return (
          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Cleared
          </Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alarm History</CardTitle>
      </CardHeader>
      <CardContent>
        {alarms.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No alarms recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alarms.map((alarm) => (
                  <TableRow key={alarm.id}>
                    <TableCell>
                      <span className="font-medium">Unit MM{alarm.unitId}</span>
                    </TableCell>
                    <TableCell className="font-medium">{alarm.message}</TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(alarm.priority)}`}
                      >
                        {getPriorityIcon(alarm.priority)}
                        <span className="capitalize">{alarm.priority}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(alarm.timestamp, "MMM dd, HH:mm:ss")}
                    </TableCell>
                    <TableCell>{getStatusBadge(alarm.status, alarm)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
