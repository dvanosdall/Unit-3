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
    // Set the width and height of the map
    const width = 960;
    const height = 600;

    // Create the SVG element for the map
    const svg = d3.select("#map").attr("width", width).attr("height", height);

    // Set the width and height of the bar chart
    const barWidth = 960;
    const barHeight = 300;

    // Create the SVG element for the bar chart
    const barSvg = d3
        .select("#barchart")
        .attr("width", barWidth)
        .attr("height", barHeight);

    // Define the geographic projection for the map
    const projection = d3
        .geoAlbersUsa()
        .scale(1000)
        .translate([width / 2, height / 2]);

    // Define the path generator for the map
    const path = d3.geoPath().projection(projection);

    // Load the data for the map and bar chart
    Promise.all([
        d3.json("data/ne_10m_admin_2_counties.topojson"),
        d3.csv("data/weather_data.csv"),
    ])
        .then(([countiesTopojson, weatherData]) => {
            // Process the data for the map
            const counties = topojson.feature(
                countiesTopojson,
                countiesTopojson.objects.ne_10m_admin_2_counties
            ).features;

            // Create a map to store the weather data for each city
            let cityWeatherMap = {};
            weatherData.forEach((d) => {
                const key = `${d.LATITUDE},${d.LONGITUDE}`;
                cityWeatherMap[key] = d;
            });

            // Add weather data to each county
            counties.forEach((county) => {
                let closestCity = weatherData.reduce((closest, city) => {
                    let dist = Math.hypot(
                        city.LATITUDE - county.properties.latitude,
                        city.LONGITUDE - county.properties.longitude
                    );
                    return !closest || dist < closest.dist ? { ...city, dist } : closest;
                }, null);

                if (closestCity) {
                    county.properties.weather = closestCity;
                }
            });

            // Define the color scale for the map to use the same ranges as the bar chart
            const mapScale = d3
                .scaleOrdinal()
                .domain([
                    "0-10°F",
                    "11-20°F",
                    "21-30°F",
                    "31-40°F",
                    "41-50°F",
                    "51-60°F",
                    "61-70°F",
                    "71-80°F",
                    "81-90°F",
                ])
                .range([
                    "#ffffcc",
                    "#ffff99",
                    "#ffcc99",
                    "#ffcc66",
                    "#ffa07a",
                    "#ff9900",
                    "#ff6600",
                    "#ff3300",
                    "#cc3300",
                ]);

            // Helper function to get the temperature range
            function getTempRange(temp) {
                if (temp < 11) return "0-10°F";
                else if (temp < 21) return "11-20°F";
                else if (temp < 31) return "21-30°F";
                else if (temp < 41) return "31-40°F";
                else if (temp < 51) return "41-50°F";
                else if (temp < 61) return "51-60°F";
                else if (temp < 71) return "61-70°F";
                else if (temp < 81) return "71-80°F";
                else return "81-90°F";
            }

            // Create a map to store the highest temperature for each city
            let cityTempMap = {};
            weatherData.forEach((d) => {
                const key = d.CITY;
                const temp = +d.TEMP;
                if (!cityTempMap[key] || temp > cityTempMap[key]) {
                    cityTempMap[key] = temp;
                }
            });

            // Add the highest temperature to each county
            counties.forEach((county) => {
                let closestCity = weatherData.reduce((closest, city) => {
                    let dist = Math.hypot(
                        city.LATITUDE - county.properties.latitude,
                        city.LONGITUDE - county.properties.longitude
                    );
                    return !closest || dist < closest.dist ? { ...city, dist } : closest;
                }, null);

                if (closestCity) {
                    county.properties.weather = closestCity;
                    county.properties.highestTemp = cityTempMap[closestCity.CITY];
                }
            });

            // Draw the counties on the map and apply the color based on temperature range
            svg
                .selectAll(".county")
                .data(counties)
                .enter()
                .append("path")
                .attr("class", "county")
                .attr("d", path)
                .style("fill", (d) => {
                    if (d.properties.highestTemp) {
                        const tempRange = getTempRange(d.properties.highestTemp);
                        return mapScale(tempRange);
                    }
                    return "#f1f1f1";
                })
                .style("stroke", "#fff")
                .style("opacity", 0.9);

            // Draw the cities on the map
            svg
                .selectAll(".city")
                .data(weatherData)
                .enter()
                .append("circle")
                .attr("class", "city")
                .attr("cx", (d) => projection([+d.LONGITUDE, +d.LATITUDE])[0])
                .attr("cy", (d) => projection([+d.LONGITUDE, +d.LATITUDE])[1])
                .attr("r", 5)
                .style("fill", "darkblue"); // Dark blue for cities

            // Create a tooltip for city hover
            const tooltip = d3
                .select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("visibility", "hidden")
                .style("position", "absolute")
                .style("background-color", "white")
                .style("border", "1px solid black")
                .style("padding", "5px")
                .style("font-size", "12px");

            // Show tooltip on city hover
            svg
                .selectAll(".city")
                .on("mouseover", function (event, d) {
                    const cityData = weatherData.filter((data) => data.CITY === d.CITY);
                    const highestTemp = Math.max(...cityData.map((data) => data.TEMP));
                    tooltip
                        .html(`<h4>Highest Temperature - ${highestTemp}°F</h4>`)
                        .style("visibility", "visible")
                        .style("left", event.pageX + "px")
                        .style("top", event.pageY - 28 + "px");
                })
                .on("mouseout", function () {
                    tooltip.style("visibility", "hidden");
                });

            // Add labels to cities
            svg
                .selectAll(".city-label")
                .data(weatherData)
                .enter()
                .append("text")
                .attr("class", "city-label")
                .attr("x", (d) => projection([+d.LONGITUDE, +d.LATITUDE])[0] + 5)
                .attr("y", (d) => projection([+d.LONGITUDE, +d.LATITUDE])[1] - 5)
                .text((d) => d.CITY)
                .style("font-size", "14px")
                .style("font-family", "Helvetica")
                .style("fill", "black")
                .style("pointer-events", "none");

            // Create the bar chart data
            let cityTemp = weatherData
                .map((d) => ({
                    city: d.CITY,
                    temp: +d.TEMP,
                }))
                .sort((a, b) => d3.descending(a.temp, b.temp));

            // Define the x-axis scale for the bar chart
            const xScale = d3
                .scaleBand()
                .domain(cityTemp.map((d) => d.city))
                .range([50, barWidth - 50])
                .padding(0.2);

            // Define the y-axis scale for the bar chart
            const yScale = d3
                .scaleLinear()
                .domain([0, 100])
                .range([barHeight - 50, 50]);

            // Create the bar chart
            barSvg
                .selectAll(".bar")
                .data(cityTemp)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", (d) => xScale(d.city))
                .attr("y", (d) => yScale(d.temp))
                .attr("width", xScale.bandwidth())
                .attr(
                    "height",
                    (d) => barHeight - 50 - yScale(Math.min(100, Math.max(0, d.temp)))
                )
                .style("fill", (d) => {
                    const highestTemp = Math.max(
                        ...weatherData
                            .filter((data) => data.CITY === d.city)
                            .map((data) => data.TEMP)
                    );
                    const tempRange = getTempRange(highestTemp);
                    return mapScale(tempRange);
                });

            // Add the x-axis to the bar chart
            barSvg
                .append("g")
                .attr("transform", `translate(0,${barHeight - 50})`)
                .call(d3.axisBottom(xScale).tickSize(0))
                .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end")
                .style("font-family", "Helvetica");

            // Add the y-axis to the bar chart
            barSvg
                .append("g")
                .attr("transform", "translate(50,0)")
                .call(d3.axisLeft(yScale))
                .selectAll("text")
                .style("font-family", "Helvetica");

            // Add the title to the bar chart
            barSvg
                .append("text")
                .attr("x", barWidth / 2)
                .attr("y", 20)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .style("font-family", "Helvetica")
                .text("Highest January Temperature (°F) by City");

            // Add the y-axis label to the bar chart
            barSvg
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -barHeight / 2)
                .attr("y", 20)
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .style("font-family", "Helvetica")
                .style("fill", "black")
                .attr("text-anchor", "middle")
                .text("Temperature (°F)");

            // Add the legend to the map
            const legendWidth = 100;
            const legendHeight = 20;

            const legend = svg
                .append("g")
                .attr("transform", `translate(${width - 150}, 60)`);

            legend
                .append("g")
                .selectAll("rect")
                .data(mapScale.domain())
                .enter()
                .append("rect")
                .attr("x", (d, i) => i * (legendWidth / mapScale.domain().length))
                .attr("y", 0)
                .attr("width", legendWidth / mapScale.domain().length)
                .attr("height", legendHeight)
                .style("fill", (d) => mapScale(d))
                .style("opacity", 0.9);

            legend
                .append("text")
                .attr("x", 0)
                .attr("y", legendHeight + 15)
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .style("font-family", "Helvetica")
                .text("Temperature (°F)");

            // Add the title to the map
            svg
                .append("text")
                .attr("x", width / 2)
                .attr("y", 40)
                .attr("text-anchor", "middle")
                .style("font-size", "18px")
                .style("font-weight", "bold")
                .style("font-family", "Helvetica")
                .text(
                    "County Shading Based on January 2025 Temperature Highs from Closest Cities"
                );
        })
        .catch((error) => console.error("Error loading data:", error));
});
