from flask import Blueprint, jsonify
from db import get_connection
from datetime import datetime, timedelta, timezone

alarms_bp = Blueprint("alarms", __name__, url_prefix="/api/alarms")

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

@alarms_bp.route("/recent", methods=["GET"])
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
            "timeAgo": time_ago(row["eventtime"])
        }
        for row in rows
    ])

@alarms_bp.route("/recent/<int:unit_id>", methods=["GET"])
def recent_for_unit(unit_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, source, priority, eventtime, eventtype
        FROM ignitiondb.alarm_events
        WHERE source LIKE %s
          AND source NOT LIKE %s
        ORDER BY eventtime DESC
        LIMIT 10
    """, (f"%MoorUnit{unit_id}/%", "%Ramp/Ramp3:/alm:High Alarm%"))
    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "id": row["id"],
            "message": clean_alarm_name(row["source"]),
            "priority": PRIORITY_MAP.get(row["priority"], "unknown"),
            "status": EVENTTYPE_MAP.get(row["eventtype"], "unknown"),
            "timestamp": row["eventtime"].strftime("%Y-%m-%d %H:%M:%S"),
            "timeAgo": time_ago(row["eventtime"])
        }
        for row in rows
    ])
