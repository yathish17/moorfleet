from flask import Blueprint, jsonify, request
from db import get_connection
from datetime import datetime, timedelta, timezone

alarms_bp = Blueprint("alarms", __name__, url_prefix="/api/alarms")

# Unit ID mapping: Display ID → DB tagid
UNIT_ID_MAPPING = {
    1: 1,  # Unit 1 → tagid 1
    2: 3,  # Unit 2 → tagid 3
}

def get_db_tagid(display_id):
    """Convert display unit ID to database tagid"""
    return UNIT_ID_MAPPING.get(display_id, display_id)

def get_display_id(db_tagid):
    """Convert database tagid to display unit ID"""
    if db_tagid == 1:
        return 1
    elif db_tagid == 3:
        return 2
    return db_tagid

# Priority mapping
PRIORITY_MAP = {
    0: "diagnostic",
    1: "low",
    2: "medium",
    3: "high",
    4: "critical"
}

# Event type mapping
EVENTTYPE_MAP = {
    0: "created",
    1: "cleared",
    2: "acknowledged"
}

def clean_alarm_name(source):
    try:
        return source.split(":/alm:")[1]
    except IndexError:
        return source

def extract_unit_id(source):
    """Extract unit ID from alarm source and convert to display ID"""
    try:
        if "MoorUnit1" in source or "U1" in source:
            return 1
        elif "MoorUnit2" in source or "U2" in source:
            return 2
        elif "Ux" in source:
            # Ux alarms might be for Unit 2 (tagid 3 in DB)
            return 2
        else:
            return None
    except:
        return None

def time_ago(eventtime):
    # Make eventtime timezone-aware (local -> UTC)
    if eventtime.tzinfo is None:
        eventtime = eventtime.replace(tzinfo=timezone.utc)  # If stored in UTC
        # If stored in local time (e.g., Asia/Kolkata), use:
        # from pytz import timezone as tz
        # eventtime = tz("Asia/Kolkata").localize(eventtime).astimezone(timezone.utc)

    now = datetime.now(timezone.utc)  # UTC now
    diff = now - eventtime
    seconds = int(diff.total_seconds())

    if seconds < 0:  # in case of small future offset, make it positive
        seconds = abs(seconds)

    if seconds < 60:
        return f"{seconds} sec ago"
    elif seconds < 3600:
        return f"{seconds // 60} min ago"
    elif seconds < 86400:
        return f"{seconds // 3600} hr ago"
    else:
        return f"{seconds // 86400} days ago"

@alarms_bp.route("/recent", methods=['GET'])
def recent_all_units():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, source, priority, eventtime, eventtype
        FROM ignitiondb.alarm_events
        WHERE source NOT LIKE %s
        ORDER BY eventtime DESC
        LIMIT 10
    """, ("%Ramp/Ramp3:/alm:High Alarm%",))
    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "id": row["id"],
            "message": clean_alarm_name(row["source"]),
            "priority": PRIORITY_MAP.get(row["priority"], "unknown"),
            "status": EVENTTYPE_MAP.get(row["eventtype"], "unknown"),
            "timestamp": row["eventtime"].strftime("%Y-%m-%d %H:%M:%S"),
            "timeAgo": time_ago(row["eventtime"]),
            "unitId": extract_unit_id(row["source"])
        }
        for row in rows
    ])

@alarms_bp.route("/recent/<int:display_id>", methods=['GET'])
def recent_for_unit(display_id):
    # Convert display ID to DB tagid
    db_tagid = get_db_tagid(display_id)
    
    print(f"DEBUG: Display ID {display_id} mapped to DB tagid {db_tagid}")
    
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Try multiple patterns to find Unit 2 alarms
    query = """
        SELECT id, source, priority, eventtime, eventtype
        FROM ignitiondb.alarm_events
        WHERE (source LIKE %s OR source LIKE %s OR source LIKE %s)
          AND source NOT LIKE %s
        ORDER BY eventtime DESC
        LIMIT 10
    """
    
    # Search for Unit 2 alarms using multiple patterns
    search_patterns = [
        f"%MoorUnit{db_tagid}/%",  # MoorUnit3/
        f"%U2%",                    # U2 in source
        f"%Ux%"                     # Ux in source (might be Unit 2)
    ]
    
    cursor.execute(query, (*search_patterns, "%Ramp/Ramp3:/alm:High Alarm%"))
    rows = cursor.fetchall()
    
    print(f"DEBUG: Found {len(rows)} alarms for Unit {display_id} (DB tagid {db_tagid})")
    for row in rows:
        print(f"DEBUG: Alarm source: {row['source']}")
    
    conn.close()

    return jsonify([
        {
            "id": row["id"],
            "message": clean_alarm_name(row["source"]),
            "priority": PRIORITY_MAP.get(row["priority"], "unknown"),
            "status": EVENTTYPE_MAP.get(row["eventtype"], "unknown"),
            "timestamp": row["eventtime"].strftime("%Y-%m-%d %H:%M:%S"),
            "timeAgo": time_ago(row["eventtime"]),
            "unitId": display_id  # Return the display ID, not the DB tagid
        }
        for row in rows
    ])

@alarms_bp.route("/<int:alarm_id>/acknowledge", methods=['POST'])
def acknowledge_alarm(alarm_id):
    """Acknowledge an alarm"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Update alarm event type to acknowledged (2)
        cursor.execute("""
            UPDATE ignitiondb.alarm_events 
            SET eventtype = 2 
            WHERE id = %s
        """, (alarm_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Alarm not found"}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "Alarm acknowledged"})
        
    except Exception as e:
        print(f"Error acknowledging alarm: {e}")
        return jsonify({"error": "Failed to acknowledge alarm"}), 500

@alarms_bp.route("/<int:alarm_id>/clear", methods=['POST'])
def clear_alarm(alarm_id):
    """Clear an alarm"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Update alarm event type to cleared (1)
        cursor.execute("""
            UPDATE ignitiondb.alarm_events 
            SET eventtype = 1 
            WHERE id = %s
        """, (alarm_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Alarm not found"}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True, "message": "Alarm cleared"})
        
    except Exception as e:
        print(f"Error clearing alarm: {e}")
        return jsonify({"error": "Failed to clear alarm"}), 500
