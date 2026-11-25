import json
import urllib.parse
import urllib.request

BASE_URL = "https://data.transportation.gov/resource/az4n-8mr2.json"

params = {
    "$select": (
        "dot_number,legal_name,"
        "truck_units,power_units,fleetsize,"
        "total_drivers,total_cdl,"
        "carrier_operation,classdef,"
        "mcs150_date,status_code"
    ),
    "$where": (
        "dot_number IN ('2952626','3235908','3382630',"
        "'3313326','2858485','3319088')"
    ),
    "$limit": "20"
}

url = BASE_URL + "?" + urllib.parse.urlencode(params)

request = urllib.request.Request(
    url,
    headers={"User-Agent": "TruckScope/1.0"}
)

try:
    with urllib.request.urlopen(request, timeout=60) as response:
        records = json.loads(response.read().decode("utf-8"))

    for record in records:
        print("=" * 60)
        for key, value in record.items():
            print(f"{key}: {value}")

except Exception as error:
    print("FMCSA API error:", error)
