import math
from typing import Optional


def haversine_distance(
    lat1: float, lon1: float,
    lat2: float, lon2: float
) -> float:
    """Ikki nuqta orasidagi masofani km da hisoblaydi (Haversine formulasi)."""
    R = 6371  # Yer radiusi km

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi    = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = (math.sin(d_phi / 2) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def filter_by_radius(queryset, lat: float, lon: float, radius_km: float) -> list:
    """
    radius_km ichidagi yozuvlarni qaytaradi.
    NannyProfile queryset uchun — latitude va longitude field kerak.

    Optimizatsiya:
      1. SQL bounding-box filter — barcha satrlarni yuklamaslik uchun
      2. Python Haversine — aniq masofa tekshiruvi
    """
    # 1 daraja kenglik ≈ 111 km; uzunlik delta — kenglikka bog'liq
    lat_delta = radius_km / 111.0
    lon_delta = radius_km / max(111.0 * math.cos(math.radians(lat)), 0.001)

    # Bounding box — SQL da pre-filter
    queryset = queryset.filter(
        latitude__isnull=False,
        longitude__isnull=False,
        latitude__gte=lat - lat_delta,
        latitude__lte=lat + lat_delta,
        longitude__gte=lon - lon_delta,
        longitude__lte=lon + lon_delta,
    )

    # Aniq Haversine tekshiruvi
    results = []
    for obj in queryset:
        dist = haversine_distance(lat, lon, float(obj.latitude), float(obj.longitude))
        if dist <= radius_km:
            obj.distance_km = round(dist, 1)
            results.append(obj)

    results.sort(key=lambda x: x.distance_km)
    return results
