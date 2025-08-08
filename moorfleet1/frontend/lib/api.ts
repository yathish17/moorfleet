import { type MooringUnit, type KPIData, type Alarm, type StateHistory, type KPIHistory, MOORING_STATES } from "./types"

// --- Mock generators (keep for fallback/testing) ---
const generateMockUnit = (id: string): MooringUnit => {
  const states = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const currentState = states[Math.floor(Math.random() * states.length)]

  return {
    id,
    name: `Unit ${id}`,
    location: "Global Terminal 1",
    currentState,
    stateDescription: MOORING_STATES[currentState as keyof typeof MOORING_STATES],
    lastUpdated: new Date(),
    isOnline: Math.random() > 0.1,
    serialNumber: `SN-${Math.floor(10000 + Math.random() * 90000)}`,
    assetType: "MM" + (Math.random() > 0.5 ? "100" : "200"),
    installationYear: 2018 + Math.floor(Math.random() * 5),
    slaActive: Math.random() > 0.3,
    commissionedYear: 2019 + Math.floor(Math.random() * 5),
    dataConsent: true,
    warrantyStatus: Math.random() > 0.5 ? "Active" : "Expired",
    siteName: "Global Terminal 1",
    endUser: "Maritime Solutions Inc.",
    country: "Global Region",
  }
}

const generateMockKPI = (unitId: string): KPIData => ({
  unitId,
  mtbf: Math.floor(Math.random() * 200) + 50,
  utilization: Math.floor(Math.random() * 40) + 60,
  alarmFrequency: Math.floor(Math.random() * 10) + 1,
  uptime: Math.floor(Math.random() * 20) + 80,
  efficiency: Math.floor(Math.random() * 30) + 70,
  lastMaintenance: new Date(),
})

// --- REAL API calls ---
export const fetchMooringUnit = async (id: string): Promise<MooringUnit | null> => {
  try {
    const res = await fetch(`http://127.0.0.1:5000/api/units/${id}`);
    if (!res.ok) throw new Error("Failed to fetch unit");

    const unit = await res.json();

    return {
      id: unit.unit_id?.toString() ?? id,
      name: unit.unit ?? `Unit ${id}`,
      location: unit.location ?? "Global Terminal 1",
      currentState: unit.state_code,
      stateDescription: unit.state,
      lastUpdated: unit.last_updated ? new Date(unit.last_updated) : new Date(),
      isOnline: [1,2,3,4,5,6,7,8,9,10,11].includes(unit.state_code),
      serialNumber: unit.serial_number ?? `SN-${10000 + parseInt(id)}`,
      assetType: unit.asset_type ?? "MM100",
      installationYear: unit.installation_year ?? 2020,
      slaActive: unit.sla_active ?? true,
      commissionedYear: unit.commissioned_year ?? 2021,
      dataConsent: true,
      warrantyStatus: "Active",
      siteName: unit.site_name ?? "Global Terminal 1",
      endUser: unit.end_user ?? "Maritime Solutions Inc.",
      country: unit.country ?? "Global Region",
    };
  } catch (err) {
    console.error(`Error fetching unit ${id}:`, err);
    return null;
  }
};

export const fetchMooringUnits = async (): Promise<MooringUnit[]> => {
  try {
    const res = await fetch(`http://127.0.0.1:5000/api/units`);
    if (!res.ok) throw new Error("Failed to fetch units");

    const data = await res.json();

    return data.map((unit: any) => ({
      id: unit.unit_id?.toString() ?? "",
      name: unit.unit ?? `Unit ${unit.unit_id}`,
      location: unit.location ?? "Global Terminal 1",
      currentState: unit.state_code,
      stateDescription: unit.state,
      lastUpdated: unit.last_updated ? new Date(unit.last_updated) : new Date(),
      isOnline: [1,2,3,4,5,6,7,8,9,10,11].includes(unit.state_code),
      serialNumber: unit.serial_number ?? `SN-${10000 + Math.floor(Math.random() * 90000)}`,
      assetType: unit.asset_type ?? "MM100",
      installationYear: unit.installation_year ?? 2020,
      slaActive: unit.sla_active ?? true,
      commissionedYear: unit.commissioned_year ?? 2021,
      dataConsent: true,
      warrantyStatus: "Active",
      siteName: unit.site_name ?? "Global Terminal 1",
      endUser: unit.end_user ?? "Maritime Solutions Inc.",
      country: unit.country ?? "Global Region",
    }));
  } catch (err) {
    console.error("Error fetching all units:", err);
    return [];
  }
};


export const fetchKPIData = async (unitId?: string): Promise<KPIData[]> => {
  if (unitId) return [generateMockKPI(unitId)]
  return Array.from({ length: 6 }, (_, i) => generateMockKPI((i + 1).toString()))
}

export const fetchAlarms = async (unitId?: string): Promise<Alarm[]> => {
  try {
    const url = unitId
      ? `http://127.0.0.1:5000/api/alarms/recent/${unitId}`
      : `http://127.0.0.1:5000/api/alarms/recent`

    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch alarms")

    const data = await res.json()

    return data.map((alarm: any) => {
      let status: "created" | "cleared" | "acknowledged" = "created"
      if (alarm.eventtype === 1) status = "cleared"
      else if (alarm.eventtype === 2) status = "acknowledged"

      return {
        id: alarm.id.toString(),
        unitId: unitId ?? "all",
        type: alarm.priority.toLowerCase(),
        message: alarm.message || alarm.name || "Unknown Alarm",
        timestamp: alarm.timestamp
          ? new Date(alarm.timestamp.replace(" ", "T") + "Z")
          : new Date(),
        acknowledged: status === "acknowledged",
        status,
        priority: alarm.priority,
      }
    })
  } catch (err) {
    console.error("Error fetching alarms:", err)
    return []
  }
}

export const fetchStateHistory = async (unitId: string): Promise<StateHistory[]> => {
  return []
}

export const fetchKPIHistory = async (unitId: string): Promise<KPIHistory[]> => {
  return []
}

export const acknowledgeAlarm = async (alarmId: string): Promise<boolean> => {
  return true
}

export const clearAlarm = async (alarmId: string): Promise<boolean> => {
  return true
}
