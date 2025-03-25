/*******************************************
*  Activity 9: D3 Basemap
*  Dave Vanosdall
*  Simplify your spatial data and convert it to TopoJSON format.
*  Use Promise.all() to load your spatial data TopoJSON files and multivariate attribute CSV file into your main.js script.
*  Choose a projection to use with your choropleth map and create the appropriate D3 projection generator.
*  Add appropriate styles in style.css, which may include a graticule.
*  Commit and sync your unit-3 directory (including the TopoJSON) with the commit message "Activity 9".

******************************************/
// Wait until the webpage is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function () {
    // Your code here
    const width = 960;
    const height = 600;

    // Create an SVG container
    const svg = d3.select("#map")
        .attr("width", width)
        .attr("height", height);

    // Define a projection to convert geographic coordinates to pixel coordinates
    const projection = d3.geoAlbersUsa()
        .scale(1000) // Decrease the scale to make the states smaller
        .translate([width / 2, height / 2]); // Center the map in the SVG container

    // Define a path generator based on the projection
    const path = d3.geoPath().projection(projection);

    // Load the TopoJSON data and CSV data
    Promise.all([
        d3.json("data/ne_110m_admin_1_states_provinces.topojson"),
        d3.json("data/ne_10m_admin_2_counties.topojson"),
        d3.csv("data/weather_data.csv")
    ]).then(([world, countiesTopojson, weatherData]) => {
        // Log the data to the console to ensure it's loaded correctly
        console.log(world);
        console.log(countiesTopojson);
        console.log(weatherData);

        // Convert the TopoJSON to GeoJSON format for easier manipulation with D3
        const states = topojson.feature(world, world.objects.ne_110m_admin_1_states_provinces).features;
        const counties = topojson.feature(countiesTopojson, countiesTopojson.objects.ne_10m_admin_2_counties).features;

        // Add CRS information to the GeoJSON features
        states.forEach(feature => {
            feature.crs = {
                type: "name",
                properties: {
                    name: "EPSG:4326"
                }
            };
        });
        counties.forEach(feature => {
            feature.crs = {
                type: "name",
                properties: {
                    name: "EPSG:4326"
                }
            };
        });

        // Draw the counties
        const countyG = svg.selectAll(".county")
            .data(counties)
            .enter()
            .append("g")
            .attr("class", "county");

        countyG.append("path")
            .attr("d", path)
            .style("fill", "#ddd")
            .style("stroke", "#fff");

        // Draw the states
        const g = svg.selectAll(".state")
            .data(states)
            .enter()
            .append("g")
            .attr("class", "state");

        g.append("path")
            .attr("d", path)
            .style("fill", "rgba(204, 204, 204, 0.5)")
            .style("stroke", "#fff")
            .style("stroke-width", 2);

        // Add a graticule to the map
        const graticule = d3.geoGraticule()
            .step([10, 10]);
        svg.append("path")
            .datum(graticule)
            .attr("d", path)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 0.5)
            .attr("fill", "none");

        // You can now add the weather data on top of the map if needed (e.g., using circles for cities)
        svg.selectAll(".city")
            .data(weatherData)
            .enter()
            .append("circle")
            .attr("class", "city")
            .attr("cx", function (d) { return projection([d.LONGITUDE, d.LATITUDE])[0]; })  // Longitude, Latitude
            .attr("cy", function (d) { return projection([d.LONGITUDE, d.LATITUDE])[1]; })
            .attr("r", 5)  // Adjust the size of the circles
            .style("fill", "red");  // You can adjust color based on temperature or another variable
    });
});
