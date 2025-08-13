from datetime import timedelta

# Canonical duration codes
DUR_MAP = {
    "24h": "1D", "1d": "1D", "1D": "1D",
    "7d": "7D", "7D": "7D",
    "30d": "30D", "30D": "30D",
    "12M": "1Y", "1y": "1Y", "1Y": "1Y"
}

# Timedelta values for canonical codes
DUR_TO_DELTA = {
    "1D": timedelta(days=1),
    "7D": timedelta(days=7),
    "30D": timedelta(days=30),
    "1Y": timedelta(days=365)
}

def normalize_duration(duration_str: str) -> str:
    """Convert duration alias to canonical key (default to 30D)."""
    return DUR_MAP.get(duration_str, "30D")

def get_duration_delta(duration_str: str):
    """Return timedelta for given duration alias."""
    return DUR_TO_DELTA[normalize_duration(duration_str)]
