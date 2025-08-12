from flask import Blueprint, jsonify, request
from mysql.connector import connect
from datetime import datetime, timedelta

# Define blueprint
kpi_bp = Blueprint('kpis', __name__)

# Unit ID mapping: Display ID → DB tagid
UNIT_ID_MAPPING = {
    1: 1,  # Unit 1 → tagid 1
    2: 3,  # Unit 2 → tagid 3
}

def get_db_tagid(display_id):
    return UNIT_ID_MAPPING.get(display_id, display_id)

# DB connection
def get_ignition_connection():
    return connect(
        host="127.0.0.1",
        user="root",
        password="U8NbpiQxGyemHJrB",
        database="ignitiondb"
    )

# --- Time Range Helper ---
def parse_range_to_days(range_param):
    mapping = {
        "24h": 1,
        "7d": 7,
        "30d": 30,
        "1y": 365
    }
    return mapping.get(range_param, 30)

# --- KPI Calculations ---
def calculate_mtbf(unit_tagid, days=30):
    conn = get_ignition_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        query = """
            SELECT t_stamp, intvalue
            FROM sqlt_data_1_2025_08
            WHERE tagid = %s 
            AND t_stamp BETWEEN %s AND %s
            AND intvalue IN (7, 8, 9)
            ORDER BY t_stamp
        """
        cursor.execute(query, (unit_tagid, start_date, end_date))
        fault_events = cursor.fetchall()
        if len(fault_events) < 2:
            return 168
        total_time = 0
        for i in range(1, len(fault_events)):
            time_diff = fault_events[i]['t_stamp'] - fault_events[i-1]['t_stamp']
            total_time += time_diff.total_seconds() / 3600
        avg_mtbf = total_time / (len(fault_events) - 1)
        return round(avg_mtbf, 1)
    except:
        return 168
    finally:
        conn.close()

def calculate_utilization(unit_tagid, days=30):
    conn = get_ignition_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        query = """
            SELECT 
                COUNT(*) as total_records,
                SUM(CASE WHEN intvalue IN (6, 11) THEN 1 ELSE 0 END) as operational_records
            FROM sqlt_data_1_2025_08
            WHERE tagid = %s 
            AND t_stamp BETWEEN %s AND %s
        """
        cursor.execute(query, (unit_tagid, start_date, end_date))
        result = cursor.fetchone()
        if result['total_records'] == 0:
            return 75
        utilization = (result['operational_records'] / result['total_records']) * 100
        return round(utilization, 1)
    except:
        return 75
    finally:
        conn.close()

def calculate_alarm_frequency(unit_tagid, days=30):
    conn = get_ignition_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        query = """
            SELECT COUNT(*) as alarm_count
            FROM alarm_events
            WHERE source LIKE %s
            AND eventtime BETWEEN %s AND %s
        """
        cursor.execute(query, (f"%MoorUnit{unit_tagid}/%", start_date, end_date))
        result = cursor.fetchone()
        alarm_frequency = result['alarm_count'] / days
        return round(alarm_frequency, 1)
    except:
        return 2.5
    finally:
        conn.close()

def calculate_availability(unit_tagid, days=30):
    conn = get_ignition_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        query = """
            SELECT 
                COUNT(*) as total_records,
                SUM(CASE WHEN intvalue IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11) THEN 1 ELSE 0 END) as online_records
            FROM sqlt_data_1_2025_08
            WHERE tagid = %s 
            AND t_stamp BETWEEN %s AND %s
        """
        cursor.execute(query, (unit_tagid, start_date, end_date))
        result = cursor.fetchone()
        if result['total_records'] == 0:
            return 95
        availability = (result['online_records'] / result['total_records']) * 100
        return round(availability, 1)
    except:
        return 95
    finally:
        conn.close()

# --- Routes ---
@kpi_bp.route('/', methods=['GET'])
def get_all_kpis():
    try:
        range_param = request.args.get('range', '30d')
        days = parse_range_to_days(range_param)

        kpis = []
        for tagid in [1, 3]:
            kpi_data = {
                'tagid': tagid,
                'mtbf': calculate_mtbf(tagid, days),
                'utilization': calculate_utilization(tagid, days),
                'availability': calculate_availability(tagid, days),
                'alarm_frequency': calculate_alarm_frequency(tagid, days),
                'last_maintenance': (datetime.now() - timedelta(days=15)).strftime('%Y-%m-%d %H:%M:%S'),
                'range': range_param
            }
            kpis.append(kpi_data)

        return jsonify(kpis)
    except Exception as e:
        print(f"Error getting KPI data: {e}")
        return jsonify([]), 500

@kpi_bp.route('/<int:display_id>', methods=['GET'])
def get_unit_kpi(display_id):
    try:
        db_tagid = get_db_tagid(display_id)
        range_param = request.args.get('range', '30d')
        days = parse_range_to_days(range_param)

        kpi_data = {
            'tagid': db_tagid,
            'mtbf': calculate_mtbf(db_tagid, days),
            'availability': calculate_availability(db_tagid, days),
            'utilization': calculate_utilization(db_tagid, days),
            'alarm_frequency': calculate_alarm_frequency(db_tagid, days),
            'last_maintenance': (datetime.now() - timedelta(days=15)).strftime('%Y-%m-%d %H:%M:%S'),
            'range': range_param
        }
        return jsonify(kpi_data)
    except Exception as e:
        print(f"Error getting KPI data for unit {display_id}: {e}")
        return jsonify({'error': 'Failed to get KPI data'}), 500

@kpi_bp.route('/<int:display_id>/history', methods=['GET'])
def get_unit_kpi_history(display_id):
    """Calculate KPI history (daily) for a specific unit"""
    try:
        days = parse_range_to_days(request.args.get('range', '30d'))
        db_tagid = get_db_tagid(display_id)

        # Build daily KPI list
        history = []
        for i in range(days):
            end_date = datetime.now() - timedelta(days=i)
            start_date = end_date - timedelta(days=1)

            mtbf = calculate_mtbf(db_tagid, 1)  # 1-day MTBF
            utilization = calculate_utilization(db_tagid, 1)
            availability = calculate_availability(db_tagid, 1)

            history.append({
                "date": start_date.strftime("%Y-%m-%d"),
                "mtbf": mtbf,
                "utilization": utilization,
                "availability": availability
            })

        # Reverse so oldest date first
        history.reverse()
        return jsonify(history), 200

    except Exception as e:
        print(f"Error getting KPI history for unit {display_id}: {e}")
        return jsonify([]), 500

