# kpi_calculations/kpi_mtbf.py
import pandas as pd
import pymysql
from datetime import datetime, timedelta, timezone

# DB credentials
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password": "U8NbpiQxGyemHJrB",
    "database": "ignitiondb",
    "autocommit": True
}

# Alarm ID ranges for units (kept for reference, but not used in filtering now)
UNIT_ALARM_RANGES = {
    'U1': (8, 37),
    'U2': (42, 72)
}

def calculate_MTBF_KPI(duration, unit_name, end_time=None):
    """Calculate MTBF for given unit and time period (aligned with trial2.py logic)."""
    if unit_name not in UNIT_ALARM_RANGES:
        raise ValueError(f"Unknown unit name: {unit_name}")

    # --- Time range ---
    now = end_time or datetime.now(timezone.utc)
    if duration == "1D":
        start_time = now - timedelta(days=1)
    elif duration == "7D":
        start_time = now - timedelta(days=7)
    elif duration == "30D":
        start_time = now - timedelta(days=30)
    elif duration == "1Y":
        start_time = now - timedelta(days=365)
    else:
        raise ValueError(f"Invalid duration: {duration}")

    # --- DB Query ---
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT data_alarms.uuid, data_alarms.alarm_id, data_alarms.eventtype, data_alarms.eventtime,
               data_alarms_dict.site_id, data_alarms_dict.source as source, data_alarms_dict.location
        FROM cc_landing.data_alarms
        JOIN cc_landing.data_alarms_dict ON data_alarms.alarm_id = data_alarms_dict.id
        WHERE FROM_UNIXTIME(data_alarms.eventtime) BETWEEN %s AND %s;
    """, (start_time, now))

    alarm_columns = [desc[0] for desc in cursor.description]
    alarm_data = pd.DataFrame(cursor.fetchall(), columns=alarm_columns)

    cursor.close()
    conn.close()

    if alarm_data.empty:
        return None, {"error": "No alarm data for period"}

    # --- Extract alarm_name & clean ---
    alarm_data[['tag', 'alarm_name']] = alarm_data['source'].str.extract(r'/tag:(.*?):?/alm:(.*)')
    alarm_data['alarm_name'] = alarm_data['alarm_name'].astype(str).str.strip().str.lower()
    alarm_data['eventtime'] = pd.to_datetime(alarm_data['eventtime'], unit='s', errors='coerce', utc=True)
    alarm_data.dropna(subset=['eventtime'], inplace=True)

    # --- trial2.py-matching filtering ---
    failure_df = alarm_data[
        (alarm_data['alarm_name'].str.contains(unit_name.lower(), na=False)) &
        (alarm_data['eventtype'] == 0)
    ].sort_values('eventtime').copy()

    failure_count = failure_df.shape[0]

    # --- MTBF Calculation (exact trial2.py logic) ---
    if failure_count >= 2:
        time_diffs = failure_df['eventtime'].diff().dt.total_seconds().iloc[1:]
        mtbf_seconds = time_diffs.mean()
    elif failure_count == 1:
        mtbf_seconds = (now - failure_df.iloc[0]['eventtime']).total_seconds()
    else:
        mtbf_seconds = None

    mtbf_hours = mtbf_seconds / 3600 if mtbf_seconds is not None else None

    # --- Categorized counts ---
    def make_alarm_list(base_list, unit):
        return [alarm.replace("Ux", unit) for alarm in base_list]

    BASE_ALARMS = {
        "arm": [
            "Ux Check Services Failed", "Ux Check Fluid Mgmt Failed", "Ux Check Vacuum Failed", "Ux Charge Vacuum Failed",
            "Ux Check Hydraulics Failed", "Ux Check C1 Failed", "Ux Check C2 Failed", "Ux Check C3 Failed", "Ux Check C4 Failed",
            "Ux Move to RTM Failed"
        ],
        "reposition": ["Ux Stepping Failed to Reposition"],
        "moor": [
            "Ux Mooring Failed to Reach Vessel", "Ux Mooring Failed to Couple",
            "Ux Mooring Failed to Retract", "Ux Mooring Failed to Decouple"
        ],
        "warp": ["Ux Warping Failed to Move Left", "Ux Warping Failed to Move Right"],
        "step": [
            "Ux Stepping Failed to Decouple", "Ux Stepping Failed to Retract",
            "Ux Stepping Failed to Reposition", "Ux Stepping Failed to Reach Vessel",
            "Ux Stepping Failed to Couple"
        ],
        "detach": ["Ux Detaching Failed to Retract", "Ux Detaching Move to RTM Failed"],
        "park": [
            "Ux Parking C1 Failed to Park", "Ux Parking C2 Failed to Park", "Ux Parking C3 Failed to Park",
            "Ux Parking C4 Failed to Park", "Ux Parking Failed to Discharge", "Ux Parking Failed to Park"
        ],
    }

    def count_named_failures(df, alarm_list):
        return df[df['alarm_name'].isin([a.lower() for a in alarm_list])].shape[0]

    unit_alarms = {k: make_alarm_list(v, unit_name) for k, v in BASE_ALARMS.items()}

    parameters = {
        f"{unit_name.lower()}_failed_to_{key}_count": count_named_failures(failure_df, alarm_list)
        for key, alarm_list in unit_alarms.items()
    }

    return mtbf_hours, parameters
