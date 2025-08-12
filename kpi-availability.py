import pandas as pd
import pymysql
from datetime import datetime, timedelta

# Database connection
db_config = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'U8NbpiQxGyemHJrB',
    'database': 'ignitiondb',
    'autocommit': True
}
conn = pymysql.connect(**db_config)
cursor = conn.cursor()

# Load historical data
cursor.execute('''
SELECT dh.tagpath_id, dh.intvalue, dh.t_stamp,
       dhd.tagpath, dhd.location
FROM cc_landing.data_historical dh
JOIN cc_landing.data_historical_dict dhd ON dh.tagpath_id = dhd.id;
''')
historical_columns = [desc[0] for desc in cursor.description]
historical_data = pd.DataFrame(cursor.fetchall(), columns=historical_columns)
historical_data['t_stamp'] = pd.to_datetime(historical_data['t_stamp'], unit='s', utc=True)
historical_data.dropna(subset=['t_stamp'], inplace=True)

# Load alarm data
cursor.execute('''
SELECT da.alarm_id, da.eventtype, da.eventtime,
       dad.source, dad.location
FROM cc_landing.data_alarms da
JOIN cc_landing.data_alarms_dict dad ON da.alarm_id = dad.id;
''')
alarm_columns = [desc[0] for desc in cursor.description]
alarm_data = pd.DataFrame(cursor.fetchall(), columns=alarm_columns)
alarm_data['eventtime'] = pd.to_datetime(alarm_data['eventtime'], unit='s', utc=True)
alarm_data.dropna(subset=['eventtime'], inplace=True)

# Define units
units = {
    'Unit1': {'tagpath_id': '1', 'maint_alarm_id': 5},
    'Unit2': {'tagpath_id': '2', 'maint_alarm_id': 50}
}

# Expose a reusable availability function and avoid running heavy loops on import
DURATION_DAYS = { '1D': 1, '7D': 7, '30D': 30, '1Y': 365 }

UNIT_TO_MAINT_ALARM = { 'U1': 5, 'U2': 50 }


def calculate_AVAILABILITY_KPI(historical_data: pd.DataFrame, alarm_data: pd.DataFrame, duration: str = '1D', unit: str = 'U1') -> float:
    """Calculate availability percentage for a unit over a duration.

    Availability is computed as (total_period - maintenance_downtime) / total_period * 100.
    Maintenance downtime is approximated as 5 minutes per maintenance active event.
    """
    if duration not in DURATION_DAYS:
        duration = '30D'

    end_time = pd.Timestamp.utcnow()
    start_time = end_time - pd.Timedelta(days=DURATION_DAYS[duration])

    maint_id = UNIT_TO_MAINT_ALARM.get(unit)
    if maint_id is None:
        return 0.0

    maint_events = alarm_data[
        (alarm_data['alarm_id'] == maint_id) &
        (alarm_data['eventtype'] == 0) &
        (alarm_data['eventtime'] > start_time) &
        (alarm_data['eventtime'] <= end_time)
    ]

    maint_duration = pd.to_timedelta(maint_events.shape[0] * 5 * 60, unit='s')
    total_period = end_time - start_time

    if total_period <= pd.Timedelta(0):
        return 0.0

    availability = ((total_period - maint_duration) / total_period) * 100
    availability_value = max(0.0, float(availability))
    return round(availability_value, 2)


if __name__ == "__main__":
    # Original exploratory code preserved under main guard
    now = pd.Timestamp.now(tz='UTC').floor('D')
    date_list = [now - pd.Timedelta(days=i) for i in range(10)]

    availability_rows = []

    for date in date_list:
        start_dt = date
        end_dt = start_dt + pd.Timedelta(days=1)
        total_period = end_dt - start_dt

        for unit_name, config in units.items():
            tag_id = config['tagpath_id']
            maint_id = config['maint_alarm_id']

            unit_states = historical_data[
                (historical_data['tagpath_id'] == tag_id) &
                (historical_data['t_stamp'] >= start_dt) &
                (historical_data['t_stamp'] < end_dt)
            ].sort_values('t_stamp')

            unit_states['next_time'] = unit_states['t_stamp'].shift(-1)
            unit_states['duration'] = (unit_states['next_time'] - unit_states['t_stamp'])
            state_duration = unit_states['duration'].sum()

            maint_alarms = alarm_data[
                (alarm_data['alarm_id'] == maint_id) &
                (alarm_data['eventtype'] == 0) &
                (alarm_data['eventtime'] >= start_dt) & 
                (alarm_data['eventtime'] < end_dt)
            ]
            maint_duration = pd.to_timedelta(maint_alarms.shape[0] * 5 * 60, unit='s')

            downtime = maint_duration

            availability = ((total_period - downtime) / total_period) * 100

            print(f"\n{start_dt.date()} — {unit_name}")
            print(f"  Maintenance events     : {maint_alarms.shape[0]}")
            print(f"  Maintenance downtime   : {maint_duration}")
            print(f"  Total availability (%) : {availability:.2f}")

            availability_rows.append({
                'date': start_dt.date(),
                'unit': unit_name,
                'maintenance_count': maint_alarms.shape[0],
                'maintenance_downtime_minutes': maint_duration.total_seconds() / 60,
                'availability_percent': round(availability, 2)
            })

    availability_df = pd.DataFrame(availability_rows)

