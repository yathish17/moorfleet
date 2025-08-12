# backend/kpi_calculations/kpi_mtbf.py
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

DAYS_MAP = {'1D': 1, '7D': 7, '30D': 30, '1Y': 365}

def _fetch_history_and_alarms(start_ts, end_ts):
    conn = pymysql.connect(**DB_CONFIG)
    cur = conn.cursor()
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
    return source.split(':')[-1].strip()

# expects: unit like 'U1', duration '7D'
def calculate_MTBF_KPI(duration='7D', unit='U1'):
    days = DAYS_MAP.get(duration, 30)
    end_time = pd.Timestamp.utcnow()
    start_time = end_time - pd.Timedelta(days=days)
    start_ts, end_ts = int(start_time.timestamp()), int(end_time.timestamp())

    historical, alarms = _fetch_history_and_alarms(start_ts, end_ts)
    if alarms.empty or historical.empty:
        # no data
        return float('inf'), {}

    # normalize alarm names
    alarms['alarm_name'] = alarms['source'].apply(_extract_alarm_name)

    # Filter alarms that indicate the unit went into "Remote" / fault windows.
    # Be flexible: match alarm names containing unit and 'Remote'
    mask_remote = alarms['alarm_name'].str.contains('Remote', case=False, na=False) & alarms['alarm_name'].str.contains(unit, na=False)
    remote_alarms = alarms[mask_remote].sort_values('eventtime')

    # If no direct matches, try fallback: any alarm source containing unit token or tag like 'MoorUnit1'
    if remote_alarms.empty:
        alt_mask = alarms['source'].str.contains(unit, na=False)
        remote_alarms = alarms[alt_mask & (alarms['alarm_name'].str.contains('Remote', na=False))]

    # Build failure intervals from remote_alarms (eventtype 0 start, 1 end)
    intervals = []
    current_start = None
    for _, row in remote_alarms.iterrows():
        if row['eventtype'] == 0:
            current_start = row['eventtime']
        elif row['eventtype'] == 1 and current_start is not None:
            intervals.append((current_start, min(row['eventtime'], end_time)))
            current_start = None
    if current_start is not None:
        intervals.append((current_start, end_time))

    # For each interval compute sub-intervals where state != 11 (non-ready/failure durations)
    result_intervals = []
    for start, end in intervals:
        # historical rows inside interval
        h = historical[(historical['t_stamp'] >= start) & (historical['t_stamp'] <= end)].sort_values('t_stamp')
        state_start = None
        for _, r in h.iterrows():
            state = r['intvalue']
            ts = r['t_stamp']
            if state != 11:
                if state_start is None:
                    state_start = ts
            elif state == 11 and state_start is not None:
                result_intervals.append({'s': state_start, 'e': ts})
                state_start = None
        if state_start is not None:
            result_intervals.append({'s': state_start, 'e': end})

    if not result_intervals:
        return float('inf'), {}

    res_df = pd.DataFrame(result_intervals)
    res_df['duration_h'] = (res_df['e'] - res_df['s']) / pd.Timedelta(hours=1)
    total_duration = res_df['duration_h'].sum()

    # count failures using categories like your original script (keeps same group names)
    alarm_groups = {
        'unit_failed_to_arm_count': [f'{unit} Check Services Failed', f'{unit} Check Fluid Mgmt Failed', f'{unit} Check Vacuum Failed'],
        # keep a short list; expand if needed
    }

    params = {}
    total_failures = 0
    for key, names in alarm_groups.items():
        count = 0
        for _, row in res_df.iterrows():
            s, e = row['s'], row['e']
            # alarms within that interval matching group names
            count += alarms[
                (alarms['eventtime'] >= s) & (alarms['eventtime'] < e) &
                (alarms['alarm_name'].isin(names)) & (alarms['eventtype'] == 0)
            ].shape[0]
        params[key] = int(count)
        total_failures += count

    # fallback if no groups matched: use number of result intervals as failures
    if total_failures == 0:
        total_failures = len(res_df)

    mtbf_hours = total_duration / total_failures if total_failures > 0 else float('inf')
    return round(float(mtbf_hours), 2), params
