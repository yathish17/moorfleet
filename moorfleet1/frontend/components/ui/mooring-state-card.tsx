"use client"

import { motion } from "framer-motion"
import type { MooringUnit } from "@/lib/types"
import { GlowingCard } from "@/components/ui/glowing-card"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, MapPin, Clock, Zap } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { STATE_COLORS } from "@/lib/types"

interface MooringStateCardProps {
  unit: MooringUnit
}

export function MooringStateCard({ unit }: MooringStateCardProps) {
  const getStateInfo = (state: number) => {
    const color = STATE_COLORS[state as keyof typeof STATE_COLORS] || "#6b7280"

    // Determine glow color based on state
    let glowColor = "blue"

    switch (state) {
      case 6: // Moored
      case 11: // Parked
        glowColor = "green"
        break
      case 7: // Detaching
      case 8: // Stepping
      case 9: // Warping
        glowColor = "red"
        break
      case 3: // Arming
      case 4: // Ready to Moor
      case 5: // Mooring
      case 10: // Parking
        glowColor = "yellow"
        break
      case 1: // Initialise
      case 2: // Idle
        glowColor = "blue"
        break
      default:
        glowColor = "blue"
    }

    return { color, glowColor }
  }

  const getStateBadgeVariant = (state: number) => {
    switch (state) {
      case 6: // Moored
      case 11: // Parked
        return "default" as const
      case 7: // Detaching
      case 8: // Stepping
      case 9: // Warping
        return "destructive" as const
      case 3: // Arming
      case 4: // Ready to Moor
      case 5: // Mooring
      case 10: // Parking
        return "secondary" as const
      case 1: // Initialise
      case 2: // Idle
        return "outline" as const
      default:
        return "secondary" as const
    }
  }

  const stateInfo = getStateInfo(unit.currentState)

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
      <GlowingCard glowColor={stateInfo.glowColor} className="cursor-pointer overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">{unit.name}</CardTitle>
            <motion.div animate={{ rotate: unit.isOnline ? 0 : 180 }} transition={{ duration: 0.3 }}>
              {unit.isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
            </motion.div>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1" />
            {unit.location}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current State</span>
            <Badge variant={getStateBadgeVariant(unit.currentState)}>{unit.stateDescription}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stateInfo.color }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              />
              <span className="text-sm text-muted-foreground">State {unit.currentState}</span>
            </div>
            <Zap className="h-4 w-4 text-yellow-500" />
          </div>

          <div className="flex items-center text-xs text-muted-foreground pt-2 border-t">
            <Clock className="h-3 w-3 mr-1" />
            Updated {formatDistanceToNow(unit.lastUpdated, { addSuffix: true })}
          </div>
        </CardContent>
      </GlowingCard>
    </motion.div>
  )
}
