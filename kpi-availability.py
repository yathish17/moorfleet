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

# Define target dates (past 10 days)
now = pd.Timestamp.now(tz='UTC').floor('D')
date_list = [now - pd.Timedelta(days=i) for i in range(10)]

# Final storage
availability_rows = []

for date in date_list:
    start_dt = date
    end_dt = start_dt + pd.Timedelta(days=1)
    total_period = end_dt - start_dt

    for unit_name, config in units.items():
        tag_id = config['tagpath_id']
        maint_id = config['maint_alarm_id']

        # State data in this period
        unit_states = historical_data[
            (historical_data['tagpath_id'] == tag_id) &
            (historical_data['t_stamp'] >= start_dt) &
            (historical_data['t_stamp'] < end_dt)
        ].sort_values('t_stamp')

        # Build durations between state changes
        unit_states['next_time'] = unit_states['t_stamp'].shift(-1)
        unit_states['duration'] = (unit_states['next_time'] - unit_states['t_stamp'])
        state_duration = unit_states['duration'].sum()

        # Maintenance duration from alarms
        maint_alarms = alarm_data[
            (alarm_data['alarm_id'] == maint_id) &
            (alarm_data['eventtype'] == 0) &  # Active
            (alarm_data['eventtime'] >= start_dt) & 
            (alarm_data['eventtime'] < end_dt)
        ]
        maint_duration = pd.to_timedelta(maint_alarms.shape[0] * 5 * 60, unit='s')  # assuming 5 min/event

        # Total downtime = maintenance + gaps in state data
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

# Save results
availability_df = pd.DataFrame(availability_rows)

