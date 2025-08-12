export interface MooringUnit {
  id: string
  name: string
  location: string
  currentState: number
  stateDescription: string
  lastUpdated: Date
  isOnline: boolean
  // New metadata fields
  serialNumber: string
  assetType: string
  installationYear: number
  slaActive: boolean
  commissionedYear: number
  dataConsent: boolean
  warrantyStatus: string
  siteName: string
  endUser: string
  country: string
}

export interface KPIData {
  unitId: string
  mtbf: number
  availability: number
  utilization: number
  range: string
}

export interface Alarm {
  id: string
  unitId: string
  type: "critical" | "warning" | "info"
  message: string
  timestamp: Date
  acknowledged: boolean
  status: "created" | "acknowledged" | "cleared"
  priority: "diagnostic" | "low" | "medium" | "high" | "critical"
}

export interface StateHistory {
  timestamp: Date
  state: number
  duration: number // minutes in this state
}

export interface KPIHistory {
  timestamp: Date
  mtbf: number
  utilization: number
  alarmFrequency: number
  uptime: number
}

// Updated with actual mooring states from MySQL database
export const MOORING_STATES = {
  1: "Initialise",
  2: "Idle",
  3: "Arming",
  4: "Ready to Moor",
  5: "Mooring",
  6: "Moored",
  7: "Detaching",
  8: "Stepping",
  9: "Warping",
  10: "Parking",
  11: "Parked",
} as const

export const STATE_COLORS = {
  1: "#6b7280", // Initialise - gray
  2: "#3b82f6", // Idle - blue
  3: "#f59e0b", // Arming - amber
  4: "#10b981", // Ready to Moor - emerald
  5: "#8b5cf6", // Mooring - violet
  6: "#22c55e", // Moored - green
  7: "#ef4444", // Detaching - red
  8: "#f97316", // Stepping - orange
  9: "#ec4899", // Warping - pink
  10: "#06b6d4", // Parking - cyan
  11: "#84cc16", // Parked - lime
} as const
