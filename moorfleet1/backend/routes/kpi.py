# routes/kpi.py
from flask import Blueprint, jsonify, request
from kpi_calculations.kpi_availability import calculate_AVAILABILITY_KPI as availability_kpi
from kpi_calculations.kpi_mtbf import calculate_MTBF_KPI as mtbf_kpi
from kpi_calculations.kpi_utilization import calculate_UTIL_KPI as utilization_kpi
from routes.units import get_all_unit_ids  # for all-units route
from datetime import datetime, timedelta

kpi_bp = Blueprint("kpis", __name__)

# Duration normalization map
dur_map = {
    "24h": "1D", 
    "7d": "7D", 
    "30d": "30D", 
    "12M": "1Y"
}

# helper to normalize unit IDs
def normalize_unit_id(unit_id: str) -> str:
    """Convert '1' → 'U1', '2' → 'U2', otherwise return as-is."""
    if unit_id.isdigit():
        return f"U{unit_id}"
    return unit_id

@kpi_bp.route("/", methods=["GET"])
def get_all_kpis():
    """Return KPI data for all units when ?range=<duration> is provided."""
    try:
        duration = request.args.get("range", "30D")
        dur = dur_map.get(duration, duration)

        all_units = []
        for unit in get_all_unit_ids():
            norm_unit = normalize_unit_id(str(unit))
            availability = availability_kpi(dur, norm_unit)
            mtbf_value, mtbf_params = mtbf_kpi(dur, norm_unit)
            utilization = utilization_kpi(dur, norm_unit)
            all_units.append({
                "unit": norm_unit,
                "duration": dur,
                "availability": availability,
                "mtbf": mtbf_value,
                "mtbf_details": mtbf_params,
                "utilization": utilization
            })

        return jsonify(all_units)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@kpi_bp.route("/<unit_id>/<duration>", methods=["GET"])
def get_kpis(unit_id, duration):
    """Return KPI data for a single unit (numeric or string)."""
    try:
        dur = dur_map.get(duration, duration)
        norm_unit = normalize_unit_id(unit_id)
        availability = availability_kpi(dur, norm_unit)
        mtbf_value, mtbf_params = mtbf_kpi(dur, norm_unit)
        utilization = utilization_kpi(dur, norm_unit)

        return jsonify({
            "unit": norm_unit,
            "duration": dur,
            "availability": availability,
            "mtbf": mtbf_value,
            "mtbf_details": mtbf_params,
            "utilization": utilization
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@kpi_bp.route("/<unit_id>/history", methods=["GET"])
def get_kpi_history(unit_id):
    """
    Return historical KPI data for charts.
    Optional query param: range=1D|7D|30D|1Y (default 30D)
    Output: [{timestamp, uptime, utilization, mtbf}, ...]
    """
    try:
        duration = request.args.get("range", "30D")
        dur = dur_map.get(duration, duration)
        norm_unit = normalize_unit_id(unit_id)

        # Define start date based on range
        now = datetime.utcnow()
        if dur == "1D":
            start_time = now - timedelta(days=1)
            step = timedelta(hours=1)  # hourly points
        elif dur == "7D":
            start_time = now - timedelta(days=7)
            step = timedelta(days=1)   # daily points
        elif dur == "30D":
            start_time = now - timedelta(days=30)
            step = timedelta(days=1)
        elif dur == "1Y":
            start_time = now - timedelta(days=365)
            step = timedelta(days=30)  # monthly-ish
        else:
            return jsonify({"error": f"Invalid range: {duration}"}), 400

        # Build time series
        history = []
        current_time = start_time
        while current_time <= now:
            # For each time slice, run KPI calculations
            avail = availability_kpi(dur, norm_unit, end_time=current_time)
            mtbf_val, _ = mtbf_kpi(dur, norm_unit, end_time=current_time)
            util = utilization_kpi(dur, norm_unit, end_time=current_time)

            history.append({
                "timestamp": current_time.isoformat(),
                "uptime": avail,
                "mtbf": mtbf_val,
                "utilization": util
            })
            current_time += step

        return jsonify(history)

    except Exception as e:
        return jsonify({"error": str(e)}), 500