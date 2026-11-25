import requests
import sys

API_URL = "https://data.transportation.gov/resource/az4n-8mr2.json"
COLUMNS_URL = "https://data.transportation.gov/api/views/az4n-8mr2/columns.json"

CORE_FIELDS = [
    "dot_number",
    "legal_name",
    "phy_city",
    "phy_state",
    "phy_country",
    "truck_units",
    "power_units",
    "total_drivers",
    "status_code",
    "classdef",
    "carship",
]


def get_real_columns():
    response = requests.get(COLUMNS_URL, timeout=60)
    response.raise_for_status()

    columns = response.json()
    return {
        column["fieldName"]
        for column in columns
        if column.get("fieldName")
    }


def main():
    print("\nTRUCKSCOPE - FMCSA COMPANY PREVIEW")
    print("=" * 65)

    try:
        print("Discovering FMCSA columns from metadata...")

        available_columns = get_real_columns()

        missing = [
            field for field in CORE_FIELDS
            if field not in available_columns
        ]

        if missing:
            raise ValueError(
                f"Missing required FMCSA columns: {missing}"
            )

        cargo_fields = sorted(
            field for field in available_columns
            if field.startswith("crgo_")
        )

        select_fields = CORE_FIELDS + cargo_fields

        params = {
            "$select": ",".join(select_fields),
            "$where": """
                status_code = 'A'
                AND truck_units::number BETWEEN 6 AND 1900
                AND power_units::number BETWEEN 6 AND 1900
                AND total_drivers::number >= 6
                AND phy_country = 'US'
                AND classdef LIKE '%AUTHORIZED FOR HIRE%'
                AND carship LIKE '%C%'
            """,
            "$order": "truck_units::number DESC",
            "$limit": 100,
        }

        print("\nFilters:")
        print("Trucks: 6-1,900")
        print("Power Units: 6-10,000")
        print("Total Drivers: 6+")
        print("Status: Active")
        print("Country: USA")
        print("Classification: Authorized for Hire")
        print("Carrier type: C")
        print("=" * 65)

        response = requests.get(
            API_URL,
            params=params,
            timeout=120,
        )
        response.raise_for_status()

        companies = response.json()

    except requests.RequestException as error:
        print(f"\nFMCSA CONNECTION ERROR: {error}")
        if error.response is not None:
            print(error.response.text)
        sys.exit(1)

    except (ValueError, KeyError) as error:
        print(f"\nFMCSA DATA ERROR: {error}")
        sys.exit(1)

    print(f"\nCompanies in preview: {len(companies)}")
    print("=" * 65)

    for company in companies:
        print(f"\nUSDOT: {company.get('dot_number')}")
        print(f"Name: {company.get('legal_name')}")
        print(
            f"Location: {company.get('phy_city')}, "
            f"{company.get('phy_state')}"
        )
        print(f"Trucks: {company.get('truck_units')}")
        print(f"Power Units: {company.get('power_units')}")
        print(f"Total Drivers: {company.get('total_drivers')}")
        print(f"Classification: {company.get('classdef')}")
        print(f"Carrier Operation: {company.get('carship')}")

        print("Cargo types:")
        found = False

        for field in cargo_fields:
            value = company.get(field)

            if value and str(value).strip().upper() == "X":
                print(f"  - {field}")
                found = True

        if not found:
            print("  No cargo information listed")

        print("-" * 65)


if __name__ == "__main__":
    main()
