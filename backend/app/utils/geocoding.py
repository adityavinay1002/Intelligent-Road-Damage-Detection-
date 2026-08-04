import io
import json
import urllib.request
import urllib.error
from typing import Optional, Tuple, Dict
from PIL import Image, ExifTags
from backend.app.utils.logging_config import logger

def _convert_dms_to_dd(dms_value, ref: str) -> Optional[float]:
    """Convert Degrees Minutes Seconds tuple/rational to Decimal Degrees."""
    try:
        if not dms_value or len(dms_value) < 3:
            return None
        
        def parse_rational(val):
            if hasattr(val, 'numerator') and hasattr(val, 'denominator'):
                return float(val.numerator) / float(val.denominator) if val.denominator != 0 else 0.0
            if isinstance(val, (tuple, list)) and len(val) == 2 and val[1] != 0:
                return float(val[0]) / float(val[1])
            return float(val)

        deg = parse_rational(dms_value[0])
        minutes = parse_rational(dms_value[1])
        seconds = parse_rational(dms_value[2])

        dd = deg + (minutes / 60.0) + (seconds / 3600.0)
        if ref.upper() in ['S', 'W']:
            dd = -dd
        return round(dd, 6)
    except Exception as e:
        logger.debug(f"Failed to convert DMS to DD: {e}")
        return None

def extract_exif_gps(file_bytes: bytes) -> Tuple[Optional[float], Optional[float]]:
    """
    Extract Latitude and Longitude from image EXIF metadata if present.
    Returns (latitude, longitude) or (None, None) if not present or corrupt.
    Does NOT fail or raise exceptions.
    """
    try:
        img = Image.open(io.BytesIO(file_bytes))
        exif_data = img._getexif() if hasattr(img, '_getexif') and callable(img._getexif) else None
        if not exif_data:
            return None, None

        gps_info = {}
        for tag_id, value in exif_data.items():
            tag = ExifTags.TAGS.get(tag_id, tag_id)
            if tag == "GPSInfo" and isinstance(value, dict):
                for sub_id, sub_val in value.items():
                    sub_tag = ExifTags.GPSTAGS.get(sub_id, sub_id)
                    gps_info[sub_tag] = sub_val

        if not gps_info:
            return None, None

        lat_data = gps_info.get("GPSLatitude")
        lat_ref = gps_info.get("GPSLatitudeRef", "N")
        lon_data = gps_info.get("GPSLongitude")
        lon_ref = gps_info.get("GPSLongitudeRef", "E")

        if lat_data and lon_data:
            lat = _convert_dms_to_dd(lat_data, str(lat_ref))
            lon = _convert_dms_to_dd(lon_data, str(lon_ref))
            if lat is not None and lon is not None:
                logger.info(f"Extracted EXIF GPS coordinates: Lat={lat}, Lon={lon}")
                return lat, lon

        return None, None
    except Exception as e:
        logger.debug(f"EXIF parsing skipped or failed safely: {e}")
        return None, None

def reverse_geocode(lat: float, lon: float) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str], Optional[str]]:
    """
    Convert lat/lon into (road_name, city, state, country, location_formatted).
    Uses Nominatim API with fast timeout (2.0s).
    Returns (None, None, None, None, None) safely if network fails or timeout occurs.
    """
    if lat is None or lon is None:
        return None, None, None, None, None

    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "RoadVisionAI/1.0 (Road Damage Detection Pipeline)"}
    )

    try:
        with urllib.request.urlopen(req, timeout=2.0) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                address = data.get("address", {})
                
                road_name = (
                    address.get("road") or 
                    address.get("pedestrian") or 
                    address.get("highway") or 
                    address.get("suburb") or 
                    address.get("neighbourhood")
                )
                city = address.get("city") or address.get("town") or address.get("village") or address.get("county")
                state = address.get("state") or address.get("region")
                country = address.get("country")

                location_parts = [p for p in [road_name, city, state, country] if p]
                location_str = ", ".join(location_parts) if location_parts else f"Lat: {lat}, Lon: {lon}"

                logger.info(f"Reverse geocoded location: {location_str}")
                return road_name, city, state, country, location_str
    except Exception as e:
        logger.warning(f"Reverse geocoding request skipped/failed: {e}")
    
    # Fallback location string if reverse geocode service is unreachable
    location_str = f"Lat: {lat:.6f}, Lon: {lon:.6f}"
    return None, None, None, None, location_str
