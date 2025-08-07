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
        if tagid not in latest:
            latest[tagid] = {
                "unit": f"Unit {tagid}",
                "state_code": row["intvalue"],
                "state": MOORING_STATES.get(row["intvalue"], "Unknown"),
                "last_updated": row["t_stamp"]
            }

    conn.close()
    return jsonify(list(latest.values()))
