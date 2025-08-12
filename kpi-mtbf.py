import pymysql
import pandas as pd

username = 'root'
passw = 'U8NbpiQxGyemHJrB'
db_name = 'ignitiondb'

landing_conn = pymysql.connect(
        host       = '127.0.0.1',
        port       = 3306,
        user       = username,
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

def calculate_MTBF_KPI(historical_data,alarm_data,duration='1D', unit='U1'):
    
    cal_end_time = pd.Timestamp.utcnow()
    cal_start_time = cal_end_time - pd.Timedelta(days=days[duration])

    full_alarm_data = alarm_data.copy()
    alarm_data = alarm_data[alarm_data['alarm_name'] == f'{unit} in Remote']
    alarm_data = alarm_data[
        (alarm_data['eventtime'] > cal_start_time) &
        (alarm_data['eventtime'] <= cal_end_time)
    ]

    results = []
    current_alarm_start = None

    def process_interval(start, end):
        relevant_states = historical_data[
            (historical_data['t_stamp'] >= start) & (historical_data['t_stamp'] <= end)
        ]
        state_start = None
        for _, row in relevant_states.iterrows():
            state = row['intvalue']
            t_stamp = row['t_stamp']
            if state != 11:
                if state_start is None:
                    state_start = t_stamp
            elif state == 11 and state_start:
                results.append({'non_11_start': state_start, 'non_11_end': t_stamp})
                state_start = None
        if state_start:
            results.append({'non_11_start': state_start, 'non_11_end': end})

    for _, row in alarm_data.iterrows():
        event = row['eventtype']
        event_time = row['eventtime']
        if event == 0:
            current_alarm_start = event_time
        elif event == 1 and current_alarm_start:
            process_interval(current_alarm_start, min(event_time, cal_end_time))
            current_alarm_start = None

    if current_alarm_start:
        process_interval(current_alarm_start, cal_end_time)

    if not results:
        return float('inf'), {
            'unit_failed_to_arm_count': 0,
            'unit_failed_to_reposition_count': 0,
            'unit_failed_to_moor_count': 0,
            'unit_failed_to_warp_count': 0,
            'unit_failed_to_step_count': 0,
            'unit_failed_to_detach_count': 0,
            'unit_failed_to_park_count': 0,
        }

    results_df = pd.DataFrame(results)
    results_df['duration'] = (results_df['non_11_end'] - results_df['non_11_start']) / pd.Timedelta(hours=1)
    total_duration = results_df['duration'].sum()

    MTBF_calculation_result=0 
    unit_failed_to_arm_count=0
    unit_failed_to_reposition_count=0
    unit_failed_to_moor_count=0
    unit_failed_to_warp_count=0
    unit_failed_to_step_count=0
    unit_failed_to_detach_count=0
    unit_failed_to_park_count=0
    # Alarm groups
    alarm_groups = {
        'unit_failed_to_arm_count': [
            f'{unit} Check Services Failed', f'{unit} Check Fluid Mgmt Failed', f'{unit} Check Vacuum Failed',
            f'{unit} Charge Vacuum Failed', f'{unit} Check Hydraulics Failed', f'{unit} Check C3 Failed',
            f'{unit} Check C1 Failed', f'{unit} Check C2 Failed', f'{unit} Check C4 Failed', f'{unit} Move to RTM Failed'
        ],
        'unit_failed_to_reposition_count': [f'{unit} at RTM Failed to Reposition'],
        'unit_failed_to_moor_count': [
            f'{unit} Mooring Failed to Reach Vessel', f'{unit} Mooring Failed to Couple',
            f'{unit} Mooring Failed to Retract', f'{unit} Mooring Failed to Decouple'
        ],
        'unit_failed_to_warp_count': [
            f'{unit} Warping Failed to Move Left', f'{unit} Warping Failed to Move Right'
        ],
        'unit_failed_to_step_count': [
            f'{unit} Stepping Failed to Decouple', f'{unit} Stepping Failed to Retract',
            f'{unit} Stepping Failed to Reposition', f'{unit} Stepping Failed to Reach Vessel',
            f'{unit} Stepping Failed to Couple'
        ],
        'unit_failed_to_detach_count': [
            f'{unit} Detaching Failed to Decouple', f'{unit} Detaching Failed to Retract',
            f'{unit} Detaching Move to RTM Failed'
        ],
        'unit_failed_to_park_count': [
            f'{unit} Parking C3 Failed to Pre Park', f'{unit} Parking C1 Failed to Park',
            f'{unit} Parking C2 Failed to Park', f'{unit} Parking C4 Failed to Park',
            f'{unit} Parking C3 Failed to Park', f'{unit} Parking Failed to Discharge',
            f'{unit} Parking Failed to Park'
        ]
    }

    parameters = {
        'unit_failed_to_arm_count':unit_failed_to_arm_count,
        'unit_failed_to_reposition_count':unit_failed_to_reposition_count,
        'unit_failed_to_moor_count':unit_failed_to_moor_count,
        'unit_failed_to_warp_count':unit_failed_to_warp_count,
        'unit_failed_to_step_count':unit_failed_to_step_count,
        'unit_failed_to_detach_count':unit_failed_to_detach_count,
        'unit_failed_to_park_count':unit_failed_to_park_count,
    }
    def count_alarms(df, alarm_df, alarms):
        count = 0
        for _, row in df.iterrows():
            start = row['non_11_start']
            end = row['non_11_end']
            count += alarm_df[
                (alarm_df['eventtime'] >= start) &
                (alarm_df['eventtime'] < end) &
                (alarm_df['alarm_name'].isin(alarms)) &
                (alarm_df['eventtype'] == 0)
            ].shape[0]
        return count

    total_failures = 0
    for param, alarm_names in alarm_groups.items():
        count = count_alarms(results_df, full_alarm_data, alarm_names)
        parameters[param] = count
        total_failures += count

    if total_failures == 0:
        MTBF_calculation_result = total_duration
    else:
        MTBF_calculation_result = total_duration / total_failures

    
    return MTBF_calculation_result,parameters
 

if __name__ == "__main__":
    mtbf, params = calculate_MTBF_KPI(historical_data, alarm_data, '7D', 'U1')
    print(mtbf)
    print(params)
