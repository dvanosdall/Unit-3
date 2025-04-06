/*******************************************
*  Activity 10: D3 Basemap
*  Dave Vanosdall
*  Join your CSV attribute data to your GeoJSON geospatial data and map one of the attributes in your Activity 9 basemap as a choropleth.
*  Create a coordinated visualization that supports your choropleth map by providing a sensible alternative view of the data.
*  Annotated your coordinated visualization with a title, and either value labels or one or more axes.
*  Commit and sync your unit-3 directory with the commit message "Activity 10".

******************************************/
// Wait until the webpage is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function () {
    const paramList = ["TEMP", "DEWP", "VISIB", "WDSP", "PRCP"];

    // Define the mapping for parameter names
    const paramTextMap = {
        "TEMP": "Temperature (°F)",
        "DEWP": "Dewpoint (°F)",
        "VISIB": "Visibility (miles)",
        "WDSP": "Wind Speed (mph)",
        "SLP": "Sea Level Pressure (mb)",
        "PRCP": "Precipitation (in)"
    };

    let currentParam = "TEMP";

    // Function to update the text based on currentParam
    function updateParamText() {
        const paramText = paramTextMap[currentParam];
        d3.select("#param-text").text(paramText);
    }

    // Call the function to update the initial text
    updateParamText();

    // Create color scales for each parameter
    const colorScales = {
        TEMP: d3.scaleSequential(d3.interpolateReds),
        DEWP: d3.scaleSequential(d3.interpolateBlues),
        VISIB: d3.scaleSequential(d3.interpolateOranges),
        WDSP: d3.scaleSequential(d3.interpolateGreys),
        PRCP: d3.scaleSequential(d3.interpolateGreens)
    };

    const barWidth = 960;
    const barHeight = 300;
    const barSvg = d3.select("#barchart").attr("width", barWidth).attr("height", barHeight);
    let uniqueCities;

    /************************************
    ************ Promise ***********
    **************************************/
    Promise.all([
        d3.json("data/ne_10m_admin_2_counties.topojson"),
        d3.csv("data/weather_data.csv", d3.autoType)
    ]).then(([topojsonData, weatherData]) => {
        let counties = topojson.feature(topojsonData, topojsonData.objects.ne_10m_admin_2_counties).features;

        // Define the geographic projection for the map
        const width = 960;
        const height = 600;
        const shiftX = 0;
        const shiftY = -10;
        const svg = d3.select("#map").attr("width", width).attr("height", height);

        // Create the title text
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .style("fill", "black")
            .text("United States and County Borders Topojson - 15 Cities from CSV");


        // Use Albers USA projection and translate it to center both horizontally and vertically
        const path = d3.geoPath().projection(
            d3.geoAlbersUsa()
                .scale(1000)
                .translate([width / 2 + shiftX, height / 2 + shiftY]))

        // Create graticules for latitudes and longitudes
        const graticule = d3.geoGraticule();

        // Add the graticules to the SVG (grid lines)
        svg.append("g")
            .selectAll("path")
            .data(graticule.lines())
            .enter()
            .append("path")
            .attr("class", "graticule")
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 0.5);

        const cityLayer = svg.append("g").attr("class", "city-layer");
        cityLayer.raise();

        // Add nearest city weather data to counties
        counties.forEach(county => {
            let countyCentroid;

            // Check if the county has valid geometry
            if (county.geometry && county.geometry.coordinates && county.geometry.coordinates.length > 0) {
                countyCentroid = path.centroid(county);
            } else {
                // Fallback to the latitude/longitude if geometry is missing
                countyCentroid = [county.properties.longitude, county.properties.latitude];
            }

            // Ensure the centroid coordinates are valid
            if (countyCentroid.every(coord => !isNaN(coord))) {
                const [x, y] = d3.geoAlbersUsa().invert(countyCentroid);

                // Find the closest city to this county (only if valid coordinates)
                let closestCity = weatherData.reduce((closest, city) => {
                    const dist = Math.hypot(city.LONGITUDE - x, city.LATITUDE - y);
                    return !closest || dist < closest.dist ? { ...city, dist } : closest;
                }, null);

                if (closestCity) {
                    county.properties.closestCity = closestCity;
                }

                // No color change here; valid counties are handled by their weather data.
            } else {
                // If centroid is invalid, apply grey color and skip the closest city calculation
                county.properties.closestCity = null; // Ensure no closest city is added

                // Apply grey color for the invalid counties
                county.properties.style = { fill: "grey" };
            }
        });

        // Build dropdown for selecting weather parameters
        const dropdown = d3.select("#dropdown").append("select");
        dropdown.selectAll("option")
            .data(paramList)
            .enter()
            .append("option")
            .text(d => paramTextMap[d])
            .attr("value", d => d);

        // Update the map based on the selected parameter
        function updateMap() {
            cityLayer.selectAll("*").remove();

            const values = counties
                .map(d => d.properties.closestCity?.[currentParam])
                .filter(v => v != null);

            // Set color scale domain based on the data
            colorScales[currentParam].domain(d3.extent(values));

            const countyPaths = svg.selectAll("path.county")
                .data(counties);

            countyPaths.enter()
                .append("path")
                .attr("class", "county")
                .merge(countyPaths)
                .attr("d", path)
                .attr("fill", d => {
                    // Apply the grey color for invalid centroids
                    if (d.properties.style && d.properties.style.fill === "grey") {
                        return "grey";
                    }

                    const val = d.properties.closestCity?.[currentParam];
                    if (isNaN(val) || val == null) {
                        return "#ccc";
                    }
                    return colorScales[currentParam](val);
                })
                .attr("stroke", "purple")
                .attr("stroke-width", 0.5);

            countyPaths.exit().remove();

            const uniqueCities = [...new Set(weatherData.map(city => city.CITY))];
            uniqueCities.forEach(cityName => {
                const city = weatherData.find(city => city.CITY === cityName);
                if (city) {
                    const latitude = city.LATITUDE;
                    const longitude = city.LONGITUDE;

                    if (latitude && longitude) {
                        const [x, y] = path.projection()([longitude, latitude]);

                        // Add the city circle
                        cityLayer.append("circle")
                            .attr("cx", x)
                            .attr("cy", y)
                            .attr("r", 7)
                            .style("fill", "darkblue");

                        // Add the city label
                        cityLayer.append("text")
                            .attr("x", x + 8)
                            .attr("y", y)
                            .style("font-family", "Helvetica")
                            .style("font-size", "18px")
                            .style("fill", "black")
                            .style("font-weight", "bold")
                            .text(cityName);
                    }
                }
            });

            cityLayer.raise();
        }

        /************************************
         ************ BARCHART ***********
         * *************************************/
        function updateBarChart() {
            // Get the data for the selected parameter from the counties
            const cityData = counties
                .map((d) => ({
                    city: d.properties.closestCity?.CITY,
                    value: d.properties.closestCity?.[currentParam]
                }))
                .filter((d) => d.city && d.value != null);

            // Sort the data
            cityData.sort((a, b) => d3.descending(a.value, b.value));

            // Define the x-axis scale for the bar chart
            const xScale = d3
                .scaleBand()
                .domain(cityData.map((d) => d.city))
                .range([50, barWidth - 50])
                .padding(0.2);

            // Define the y-axis scale for the bar chart
            const yScale = d3
                .scaleLinear()
                .domain([0, d3.max(cityData, (d) => d.value)])
                .range([barHeight - 50, 50]);

            // Define the color scale for the selected parameter
            const colorScale = colorScales[currentParam];

            // Create the bars for the bar chart
            const bars = barSvg.selectAll(".bar").data(cityData);

            bars.enter()
                .append("rect")
                .attr("class", "bar")
                .merge(bars)
                .attr("x", (d) => xScale(d.city))
                .attr("y", (d) => yScale(d.value))
                .attr("width", xScale.bandwidth())
                .attr("height", (d) => barHeight - 50 - yScale(d.value))
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .style("fill", (d) => colorScale(d.value));

            bars.exit().remove();

            // Add the x-axis to the bar chart
            barSvg.selectAll(".x-axis").remove();
            barSvg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${barHeight - 50})`)
                .call(d3.axisBottom(xScale).tickSize(0))
                .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end")
                .style("font-family", "Helvetica");

            // Add the y-axis to the bar chart
            barSvg.selectAll(".y-axis").remove();
            barSvg
                .append("g")
                .attr("class", "y-axis")
                .attr("transform", "translate(50,0)")
                .call(d3.axisLeft(yScale))
                .selectAll("text")
                .style("font-family", "Helvetica");

            // Add the title to the bar chart dynamically based on the selected parameter
            barSvg.selectAll(".chart-title").remove();
            barSvg
                .append("text")
                .attr("class", "chart-title")
                .attr("x", barWidth / 2)  // Center the title
                .attr("y", 20)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .style("font-family", "Helvetica")
                .text(`Highest ${paramTextMap[currentParam]} Day Recorded in January by Closest City`);

            // Add the y-axis label to the bar chart dynamically based on the selected parameter
            barSvg.selectAll(".y-axis-label").remove();
            barSvg
                .append("text")
                .attr("class", "y-axis-label")
                .attr("transform", "rotate(-90)")
                .attr("x", -barHeight / 2)
                .attr("y", 20)
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .style("font-family", "Helvetica")
                .style("fill", "black")
                .attr("text-anchor", "middle")
                .text(paramTextMap[currentParam]);

            // Adjust the container to center the entire chart
            d3.select("#chart-container")
                .style("display", "flex")
                .style("justify-content", "center")
                .style("align-items", "center");
        }

        /************************************
         ************ map legend ***********
         * *************************************/
        function addMapLegend() {
            const legendWidth = 10;
            const legendHeight = 120;
            const legendOffsetX = 80;

            d3.select("#map-legend").remove();

            const legend = svg.append("g")
                .attr("id", "map-legend")
                .attr("transform", `translate(${width - legendOffsetX}, 50)`);

            const values = counties.map(d => d.properties.closestCity?.[currentParam])
                .filter(v => typeof v === 'number' && !isNaN(v));

            if (values.length === 0) {
                console.error("No valid values found for legend.");
                return;
            }

            const maxValue = d3.max(values);
            const minValue = d3.min(values);

            // Keep this going from max to min for top-to-bottom legend
            const legendScale = d3.scaleLinear()
                .domain([maxValue, minValue])
                .range([0, legendHeight]);

            const colorScale = colorScales[currentParam];

            const gradient = legend.append("defs")
                .append("linearGradient")
                .attr("id", "legend-gradient")
                .attr("x1", "0%")
                .attr("y1", "100%")
                .attr("x2", "0%")
                .attr("y2", "0%");

            const stops = 10;
            for (let i = 0; i <= stops; i++) {
                const t = i / stops;
                gradient.append("stop")
                    .attr("offset", `${t * 100}%`)
                    .attr("stop-color", colorScale(minValue + t * (maxValue - minValue)));
            }

            // Color bar
            legend.append("rect")
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", "url(#legend-gradient)");

            // Axis
            const legendAxis = d3.axisRight(legendScale)
                .ticks(5)
                .tickSize(0)
                .tickPadding(6);

            legend.append("g")
                .attr("transform", `translate(${legendWidth}, 0)`)
                .call(legendAxis);

            // Add header text with bold and a small gap between the text and the chart
            const headerText = `Highest ${paramTextMap[currentParam]}\nDay Recorded in January\n by Closest City`;

            // Split header text into multiple lines
            const lines = headerText.split("\n");

            legend.selectAll(".legend-header-text")
                .data(lines)
                .enter()
                .append("text")
                .attr("class", "legend-header-text")
                .attr("x", legendWidth / 2)
                .attr("y", (d, i) => -40 + i * 18)
                .attr("text-anchor", "middle")
                .style("font-size", "10px")
                .style("font-weight", "bold")
                .text(d => d);
        }

        /************************************
         ************ north arrow ***********
         * *************************************/
        function addNorthArrow() {
            const arrowGroup = svg.append("g")
                .attr("class", "north-arrow")
                .attr("transform", `translate(50, 50)`);

            arrowGroup.append("line")
                .attr("x1", 0).attr("y1", 20)
                .attr("x2", 0).attr("y2", -20)
                .attr("stroke", "black")
                .attr("stroke-width", 2);

            arrowGroup.append("polygon")
                .attr("points", "-5,-20 5,-20 0,-30")
                .attr("fill", "black");

            arrowGroup.append("text")
                .attr("x", 0).attr("y", -35)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .text("N");

            arrowGroup.append("text")
                .attr("x", 25).attr("y", 5)
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .text("E");

            arrowGroup.append("text")
                .attr("x", 0).attr("y", 35)
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .text("S");

            arrowGroup.append("text")
                .attr("x", -25).attr("y", 5)
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .text("W");
        }

        /************************************
         ************ Initial render ***********
         * *************************************/
        updateMap();
        updateBarChart();
        addMapLegend();
        addNorthArrow();

        /************************************
         ************ drop down change ***********
         * *************************************/
        dropdown.on("change", event => {
            currentParam = event.target.value;
            updateParamText();
            updateMap();
            updateBarChart();
            addMapLegend();
        });
    })
        .catch((error) => console.error("Error loading data:", error));
});
