import { type MooringUnit, type KPIData, type Alarm, type StateHistory, type KPIHistory, MOORING_STATES } from "./types"

// Mock MySQL database connection - replace with actual database queries
const generateMockUnit = (id: string): MooringUnit => {
  const states = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const currentState = states[Math.floor(Math.random() * states.length)]

  return {
    id,
    name: `Unit ${id}`,
    location: "Global Terminal 1", // Changed location
    currentState,
    stateDescription: MOORING_STATES[currentState as keyof typeof MOORING_STATES],
    lastUpdated: new Date(Date.now() - Math.random() * 300000),
    isOnline: Math.random() > 0.1,
    // Mock metadata
    serialNumber: `SN-${Math.floor(10000 + Math.random() * 90000)}`,
    assetType: "MM" + (Math.random() > 0.5 ? "100" : "200"),
    installationYear: 2018 + Math.floor(Math.random() * 5), // 2018-2022
    slaActive: Math.random() > 0.3,
    commissionedYear: 2019 + Math.floor(Math.random() * 5), // 2019-2023
    dataConsent: true,
    warrantyStatus: Math.random() > 0.5 ? "Active" : "Expired",
    siteName: "Global Terminal 1", // Changed siteName
    endUser: "Maritime Solutions Inc.", // Changed endUser
    country: "Global Region", // Changed country
  }
}

const generateMockKPI = (unitId: string): KPIData => ({
  unitId,
  mtbf: Math.floor(Math.random() * 200) + 50,
  utilization: Math.floor(Math.random() * 40) + 60,
  alarmFrequency: Math.floor(Math.random() * 10) + 1,
  uptime: Math.floor(Math.random() * 20) + 80,
  efficiency: Math.floor(Math.random() * 30) + 70,
  lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
})

const generateMockAlarms = (unitId: string, count = 5): Alarm[] => {
  const alarmTypes: Array<"critical" | "warning" | "info"> = ["critical", "warning", "info"]
  const priorities: Array<"diagnostic" | "low" | "medium" | "high" | "critical"> = [
    "diagnostic",
    "low",
    "medium",
    "high",
    "critical",
  ]
  const statuses: Array<"created" | "acknowledged" | "cleared"> = ["created", "acknowledged", "cleared"]
  const messages = [
    "Mooring tension exceeded threshold",
    "Connection sequence timeout",
    "Hydraulic pressure low during mooring",
    "Position drift detected while moored",
    "Scheduled maintenance due",
    "Communication error with control system",
    "Temperature warning in hydraulic system",
    "Vibration anomaly during stepping",
    "Warping operation delayed",
    "Parking position not achieved",
    "Detaching sequence interrupted",
  ]

  return Array.from({ length: count }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    return {
      id: `${unitId}-alarm-${i}`,
      unitId,
      type: alarmTypes[Math.floor(Math.random() * alarmTypes.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      acknowledged: status === "acknowledged" || status === "cleared",
      status,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
    }
  })
}

const generateStateHistory = (unitId: string): StateHistory[] => {
  const history: StateHistory[] = []
  const now = new Date()

  for (let i = 0; i < 48; i++) {
    // 48 data points for 24 hours (every 30 minutes)
    const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000)
    const states = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    const state = states[Math.floor(Math.random() * states.length)]

    history.push({
      timestamp,
      state,
      duration: Math.floor(Math.random() * 25) + 5, // 5-30 minutes
    })
  }

  return history.reverse()
}

const generateKPIHistory = (unitId: string): KPIHistory[] => {
  const history: KPIHistory[] = []
  const now = new Date()

  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)

    history.push({
      timestamp,
      mtbf: Math.floor(Math.random() * 50) + 150,
      utilization: Math.floor(Math.random() * 20) + 70,
      alarmFrequency: Math.floor(Math.random() * 5) + 1,
      uptime: Math.floor(Math.random() * 15) + 85,
    })
  }

  return history.reverse()
}

// API functions that would connect to MySQL database
export const fetchMooringUnits = async (): Promise<MooringUnit[]> => {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/units/");
    if (!res.ok) throw new Error("Failed to fetch units");

    const data = await res.json();

    return data.map((unit: any, index: number) => ({
      id: `${index + 1}`,
      name: unit.unit,
      location: "Global Terminal 1",
      currentState: unit.state_code,
      stateDescription: unit.state,
      lastUpdated: new Date(unit.last_updated),
      isOnline: [1,2,3,4,5,6,7,8,9,10,11].includes(unit.state_code),
      // Dummy values for now, until backend provides them
      serialNumber: `SN-${10000 + index}`,
      assetType: "MM100",
      installationYear: 2020,
      slaActive: true,
      commissionedYear: 2021,
      dataConsent: true,
      warrantyStatus: "Active",
      siteName: "Global Terminal 1",
      endUser: "Maritime Solutions Inc.",
      country: "Global Region",
    }));
  } catch (err) {
    console.error("Error fetching real unit data:", err);
    return []; // fallback
  }
}


export const fetchMooringUnit = async (id: string): Promise<MooringUnit | null> => {
  // In production: SELECT * FROM mooring_units WHERE id = ?
  await new Promise((resolve) => setTimeout(resolve, 300))

  if (Number.parseInt(id) > 6 || Number.parseInt(id) < 1) {
    return null
  }

  return generateMockUnit(id)
}

export const fetchKPIData = async (unitId?: string): Promise<KPIData[]> => {
  // In production: SELECT * FROM kpi_data WHERE unit_id = ? OR unit_id IS NULL
  await new Promise((resolve) => setTimeout(resolve, 400))

  if (unitId) {
    return [generateMockKPI(unitId)]
  }

  return Array.from({ length: 6 }, (_, i) => generateMockKPI((i + 1).toString()))
}

export const fetchAlarms = async (unitId?: string): Promise<Alarm[]> => {
  // In production: SELECT * FROM alarms WHERE unit_id = ? ORDER BY timestamp DESC
  await new Promise((resolve) => setTimeout(resolve, 300))

  if (unitId) {
    return generateMockAlarms(unitId, 8)
  }

  const allAlarms: Alarm[] = []
  for (let i = 1; i <= 6; i++) {
    allAlarms.push(...generateMockAlarms(i.toString(), 3))
  }

  return allAlarms.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

export const fetchStateHistory = async (unitId: string): Promise<StateHistory[]> => {
  // In production: SELECT * FROM state_history WHERE unit_id = ? ORDER BY timestamp DESC LIMIT 48
  await new Promise((resolve) => setTimeout(resolve, 400))
  return generateStateHistory(unitId)
}

export const fetchKPIHistory = async (unitId: string): Promise<KPIHistory[]> => {
  // In production: SELECT * FROM kpi_history WHERE unit_id = ? ORDER BY timestamp DESC LIMIT 24
  await new Promise((resolve) => setTimeout(resolve, 400))
  return generateKPIHistory(unitId)
}

// Mock API function to acknowledge an alarm
export const acknowledgeAlarm = async (alarmId: string): Promise<boolean> => {
  // In production: UPDATE alarms SET status = 'acknowledged', acknowledged = true WHERE id = ?
  await new Promise((resolve) => setTimeout(resolve, 500))
  return true
}

// Mock API function to clear an alarm
export const clearAlarm = async (alarmId: string): Promise<boolean> => {
  // In production: UPDATE alarms SET status = 'cleared' WHERE id = ?
  await new Promise((resolve) => setTimeout(resolve, 500))
  return true
}
