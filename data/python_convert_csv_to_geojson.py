# /*******************************************
#  *  Lab1 SpaceTime
#  *  Dave Vanosdall
#  *  convert csv to geojson script used after downloading the data seperate but wanted to include for traceback
#  ******************************************/

# import csv
# import geojson

# # Define the input and output files
# input_files = [
#     'Atlanta.csv',
#     'Charlotte.csv',
#     'Chicago.csv',
#     'Cinci.csv',
#     'Dallas.csv',
#     'DC.csv',
#     'Denver.csv',
#     'KC.csv',
#     'LosAngeles.csv',
#     'Madison.csv',
#     'Miami.csv',
#     'NewYork.csv',
#     'Omaha.csv',
#     'Phoenix.csv',
#     'Seattle.csv'
# ]

# output_files = [file.replace('.csv', '.geojson') for file in input_files]

# # Loop through the input files
# for input_file, output_file in zip(input_files, output_files):
#     # Read the CSV file
#     with open(f'data/{input_file}', 'r') as csvfile:
#         reader = csv.DictReader(csvfile)
#         features = []
#         for row in reader:
#             # Create a GeoJSON feature
#             feature = {
#                 'type': 'Feature',
#                 'geometry': {
#                     'type': 'Point',
#                     'coordinates': [float(row['LONGITUDE']), float(row['LATITUDE'])]
#                 },
#                 'properties': row
#             }
#             features.append(feature)

#     # Create a GeoJSON feature collection
#     feature_collection = {
#         'type': 'FeatureCollection',
#         'features': features
#     }

#     # Write the GeoJSON file
#     with open(f'data/{output_file}', 'w') as geojsonfile:
#         geojson.dump(feature_collection, geojsonfile)

# Merge into 1 file
import csv
import geojson
import os

# Directory containing CSV files
input_dir = 'data/'
output_file = 'data/weather_data.geojson'  # Final merged GeoJSON file

# Fields to be converted to float
numeric_fields = [
    "LATITUDE", "LONGITUDE", "ELEVATION", "TEMP", "TEMP_ATTRIBUTES", "DEWP", "DEWP_ATTRIBUTES",
    "SLP", "SLP_ATTRIBUTES", "STP", "STP_ATTRIBUTES", "VISIB", "VISIB_ATTRIBUTES", "WDSP",
    "WDSP_ATTRIBUTES", "MXSPD", "GUST", "MAX", "MAX_ATTRIBUTES", "MIN", "MIN_ATTRIBUTES",
    "PRCP", "PRCP_ATTRIBUTES", "SNDP"
]

features = []

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

# Create a GeoJSON FeatureCollection
feature_collection = {
    'type': 'FeatureCollection',
    'features': features
}

# Write merged GeoJSON file
with open(output_file, 'w') as geojsonfile:
    geojson.dump(feature_collection, geojsonfile, indent=2)

print(f" Merged GeoJSON saved as: {output_file}")