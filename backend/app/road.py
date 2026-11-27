import re
import time
from datetime import datetime, timezone, timedelta
from math import radians, sin, cos, sqrt, atan2
from typing import Any

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/road", tags=["Road Locations"])

OVERPASS_URLS = (
    "https://ovp.dresel.systems/api-na/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
)
CACHE_TTL = 1800
_cache: dict[str, tuple[float, dict]] = {}


class OverpassRequest(BaseModel):
    query: str = Field(min_length=1, max_length=50000)


def clean(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def normalized_address(tags: dict) -> str:
    """Build an address only from address fields supplied by OSM."""
    full = clean(tags.get("addr:full"))
    if full:
        return full

    street = clean(tags.get("addr:street"))
    number = clean(tags.get("addr:housenumber"))
    city = clean(tags.get("addr:city"))
    state = clean(tags.get("addr:state"))
    postcode = clean(tags.get("addr:postcode"))

    street_line = " ".join(part for part in (number, street) if part)
    locality = ", ".join(part for part in (city, state, postcode) if part)

    return ", ".join(part for part in (street_line, locality) if part)


def classify_location(tags: dict) -> str:
    """Classify truck-related locations using OSM tags."""
    values = " ".join(
        clean(tags.get(key))
        for key in (
            "name", "brand", "operator", "amenity", "shop",
            "craft", "highway", "service", "industrial",
            "man_made", "hgv",
        )
    ).lower()

    if (
        tags.get("amenity") == "vehicle_inspection"
        or tags.get("shop") == "vehicle_inspection"
        or tags.get("service:vehicle:inspection") == "yes"
        or tags.get("inspection") == "yes"
        or re.search(
            r"\b(dot inspection|vehicle inspection|truck inspection|"
            r"annual inspection|state inspection)\b",
            values,
        )
    ):
        return "inspection"

    if (
        tags.get("amenity") == "truck_stop"
        or tags.get("highway") == "services"
        or re.search(r"\b(truck stop|travel center|travel centre)\b", values)
    ):
        return "truck_stop"

    if (
        tags.get("highway") == "weigh_station"
        or tags.get("amenity") == "weighbridge"
        or tags.get("man_made") == "weighbridge"
        or re.search(
            r"\b(weigh station|weighbridge|cat scale|truck scale)\b",
            values,
        )
    ):
        return "scales"

    if tags.get("shop") in ("tyres", "tires") or re.search(
        r"\b(truck tire|commercial tire|tyre)\b", values
    ):
        return "tires"

    if tags.get("amenity") == "fuel" or "diesel" in values:
        return "fuel"

    if re.search(r"\b(towing|tow truck|heavy duty towing)\b", values):
        return "towing"

    if (
        tags.get("amenity") in ("vehicle_wash", "car_wash")
        or re.search(r"\b(truck wash|car wash)\b", values)
    ):
        return "wash"

    if (
        tags.get("shop") in ("car_parts", "truck_parts")
        or re.search(r"\b(truck parts|fleetpride)\b", values)
    ):
        return "parts"

    if (
        tags.get("amenity") == "parking"
        or tags.get("highway") == "rest_area"
    ):
        return "parking"

    if (
        tags.get("shop") in ("truck", "truck_repair", "car_repair")
        or tags.get("craft") == "mechanic"
        or re.search(
            r"\b(truck repair|diesel repair|heavy duty repair)\b",
            values,
        )
    ):
        return "repair"

    if "oil change" in values or "quick lube" in values:
        return "oil"

    return "other"

def element_coordinates(element: dict) -> tuple[float | None, float | None]:
    lat = element.get("lat")
    lon = element.get("lon")

    if lat is None or lon is None:
        center = element.get("center") or {}
        lat = center.get("lat", lat)
        lon = center.get("lon", lon)

    try:
        return float(lat), float(lon)
    except (TypeError, ValueError):
        return None, None


def quality_score(element: dict) -> int:
    tags = element.get("tags") or {}
    score = len(tags)
    score += 5 if tags.get("name") else 0
    score += 4 if normalized_address(tags) else 0
    score += 2 if tags.get("phone") or tags.get("contact:phone") else 0
    score += 2 if tags.get("website") or tags.get("contact:website") else 0
    return score


def distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius = 6371000

    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)

    a = (
        sin(d_lat / 2) ** 2
        + cos(radians(lat1))
        * cos(radians(lat2))
        * sin(d_lon / 2) ** 2
    )

    return earth_radius * 2 * atan2(sqrt(a), sqrt(1 - a))


