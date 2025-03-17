/*******************************************
*  Activity 8: D3 Bubble Chart and Multivariate Dataset
*  Dave Vanosdall 
*  Set Up Your Workspace: Create a new directory named 'unit-3' in your web directory. Initialize a new Git repository within this directory.
*  Create a Bubble Chart: Create a bubble chart using the simple dataset from Week 2. Save your JavaScript code in a file named 'bubblechart.js'. Please note that you will replace this code in your 'main.js' file in future activities
*  Prepare Your Dataset: Refer to Lab 2-1, Lesson 2 - Data handout for instructions on how to find and format a multivariate dataset for the D3 lab assignment.
*  Commit Your Work: Commit your dataset and your 'unit-3' folder (including 'bubblechart.js') to your Git repository. Use the commit message "Activity 8". Don't forget to sync your changes.
******************************************/
// Wait until the webpage is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function () {
  // SVG dimension variables
  const width = 900;
  const height = 500;

  // Create the SVG container
  const container = d3.select("body")
  .append("svg")
  .attr("width", 900)
  .attr("height", 500)
  .attr("class", "container")
  .style("background-color", "rgba(0,0,0,0.2)");

// Create the inner rectangle
const innerRect = container.append("rect")
  .attr("width", 800)
  .attr("height", 400)
  .attr("class", "innerRect")
  .attr("x", 50)
  .attr("y", 50)
  .style("fill", "#FFFFFF");

// Create the x-scale
const xScale = d3.scaleLinear()
  .range([90, 810])
  .domain([0, 3]);

// City population data
const cityPop = [
  { city: 'Madison', population: 233209 },
  { city: 'Milwaukee', population: 594833 },
  { city: 'Green Bay', population: 104057 },
  { city: 'Superior', population: 27244 }
];

// Find the minimum and maximum population values
const minPop = d3.min(cityPop, (d) => d.population);
const maxPop = d3.max(cityPop, (d) => d.population);

// Color scale generator
const colorScale = d3.scaleLinear()
  .range(["#FDBE85", "#D94701"])
  .domain([minPop, maxPop]);

// Create the y-scale
const yScale = d3.scaleLinear()
  .range([450, 50])
  .domain([0, 700000]);

// Create the y-axis generator
const yAxis = d3.axisLeft(yScale);

// Create the axis g element and add axis
const axis = container.append("g")
  .attr("class", "axis")
  .attr("transform", "translate(50, 0)")
  .call(yAxis);

// Style the axis
axis.selectAll("path")
  .style("fill", "none")
  .style("stroke", "black")
  .style("stroke-width", "1px")
  .style("shape-rendering", "crispEdges");

axis.selectAll("line")
  .style("fill", "none")
  .style("stroke", "black")
  .style("stroke-width", "1px")
  .style("shape-rendering", "crispEdges");

axis.selectAll("text")
  .style("font-family", "sans-serif")
  .style("font-size", "0.9em");

// Create the circles
const circles = container.selectAll(".circles")
  .data(cityPop)
  .enter()
  .append("circle")
  .attr("class", "circles")
  .attr("id", (d) => d.city)
  .attr("r", (d) => {
    const area = d.population * 0.01;
    return Math.sqrt(area / Math.PI);
  })
  .attr("cx", (d, i) => xScale(i))
  .attr("cy", (d) => yScale(d.population))
  .style("fill", (d) => colorScale(d.population))
  .style("stroke", "#000");

// Add title
const title = container.append("text")
  .attr("class", "title")
  .attr("text-anchor", "middle")
  .attr("x", 450)
  .attr("y", 30)
  .text("City Populations");

// Add labels
const labels = container.selectAll(".labels")
  .data(cityPop)
  .enter()
  .append("text")
  .attr("class", "labels")
  .attr("text-anchor", "left")
  .attr("y", (d) => yScale(d.population) + 5);

// Create format generator
var format = d3.format(",");

// Add label lines
labels.append("tspan")
  .attr("class", "nameLine")
  .attr("x", (d, i) => xScale(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5)
  .text((d) => d.city);

labels.append("tspan")
  .attr("class", "popLine")
  .attr("x", (d, i) => xScale(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5)
  .attr("dy", "15") //vertical offset
  .text((d) => "Pop. " + format(d.population));

});
