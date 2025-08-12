from flask import Blueprint, jsonify
from mysql.connector import connect
from utils.mooring_states import MOORING_STATES

# Define blueprint
units_bp = Blueprint('units', __name__)

# DB connection to ignitiondb
def get_ignition_connection():
    return connect(
        host="127.0.0.1",
        user="root",
        password="U8NbpiQxGyemHJrB",
        database="ignitiondb"
    )

# Unit ID mapping: Display ID → DB tagid
UNIT_ID_MAPPING = {
    1: 1,  # Unit 1 → tagid 1
    2: 3,  # Unit 2 → tagid 3
}

def get_db_tagid(display_id):
    """Convert display unit ID to database tagid"""
    return UNIT_ID_MAPPING.get(display_id, display_id)

# Route to get latest states of Unit 1 and 2
@units_bp.route('/', methods=['GET'])
def get_unit_statuses():
    conn = get_ignition_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT tagid, intvalue, t_stamp
        FROM sqlt_data_1_2025_08
        WHERE tagid IN (1, 3)
        ORDER BY t_stamp DESC
    """

    cursor.execute(query)
    rows = cursor.fetchall()

    latest = {}
    for row in rows:
        tagid = row["tagid"]
        # Map DB tagid back to display ID
        display_id = 1 if tagid == 1 else 2 if tagid == 3 else tagid
        
        if tagid not in latest:
            latest[tagid] = {
                "tagid": tagid,
                "unit": f"Unit {display_id}",
                "state_code": row["intvalue"],
                "state": MOORING_STATES.get(row["intvalue"], "Unknown"),
                "last_updated": row["t_stamp"],
                "location": "Global Terminal 1",
                "serial_number": f"SN-{10000 + tagid}",
                "asset_type": "MM100",
                "installation_year": 2020,
                "sla_active": True,
                "commissioned_year": 2021,
                "site_name": "Global Terminal 1",
                "end_user": "Maritime Solutions Inc.",
                "country": "Global Region"
            }

    conn.close()
    return jsonify(list(latest.values()))

# Route to get individual unit data
@units_bp.route('/<int:display_id>', methods=['GET'])
def get_unit_status(display_id):
    # Convert display ID to DB tagid
    db_tagid = get_db_tagid(display_id)
    
    conn = get_ignition_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT tagid, intvalue, t_stamp
        FROM sqlt_data_1_2025_08
        WHERE tagid = %s
        ORDER BY t_stamp DESC
        LIMIT 1
    """

    cursor.execute(query, (db_tagid,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"error": "Unit not found"}), 404

    unit_data = {
        "tagid": row["tagid"],
        "unit": f"Unit {display_id}",
        "state_code": row["intvalue"],
        "state": MOORING_STATES.get(row["intvalue"], "Unknown"),
        "last_updated": row["t_stamp"],
        "location": "Global Terminal 1",
        "serial_number": f"SN-{10000 + db_tagid}",
        "asset_type": "MM100",
        "installation_year": 2020,
        "sla_active": True,
        "commissioned_year": 2021,
        "site_name": "Global Terminal 1",
        "end_user": "Maritime Solutions Inc.",
        "country": "Global Region"
    }

    conn.close()
    return jsonify(unit_data)

# Route to get unit state history
@units_bp.route('/<int:display_id>/history', methods=['GET'])
def get_unit_history(display_id):
    # Convert display ID to DB tagid
    db_tagid = get_db_tagid(display_id)
    
    conn = get_ignition_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT t_stamp, intvalue
        FROM sqlt_data_1_2025_08
        WHERE tagid = %s
        AND t_stamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY t_stamp DESC
        LIMIT 100
    """

    cursor.execute(query, (db_tagid,))
    rows = cursor.fetchall()

    history = []
    for row in rows:
        history.append({
            "timestamp": row["t_stamp"],
            "state_code": row["intvalue"],
            "duration": 0  # Duration calculation can be added later
        })

    conn.close()
    return jsonify(history)