def normalize_and_deduplicate(elements: list[dict]) -> list[dict]:
    by_osm_id = {}

    for element in elements:
        key = (element.get("type"), element.get("id"))
        current = by_osm_id.get(key)

        if current is None or quality_score(element) > quality_score(current):
            by_osm_id[key] = element

    unique = []

    for element in by_osm_id.values():
        tags = dict(element.get("tags") or {})
        lat, lon = element_coordinates(element)

        if lat is None or lon is None:
            continue

        category = classify_location(tags)
        name = clean(
            tags.get("name")
            or tags.get("brand")
            or tags.get("operator")
        ).lower()

        address = normalized_address(tags)

        normalized = dict(element)
        normalized["lat"] = lat
        normalized["lon"] = lon
        normalized["address"] = address
        normalized["category"] = category
        normalized["is_truck_stop"] = category == "truck_stop"

        tags["truckscope_category"] = category
        tags["truckscope_address"] = address
        tags["truckscope_is_truck_stop"] = (
            "yes" if category == "truck_stop" else "no"
        )
        normalized["tags"] = tags

        duplicate_index = None

        if name:
            for index, existing in enumerate(unique):
                existing_tags = existing.get("tags") or {}
                existing_name = clean(
                    existing_tags.get("name")
                    or existing_tags.get("brand")
                    or existing_tags.get("operator")
                ).lower()

                if (
                    existing_name == name
                    and existing["category"] == category
                    and distance_meters(
                        lat, lon, existing["lat"], existing["lon"]
                    ) <= 50
                ):
                    duplicate_index = index
                    break

        if duplicate_index is None:
            unique.append(normalized)
        elif quality_score(normalized) > quality_score(unique[duplicate_index]):
            unique[duplicate_index] = normalized

    return unique

@router.post("/overpass")
def get_overpass_locations(payload: OverpassRequest):
    query = payload.query.strip()
    now = time.time()

    cached = _cache.get(query)
    if cached and now - cached[0] < CACHE_TTL:
        return cached[1]

    errors = []

    for url in OVERPASS_URLS:
        try:
            response = requests.post(
                url,
                data={"data": query},
                headers={"User-Agent": "TruckScope/1.0"},
                timeout=(10, 210),
            )
            response.raise_for_status()
            data = response.json()

            if not isinstance(data, dict) or not isinstance(data.get("elements"), list):
                raise ValueError("Unexpected Overpass response")

            original_count = len(data["elements"])
            data["elements"] = normalize_and_deduplicate(data["elements"])

            data["truckscope_meta"] = {
                "source": url,
                "original_count": original_count,
                "result_count": len(data["elements"]),
                "duplicates_removed": original_count - len(data["elements"]),
                "cache_ttl_seconds": CACHE_TTL,
            }

            _cache[query] = (time.time(), data)

            if len(_cache) > 100:
                oldest_keys = sorted(
                    _cache, key=lambda key: _cache[key][0]
                )[:25]
                for key in oldest_keys:
                    _cache.pop(key, None)

            return data

        except (requests.RequestException, ValueError, TypeError) as exc:
            errors.append(f"{url}: {exc}")

    raise HTTPException(
        status_code=502,
        detail={
            "message": "All OpenStreetMap servers are temporarily unavailable",
            "errors": errors,
        },
    )

# TRUCKSCOPE_NWS_ALERTS_V1
NWS_ALERTS_URL = "https://api.weather.gov/alerts/active"
NWS_CACHE_TTL = 300
_nws_cache: dict[str, tuple[float, dict]] = {}


