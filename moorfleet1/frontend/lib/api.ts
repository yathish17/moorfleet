import { type MooringUnit, type KPIData, type Alarm, type StateHistory, type KPIHistory, MOORING_STATES } from "./types"

// Unit ID mapping: DB tagid → Display ID
const mapTagIdToDisplayId = (tagid: number): string => {
  if (tagid === 1) return "1"
  if (tagid === 3) return "2"
  return tagid.toString()
}

const mapDisplayIdToTagId = (displayId: string): number => {
  if (displayId === "1") return 1
  if (displayId === "2") return 3
  return parseInt(displayId)
}

// --- REAL API calls ---
export const fetchMooringUnit = async (id: string): Promise<MooringUnit | null> => {
  try {
    // Convert display ID to DB tagid for API call
    const tagid = mapDisplayIdToTagId(id)
    const res = await fetch(`http://192.168.39.165:5000/api/units/${tagid}`);
    if (!res.ok) throw new Error("Failed to fetch unit");

    const unit = await res.json();

    return {
      id: mapTagIdToDisplayId(unit.tagid), // Map to display ID
      name: `Unit ${mapTagIdToDisplayId(unit.tagid)}`, // Use display ID for name
      location: unit.location ?? "Global Terminal 1",
      currentState: unit.state_code,
      stateDescription: unit.state,
      lastUpdated: unit.last_updated ? new Date(unit.last_updated) : new Date(),
      isOnline: [1,2,3,4,5,6,7,8,9,10,11].includes(unit.state_code),
      serialNumber: unit.serial_number ?? `SN-${10000 + tagid}`,
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
    const res = await fetch(`http://192.168.39.165:5000/api/units`);
    if (!res.ok) throw new Error("Failed to fetch units");

    const data = await res.json();

    return data.map((unit: any) => ({
      id: mapTagIdToDisplayId(unit.tagid), // Map to display ID
      name: `Unit ${mapTagIdToDisplayId(unit.tagid)}`, // Use display ID for name
      location: unit.location ?? "Global Terminal 1",
      currentState: unit.state_code,
      stateDescription: unit.state,
      lastUpdated: unit.last_updated ? new Date(unit.last_updated) : new Date(),
      isOnline: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].includes(unit.state_code),
      serialNumber: unit.serial_number ?? `SN-${10000 + unit.tagid}`,
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

export const fetchKPIData = async (
  unitId?: string,
  range: string = "30D"
): Promise<KPIData[]> => {
  try {
    if (unitId) {
      // single unit mode
      const res = await fetch(`http://192.168.39.165:5000/api/kpis/${unitId}/${range}`);
      if (!res.ok) throw new Error("Failed to fetch KPI data");
      const kpiData = await res.json();
      return [{
        unitId,
        mtbf: kpiData.mtbf ?? 0,
        utilization: kpiData.utilization ?? 0,
        availability: kpiData.availability ?? 0,
        range
      }];
    } else {
      // all units
      const res = await fetch(`http://192.168.39.165:5000/api/kpis?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch KPI data");
      return await res.json();
    }
  } catch (err) {
    console.error("Error fetching KPI data:", err);
    return [];
  }
};



export const fetchAlarms = async (unitId?: string): Promise<Alarm[]> => {
  try {
    let url: string;
    if (unitId) {
      // Convert display ID to DB tagid for API call
      const tagid = mapDisplayIdToTagId(unitId)
      url = `http://192.168.39.165:5000/api/alarms/recent/${tagid}`;
    } else {
      url = `http://192.168.39.165:5000/api/alarms/recent`;
    }

    console.log(`Fetching alarms from: ${url}`); // Debug log

    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch alarms")

    const data = await res.json()
    console.log(`Received alarms data:`, data); // Debug log

    return data.map((alarm: any) => {
      let status: "created" | "cleared" | "acknowledged" = "created"
      if (alarm.eventtype === 1) status = "cleared"
      else if (alarm.eventtype === 2) status = "acknowledged"

      // Map alarm unitId to display ID if present
      let mappedUnitId = unitId ?? "all";
      if (alarm.unitId) {
        mappedUnitId = mapTagIdToDisplayId(Number(alarm.unitId));
      }

      return {
        id: alarm.id.toString(),
        unitId: mappedUnitId,
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
  try {
    // Convert display ID to DB tagid for API call
    const tagid = mapDisplayIdToTagId(unitId)
    const res = await fetch(`http://192.168.39.165:5000/api/units/${tagid}/history`);
    if (!res.ok) throw new Error("Failed to fetch state history");
    
    const data = await res.json();
    return data.map((item: any) => ({
      timestamp: new Date(item.timestamp),
      state: item.state_code,
      duration: item.duration || 0,
    }));
  } catch (err) {
    console.error("Error fetching state history:", err);
    return [];
  }
}

export const fetchKPIHistory = async (unitId: string, range: string): Promise<KPIHistory[]> => {
  try {
    // Convert display ID to DB tagid for API call
    const tagid = mapDisplayIdToTagId(unitId)
    const res = await fetch(`http://192.168.39.165:5000/api/kpis/${tagid}/history?range=${range}`);
    if (!res.ok) throw new Error("Failed to fetch KPI history");
    
    const data = await res.json();
    return data.map((item: any) => ({
      timestamp: new Date(item.timestamp),
      mtbf: item.mtbf || 0,
      utilization: item.utilization || 0,
      alarmFrequency: item.alarm_frequency || 0,
      uptime: item.uptime || 0,
    }));
  } catch (err) {
    console.error("Error fetching KPI history:", err);
    return [];
  }
}

export const acknowledgeAlarm = async (alarmId: string): Promise<boolean> => {
  try {
    const res = await fetch(`http://192.168.39.165:5000/api/alarms/${alarmId}/acknowledge`, {
      method: 'POST',
    });
    return res.ok;
  } catch (err) {
    console.error("Error acknowledging alarm:", err);
    return false;
  }
}

export const clearAlarm = async (alarmId: string): Promise<boolean> => {
  try {
    const res = await fetch(`http://192.168.39.165:5000/api/alarms/${alarmId}/clear`, {
      method: 'POST',
    });
    return res.ok;
  } catch (err) {
    console.error("Error clearing alarm:", err);
    return false;
  }
}
