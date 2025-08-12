# backend/kpi_calculations/kpi_availability.py
import pymysql
import pandas as pd
from datetime import datetime, timedelta

DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'U8NbpiQxGyemHJrB',
    'database': 'ignitiondb',
    'autocommit': True
}

# Map units to tagpath_id / maintenance alarm id (adjust if your ids differ)
UNITS = {
    'U1': {'tagpath_id': '1', 'maint_alarm_id': 5},
    'U2': {'tagpath_id': '2', 'maint_alarm_id': 50}
}

DAYS_MAP = {'1D': 1, '7D': 7, '30D': 30, '1Y': 365}

def _fetch_history_and_alarms(start_ts, end_ts):
    conn = pymysql.connect(**DB_CONFIG)
    cur = conn.cursor()
    # historical
    cur.execute("""
        SELECT dh.tagpath_id, dh.intvalue, dh.t_stamp
        FROM cc_landing.data_historical dh
        WHERE dh.t_stamp BETWEEN %s AND %s
        ORDER BY dh.t_stamp
    """, (int(start_ts), int(end_ts)))
    hist_rows = cur.fetchall()
    hist_cols = [desc[0] for desc in cur.description]
    hist_df = pd.DataFrame(hist_rows, columns=hist_cols)
    if not hist_df.empty:
        hist_df['t_stamp'] = pd.to_datetime(hist_df['t_stamp'], unit='s', utc=True)

    # alarms
    cur.execute("""
        SELECT da.alarm_id, da.eventtype, da.eventtime, dad.source
        FROM cc_landing.data_alarms da
        JOIN cc_landing.data_alarms_dict dad ON da.alarm_id = dad.id
        WHERE da.eventtime BETWEEN %s AND %s
        ORDER BY da.eventtime
    """, (int(start_ts), int(end_ts)))
    alarm_rows = cur.fetchall()
    alarm_cols = [desc[0] for desc in cur.description]
    alarm_df = pd.DataFrame(alarm_rows, columns=alarm_cols)
    if not alarm_df.empty:
        alarm_df['eventtime'] = pd.to_datetime(alarm_df['eventtime'], unit='s', utc=True)
    conn.close()
    return hist_df, alarm_df

def _extract_alarm_name(source):
    import re
    if not isinstance(source, str):
        return ""
    m = re.search(r'/alm:(.+)$', source)
    if m:
        return m.group(1).strip()
    # fallback: last token after ":" 
    return source.split(':')[-1].strip()

def calculate_AVAILABILITY_KPI(duration='1D', unit='U1'):
    days = DAYS_MAP.get(duration, 30)
    now = pd.Timestamp.utcnow()
    start = now - pd.Timedelta(days=days)
    start_ts = int(start.timestamp())
    end_ts = int(now.timestamp())

    hist_df, alarm_df = _fetch_history_and_alarms(start_ts, end_ts)

    cfg = UNITS.get(unit)
    if not cfg:
        raise ValueError("Unknown unit: " + str(unit))

    # maintenance alarms count for this unit
    if not alarm_df.empty:
        alarm_df['alarm_name'] = alarm_df['source'].apply(_extract_alarm_name)
        maint_mask = alarm_df['alarm_id'] == cfg['maint_alarm_id']
        maint_events = alarm_df[maint_mask & (alarm_df['eventtype'] == 0)]
        maint_count = len(maint_events)
    else:
        maint_count = 0

    total_period = pd.Timedelta(days=days)
    maint_duration = pd.to_timedelta(maint_count * 5 * 60, unit='s')  # 5 mins per event assumption
    availability = ((total_period - maint_duration) / total_period) * 100.0
    return round(float(availability), 2)
