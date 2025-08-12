import pymysql
import pandas as pd
 
db_name = 'cc_landing'
user = 'root'
passw = 'Rootadmin1234'
 
landing_conn = pymysql.connect(
        host       = '127.0.0.1',
        port       = 3306,
        user       = user,
        password   = passw,
        database   = db_name,
        autocommit = True)
 
landing_cursor = landing_conn.cursor()
 
landing_cursor.execute('''
select
    data_historical.tagpath_id,
    data_historical.intvalue,
    data_historical.floatvalue,
    data_historical.stringvalue,
    data_historical.datevalue,
    data_historical.t_stamp,
    data_historical_dict.site_id,
    data_historical_dict.tagpath,
    data_historical_dict.location
from
    cc_landing.data_historical
JOIN cc_landing.data_historical_dict ON data_historical.tagpath_id = data_historical_dict.id
order by t_stamp;
''')
 
historical_data = landing_cursor.fetchall()
 
columns = [desc[0] for desc in landing_cursor.description]
historical_data = pd.DataFrame(historical_data, columns=columns)
historical_data.drop(columns=['floatvalue','stringvalue','datevalue'],inplace=True)
historical_data['t_stamp'] = pd.to_datetime(historical_data['t_stamp'], unit='s', utc=True)
 
# print(historical_data.head(10))
 
landing_cursor.execute('''
select
    data_alarms.uuid,
    data_alarms.alarm_id,
    data_alarms.eventtype,
    data_alarms.eventtime,
    data_alarms_dict.site_id,
    data_alarms_dict.source as source,
    data_alarms_dict.location
from
    cc_landing.data_alarms
JOIN cc_landing.data_alarms_dict ON data_alarms.alarm_id = data_alarms_dict.id
order by eventtime;
''')
 
alarm_data = landing_cursor.fetchall()
# print(landing_cursor.description)
columns = [desc[0] for desc in landing_cursor.description]
# print(columns)
alarm_data = pd.DataFrame(alarm_data, columns=columns)
alarm_data[['tag', 'alarm_name']] = alarm_data['source'].str.extract(r'/tag:(.*?):?/alm:(.*)')
alarm_data.drop(columns=['source','uuid'],inplace=True)
alarm_data['eventtime'] = pd.to_datetime(alarm_data['eventtime'], unit='s', utc=True)
# print(alarm_data.head(10))
 
days = {
    '1D' : 1,
    '7D' : 7,
    '30D' : 30,
    '1Y' : 365        
}    
 
def calculate_UTIL_KPI(historical_data,alarm_data,duration='1D', unit='U1'):
    util_result = 0
   
    cal_end_time = pd.Timestamp.utcnow()
    cal_start_time = cal_end_time - pd.Timedelta(days=days[duration])
 
    full_alarm_data = alarm_data.copy()
    alarm_data_rem = alarm_data[alarm_data['alarm_name'] == f'{unit} in Remote']
    alarm_data_rem = alarm_data_rem[
        (alarm_data_rem['eventtime'] > cal_start_time) &
        (alarm_data_rem['eventtime'] <= cal_end_time)
    ]
    results = []
    current_alarm_start = None
    def process_interval_rem(start, end):
        relevant_states = historical_data[
            (historical_data['t_stamp'] >= start) & (historical_data['t_stamp'] <= end)
        ]
        state_start = None
        for _, row in relevant_states.iterrows():
            state = row['intvalue']
            t_stamp = row['t_stamp']
            if state == 6:
                if state_start is None:
                    state_start = t_stamp
            elif state != 6 and state_start:
                results.append({'6_start': state_start, '6_end': t_stamp})
                state_start = None
        if state_start:
            results.append({'6_start': state_start, '6_end': end})
 
    for _, row in alarm_data_rem.iterrows():
        event = row['eventtype']
        event_time = row['eventtime']
        if event == 0:
            current_alarm_start = event_time
        elif event == 1 and current_alarm_start:
            process_interval_rem(current_alarm_start, min(event_time, cal_end_time))
            current_alarm_start = None
 
    if current_alarm_start:
        process_interval_rem(current_alarm_start, cal_end_time)
 
    if not results:
        return 0
 
    results_df = pd.DataFrame(results)
    if results_df.empty:
        print("No non-11 intervals found in historical data.")
        print("→ Likely reason: No 'Remote' alarms triggered or no non-11 states in the selected time.")
        return 0  # or return pd.NA, or some other fallback
    results_df['duration'] = (results_df['6_end'] - results_df['6_start']) / pd.Timedelta(hours=1)
    unit_in_use = results_df['duration'].sum()
   
    #maintenance
    results_maint = []
    current_alarm_start_maint = None
    alarm_data_maint = alarm_data[alarm_data['alarm_name'] == f'{unit} in Maintenance']
    alarm_data_maint = alarm_data_maint[
        (alarm_data_maint['eventtime'] > cal_start_time) &
        (alarm_data_maint['eventtime'] <= cal_end_time)
    ]
 
    for _, row in alarm_data_maint.iterrows():
        event = row['eventtype']
        event_time = row['eventtime']
        if event == 0:
            current_alarm_start_maint = event_time
        elif event == 1 and current_alarm_start_maint:
            # process_interval_rem(current_alarm_start, min(event_time, cal_end_time))
            results_maint.append({'maint_start': current_alarm_start_maint, 'maint_end': event_time})
 
            current_alarm_start_maint = None
 
    if current_alarm_start_maint:
        # process_interval_rem(current_alarm_start, cal_end_time)
        results_maint.append({'maint_start': current_alarm_start_maint, 'maint_end': cal_end_time})
 
 
    if not results:
        maint_time = 0
 
    results_df_maint = pd.DataFrame(results_maint)
    if results_df_maint.empty:
        print("No non-11 intervals found in historical data.")
        print("→ Likely reason: No 'Remote' alarms triggered or no non-11 states in the selected time.")
        return 0  # or return pd.NA, or some other fallback
    results_df_maint['duration'] = (results_df_maint['maint_end'] - results_df_maint['maint_start']) / pd.Timedelta(hours=1)
    maint_time = results_df_maint['duration'].sum()
       
    available_hours = (days[duration] * 24) - maint_time
    if available_hours <= 0:
        return 0
   
    util_result = (unit_in_use / available_hours) * 100
   
    return util_result
 
util = calculate_UTIL_KPI(historical_data,alarm_data,'7D', 'U1')
print(util)
 