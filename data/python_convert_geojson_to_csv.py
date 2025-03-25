import csv
import geojson
import os

# Directory containing CSV files
input_dir = 'data/'
output_geojson_file = 'data/weather_data.geojson'  # Final merged GeoJSON file
output_csv_file = 'data/weather_data.csv'  # CSV output file

# Fields to be converted to float
numeric_fields = [
    "LATITUDE", "LONGITUDE", "ELEVATION", "TEMP", "TEMP_ATTRIBUTES", "DEWP", "DEWP_ATTRIBUTES",
    "SLP", "SLP_ATTRIBUTES", "STP", "STP_ATTRIBUTES", "VISIB", "VISIB_ATTRIBUTES", "WDSP",
    "WDSP_ATTRIBUTES", "MXSPD", "GUST", "MAX", "MAX_ATTRIBUTES", "MIN", "MIN_ATTRIBUTES",
    "PRCP", "PRCP_ATTRIBUTES", "SNDP"
]

features = []
csv_rows = []
csv_headers = set()

# Loop through all CSV files in the directory
for filename in os.listdir(input_dir):
    if filename.endswith('.csv'):
        city_name = filename.replace('.csv', '')  # Extract city name

        with open(os.path.join(input_dir, filename), 'r') as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                # Convert numeric fields
                for field in numeric_fields:
                    if field in row:
                        try:
                            row[field] = float(row[field].strip()) if row[field].strip() not in ["", "999.9", "9999.9"] else None
                        except ValueError:
                            row[field] = None

                # Create GeoJSON feature
                feature = {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [row["LONGITUDE"], row["LATITUDE"]]
                    },
                    'properties': {
                        'CITY': city_name,
                        **row  # Include all properties
                    }
                }
                features.append(feature)

                # Prepare CSV data
                row['CITY'] = city_name  # Add city name to row
                csv_rows.append(row)
                csv_headers.update(row.keys())

# Create a GeoJSON FeatureCollection
feature_collection = {
    'type': 'FeatureCollection',
    'features': features
}

# Write merged GeoJSON file
with open(output_geojson_file, 'w') as geojsonfile:
    geojson.dump(feature_collection, geojsonfile, indent=2)

print(f"Merged GeoJSON saved as: {output_geojson_file}")

# Write CSV file
with open(output_csv_file, 'w', newline='') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=sorted(csv_headers))
    writer.writeheader()
    writer.writerows(csv_rows)

print(f"Merged CSV saved as: {output_csv_file}")