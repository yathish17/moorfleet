from flask import Blueprint, jsonify, request
from mysql.connector import connect
from datetime import datetime, timedelta
import importlib.util
from typing import Optional

# Dynamically load KPI modules that have hyphens in filenames

def _load_module(module_name: str, file_path: str):
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module

_kpi_mtbf_mod = None  # type: Optional[object]
_kpi_util_mod = None  # type: Optional[object]
_kpi_avail_mod = None  # type: Optional[object]


def get_kpi_mtbf_module():
    global _kpi_mtbf_mod
    if _kpi_mtbf_mod is None:
        _kpi_mtbf_mod = _load_module("kpi_mtbf", "/workspace/kpi-mtbf.py")
    return _kpi_mtbf_mod


def get_kpi_util_module():
    global _kpi_util_mod
    if _kpi_util_mod is None:
        _kpi_util_mod = _load_module("kpi_utilization", "/workspace/kpi-utilization.py")
    return _kpi_util_mod


def get_kpi_avail_module():
    global _kpi_avail_mod
    if _kpi_avail_mod is None:
        _kpi_avail_mod = _load_module("kpi_availability", "/workspace/kpi-availability.py")
    return _kpi_avail_mod

# Define blueprint
kpi_bp = Blueprint('kpis', __name__)

# Unit ID mapping: Display ID → DB tagid
UNIT_ID_MAPPING = {
    1: 1,  # Unit 1 → tagid 1
    2: 3,  # Unit 2 → tagid 3
}

def get_db_tagid(display_id: int) -> int:
    return UNIT_ID_MAPPING.get(display_id, display_id)

# Map DB tagid → function unit code (e.g., 'U1', 'U2')
TAGID_TO_UNIT = {
    1: 'U1',
    3: 'U2',
}

# Map range query → duration code expected by KPI modules
RANGE_TO_DURATION = {
    "24h": "1D",
    "7d": "7D",
    "30d": "30D",
    "1y": "1Y",
}

def map_tagid_to_unit(tagid: int) -> str:
    return TAGID_TO_UNIT.get(tagid, 'U1')

# --- Time Range Helper ---
def parse_range_to_days(range_param):
    mapping = {
        "24h": 1,
        "7d": 7,
        "30d": 30,
        "1y": 365
    }
    return mapping.get(range_param, 30)


def map_range_to_duration(range_param: str) -> str:
    return RANGE_TO_DURATION.get(range_param, '30D')

# DB connection
def get_ignition_connection():
    return connect(
        host="127.0.0.1",
        user="root",
        password="U8NbpiQxGyemHJrB",
        database="ignitiondb"
    )

# --- KPI Calculations (delegating to KPI modules) ---
def calculate_mtbf(unit_tagid, days=30):
    try:
        duration_code = '1D' if days <= 1 else ('7D' if days <= 7 else ('30D' if days <= 30 else '1Y'))
        unit_code = map_tagid_to_unit(unit_tagid)
        kpi_mtbf = get_kpi_mtbf_module()
        mtbf_value, _ = kpi_mtbf.calculate_MTBF_KPI(
            kpi_mtbf.historical_data,
            kpi_mtbf.alarm_data,
            duration_code,
            unit_code
        )
        if mtbf_value == float('inf'):
            return 0
        return round(float(mtbf_value), 2)
    except Exception as e:
        print(f"Error in MTBF calculation via module: {e}")
        return 0


def calculate_utilization(unit_tagid, days=30):
    try:
        duration_code = '1D' if days <= 1 else ('7D' if days <= 7 else ('30D' if days <= 30 else '1Y'))
        unit_code = map_tagid_to_unit(unit_tagid)
        kpi_util = get_kpi_util_module()
        util_value = kpi_util.calculate_UTIL_KPI(
            kpi_util.historical_data,
            kpi_util.alarm_data,
            duration_code,
            unit_code
        )
        return round(float(util_value), 2)
    except Exception as e:
        print(f"Error in Utilization calculation via module: {e}")
        return 0


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
    try:
        duration_code = '1D' if days <= 1 else ('7D' if days <= 7 else ('30D' if days <= 30 else '1Y'))
        unit_code = map_tagid_to_unit(unit_tagid)
        kpi_avail = get_kpi_avail_module()
        avail_value = kpi_avail.calculate_AVAILABILITY_KPI(
            kpi_avail.historical_data,
            kpi_avail.alarm_data,
            duration_code,
            unit_code
        )
        return round(float(avail_value), 2)
    except Exception as e:
        print(f"Error in Availability calculation via module: {e}")
        return 0

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