def _parse_alert_datetime(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None


def _geometry_center(geometry):
    """Approximate a map pin from GeoJSON coordinates."""
    if not isinstance(geometry, dict):
        return None, None

    points = []

    def walk(value):
        if not isinstance(value, list):
            return
        if (
            len(value) >= 2
            and isinstance(value[0], (int, float))
            and isinstance(value[1], (int, float))
        ):
            points.append((float(value[1]), float(value[0])))
            return
        for child in value:
            walk(child)

    walk(geometry.get("coordinates"))

    if not points:
        return None, None

    lat = sum(point[0] for point in points) / len(points)
    lon = sum(point[1] for point in points) / len(points)
    return round(lat, 5), round(lon, 5)


def _is_trucking_weather_alert(event):
    value = (event or "").lower()
    terms = (
        "storm", "tornado", "hurricane", "flood", "blizzard",
        "winter weather", "winter storm", "snow", "ice",
        "freezing", "wind", "fog", "thunderstorm", "heat",
        "cold", "coastal flood", "high surf", "fire weather",
    )
    return any(term in value for term in terms)


@router.get("/alerts")
def get_weather_alerts(
    hours: int = 48,
    limit: int = 200,
):
    """Return recent active US weather alerts from the official NWS API."""
    hours = max(1, min(hours, 48))
    limit = max(1, min(limit, 200))
    cache_key = f"{hours}:{limit}"
    now = time.time()

    cached = _nws_cache.get(cache_key)
    if cached and now - cached[0] < NWS_CACHE_TTL:
        return cached[1]

    try:
        response = requests.get(
            NWS_ALERTS_URL,
            headers={
                "User-Agent": "TruckScope/1.0",
                "Accept": "application/geo+json",
            },
            timeout=25,
        )
        response.raise_for_status()
        payload = response.json()

        if not isinstance(payload, dict):
            raise ValueError("Unexpected NWS response")

        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        alerts = []

        for feature in payload.get("features", []):
            props = feature.get("properties") or {}
            event = clean(props.get("event"))

            if not _is_trucking_weather_alert(event):
                continue

            issued = (
                _parse_alert_datetime(props.get("sent"))
                or _parse_alert_datetime(props.get("effective"))
            )
            if not issued or issued < cutoff:
                continue

            lat, lon = _geometry_center(feature.get("geometry"))

            alerts.append({
                "id": clean(feature.get("id") or props.get("id")),
                "type": "storm",
                "event": event,
                "title": clean(props.get("headline") or event)[:300],
                "description": clean(props.get("description"))[:1800],
                "instruction": clean(props.get("instruction"))[:1000],
                "area": clean(props.get("areaDesc"))[:500],
                "severity": clean(props.get("severity")),
                "urgency": clean(props.get("urgency")),
                "sent": issued.isoformat(),
                "effective": clean(props.get("effective")),
                "expires": clean(props.get("expires")),
                "lat": lat,
                "lon": lon,
                "url": (
                    clean(props.get("web"))
                    if clean(props.get("web")) not in {
                        "http://www.weather.gov",
                        "https://www.weather.gov",
                        "http://weather.gov",
                        "https://weather.gov",
                    }
                    else clean(feature.get("id"))
                ),
                "source": "National Weather Service",
            })

        alerts.sort(key=lambda item: item["sent"], reverse=True)

        result = {
            "alerts": alerts[:limit],
            "count": min(len(alerts), limit),
            "hours": hours,
            "source": "National Weather Service",
            "source_url": "https://www.weather.gov/",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "cache_ttl_seconds": NWS_CACHE_TTL,
        }

        _nws_cache[cache_key] = (now, result)

        if len(_nws_cache) > 20:
            oldest = sorted(
                _nws_cache,
                key=lambda key: _nws_cache[key][0],
            )[:5]
            for key in oldest:
                _nws_cache.pop(key, None)

        return result

    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"National Weather Service is temporarily unavailable: {exc}",
        ) from exc
    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not process National Weather Service data: {exc}",
        ) from exc
