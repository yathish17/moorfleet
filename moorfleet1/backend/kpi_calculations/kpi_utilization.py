# backend/kpi_calculations/kpi_utilization.py

import pymysql
import pandas as pd

days_map = {
    '1D': 1,
    '7D': 7,
    '30D': 30,
    '1Y': 365
}

def calculate_UTIL_KPI(duration='1D', unit='U1'):
    """Calculate Utilization %."""
    # DB connection
    conn = pymysql.connect(
        host='127.0.0.1',
        user='root',
        password='U8NbpiQxGyemHJrB',
        database='ignitiondb',
        autocommit=True
    )
    cur = conn.cursor()

    # Historical data
    cur.execute('''
    SELECT dh.tagpath_id, dh.intvalue, dh.t_stamp,
           dhd.site_id, dhd.tagpath, dhd.location
    FROM cc_landing.data_historical dh
    JOIN cc_landing.data_historical_dict dhd ON dh.tagpath_id = dhd.id
    ORDER BY t_stamp;
    ''')
    historical_data = pd.DataFrame(cur.fetchall(), columns=[desc[0] for desc in cur.description])
    historical_data['t_stamp'] = pd.to_datetime(historical_data['t_stamp'], unit='s', utc=True)

    # Alarm data
    cur.execute('''
    SELECT da.alarm_id, da.eventtype, da.eventtime,
           dad.site_id, dad.source, dad.location
    FROM cc_landing.data_alarms da
    JOIN cc_landing.data_alarms_dict dad ON da.alarm_id = dad.id
    ORDER BY eventtime;
    ''')
    alarm_data = pd.DataFrame(cur.fetchall(), columns=[desc[0] for desc in cur.description])
    alarm_data[['tag', 'alarm_name']] = alarm_data['source'].str.extract(r'/tag:(.*?):?/alm:(.*)')
    alarm_data['eventtime'] = pd.to_datetime(alarm_data['eventtime'], unit='s', utc=True)

    # Time range
    end_time = pd.Timestamp.utcnow()
    start_time = end_time - pd.Timedelta(days=days_map[duration])

    # Remote alarms
    alarm_data_remote = alarm_data[(alarm_data['alarm_name'] == f'{unit} in Remote') &
                                   (alarm_data['eventtime'] > start_time) &
                                   (alarm_data['eventtime'] <= end_time)]

    results = []
    current_start = None

    def process_interval(start, end):
        relevant_states = historical_data[(historical_data['t_stamp'] >= start) & (historical_data['t_stamp'] <= end)]
        state_start = None
        for _, row in relevant_states.iterrows():
            if row['intvalue'] == 6:
                if state_start is None:
                    state_start = row['t_stamp']
            elif row['intvalue'] != 6 and state_start:
                results.append({'start': state_start, 'end': row['t_stamp']})
                state_start = None
        if state_start:
            results.append({'start': state_start, 'end': end})

    for _, row in alarm_data_remote.iterrows():
        if row['eventtype'] == 0:
            current_start = row['eventtime']
        elif row['eventtype'] == 1 and current_start:
            process_interval(current_start, min(row['eventtime'], end_time))
            current_start = None

    if current_start:
        process_interval(current_start, end_time)

    if not results:
        return 0

    results_df = pd.DataFrame(results)
    results_df['duration'] = (results_df['end'] - results_df['start']) / pd.Timedelta(hours=1)
    unit_in_use = results_df['duration'].sum()

    available_hours = (days_map[duration] * 24)
    utilization = (unit_in_use / available_hours) * 100 if available_hours > 0 else 0

    return round(utilization, 2)

if __name__ == "__main__":
    print(calculate_UTIL_KPI('7D', 'U1'))
