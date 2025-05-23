/**************************************************************************************************************************************
//HomeWork-3
//Name Jaya Singh
//script.js
//Purpose: Implements all D3.js interactive visualizations and coordinated dashboard logic for the Data Science Salaries Dashboard.
****************************************************************************************************************************************/

/****************************************************************************************************************************************
//Data and State Setup 
//Generate synthetic demo data for the dashboard.Each record includes year, job title, experience, location, remote ratio, and salary.
// Demo Data Generation
*************************************************************************************************************************************/

const years = [2020, 2021, 2022, 2023, 2024];
const jobTitles = ["Data Scientist", "ML Engineer", "Data Analyst", "Data Engineer", "Research Scientist"];
const experienceLevels = ["Entry", "Mid", "Senior", "Lead"];
const companyLocations = ["US", "UK", "IN", "DE", "CA"];
const data = [];
for (let y of years) {
  for (let i = 0; i < 60; i++) {
    data.push({
      year: y,
      job_title: jobTitles[Math.floor(Math.random() * jobTitles.length)],
      salary: Math.round(60000 + Math.random() * 100000 + (y - 2020) * 4000),
      remote_ratio: Math.round(Math.random() * 100),
      experience: experienceLevels[Math.floor(Math.random() * experienceLevels.length)],
      company_location: companyLocations[Math.floor(Math.random() * companyLocations.length)]
    });
  }
}
/********************************************************************************************************************************************
// Color scales
//This section Define color scales for job titles, years, and locations.
********************************************************************************************************************************************/

const colorJob = d3.scaleOrdinal(d3.schemeSet2).domain(jobTitles);
const colorExp = d3.scaleOrdinal(d3.schemeSet1).domain(experienceLevels);
const colorLoc = d3.scaleOrdinal(d3.schemeTableau10).domain(companyLocations);

/************************************************************************************************************************************************
Create a tooltip div for all charts (hidden by default).
************************************************************************************************************************************************/
const tooltip = d3.select("#tooltip");

/************************************************************************************************************************************************
// State for selection, brushing, and year
// Global state variables for selection and brushing.
************************************************************************************************************************************************/
let selectedJobTitle = null;
let brushedPoints = [];
let currentYear = 2022;

/************************************************************************************************************************************************
Function: getMargin
Purpose: Returns margin settings for each chart type.
Utility Functions
************************************************************************************************************************************************/
function getMargin(type) {
  if (type === "bar") return {top: 30, right: 10, bottom: 90, left: 90};
  return {top: 30, right: 20, bottom: 50, left: 60};
}
/************************************************************************************************************************************************
Function: renderYearButtons
Purpose: it selects the yeras from the data
************************************************************************************************************************************************/
function renderYearButtons() {
  const container = d3.select("#year-buttons");
  container.html(""); // Clear previous
  years.forEach(y => {
    container.append("button")
      .attr("class", y === currentYear ? "selected" : null)
      .text(y)
      .on("click", () => {
        currentYear = y;
        selectedJobTitle = null;
        brushedPoints = [];
        renderYearButtons();
        drawBarChart(currentYear);
        drawScatterPlot(currentYear);
        drawParallelCoords(currentYear);
        drawLineAreaChart();
        drawStreamGraph();
      });
  });
}

/************************************************************************************************************************************************
Function: drawBarChart
Purpose: Draws the bar chart for average salary by job title for the selected year.
Implements selection interaction for job title.
************************************************************************************************************************************************/
function drawBarChart(year = currentYear) {
  d3.select("#bar-chart").selectAll("*").remove();
  const svg = d3.select("#bar-chart");
  const margin = getMargin("bar"), width = 700 - margin.left - margin.right, height = 400 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const filtered = data.filter(d => d.year === year);
  const avgSalary = d3.rollup(filtered, v => d3.mean(v, d => d.salary), d => d.job_title);
  const x = d3.scaleBand().domain(jobTitles).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(avgSalary.values()) * 1.1]).range([height, 0]);
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text").attr("transform", "rotate(-30)").style("text-anchor", "end");
  g.append("g").call(d3.axisLeft(y));

  g.selectAll(".bar")
    .data(Array.from(avgSalary), d => d[0])
    .join("rect")
    .attr("class", d => "bar" + (selectedJobTitle === d[0] ? " selected" : ""))
    .attr("x", d => x(d[0]))
    .attr("width", x.bandwidth())
    .attr("y", d => y(d[1]))
    .attr("height", d => height - y(d[1]))
    .attr("fill", d => colorJob(d[0]))
    .on("mousemove", function(event, d) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px")
        .style("display", "block")
        .html(`<strong>${d[0]}</strong><br>Avg Salary: $${d3.format(",.0f")(d[1])}`);
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
    })
    .on("click", function(event, d) {
      selectedJobTitle = (selectedJobTitle === d[0]) ? null : d[0];
      drawBarChart(year);
      drawScatterPlot(year);
      drawParallelCoords(year);
      drawLineAreaChart(selectedJobTitle);
      drawStreamGraph();
    });
 // g.append("text").attr("class", "axis-label").attr("x", width/2).attr("y", height+margin.bottom-10)
 //   .attr("text-anchor", "middle").text("Job Title");
 // g.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("x", -height/2).attr("y", -50)
 //   .attr("text-anchor", "middle").text("Average Salary (USD)");
}

/************************************************************************************************************************************************
//Function: drawScatterPlot
//Purpose: Draws the scatter plot of salary vs. experience level for the selected year.
//Implements brushing interaction for selection of data subsets.
************************************************************************************************************************************************/
function drawScatterPlot(year = currentYear) {
  d3.select("#scatter-plot").selectAll("*").remove();
  const svg = d3.select("#scatter-plot");
  const margin = getMargin(), width = 700 - margin.left - margin.right, height = 350 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  let filtered = data.filter(d => d.year === year);
  if (selectedJobTitle) filtered = filtered.filter(d => d.job_title === selectedJobTitle);

  const x = d3.scalePoint().domain(experienceLevels).range([0, width]);
  const y = d3.scaleLinear().domain([d3.min(filtered, d => d.salary)*0.95, d3.max(filtered, d => d.salary)*1.05]).range([height, 0]);
  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));

  // Brushing
  const brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on("brush end", brushed);

  g.append("g").attr("class", "brush").call(brush);

  function brushed({selection}) {
    if (!selection) {
      brushedPoints = [];
      d3.selectAll(".dot").classed("selected", false);
      highlightBrushed();
      return;
    }
    const [[x0, y0], [x1, y1]] = selection;
    brushedPoints = filtered.filter(d => {
      const cx = x(d.experience), cy = y(d.salary);
      return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
    });
    d3.selectAll(".dot").classed("selected", d =>
      brushedPoints.includes(d)
    );
    highlightBrushed();
  }

  g.selectAll(".dot")
    .data(filtered)
    .join("circle")
    .attr("class", d => "dot" + (brushedPoints.includes(d) ? " selected" : ""))
    .attr("cx", d => x(d.experience))
    .attr("cy", d => y(d.salary))
    .attr("r", 6)
    .attr("fill", d => colorJob(d.job_title))
    .attr("opacity", 0.7)
    .on("mousemove", function(event, d) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px")
        .style("display", "block")
        .html(
          `<strong>${d.job_title}</strong><br>
           Salary: $${d3.format(",.0f")(d.salary)}<br>
           Experience: ${d.experience}<br>
           Location: ${d.company_location}`
        );
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
    });

 // g.append("text").attr("class", "axis-label").attr("x", width/2).attr("y", height+40)
 //   .attr("text-anchor", "middle").text("Experience Level");
// g.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("x", -height/2).attr("y", -40)
 //   .attr("text-anchor", "middle").text("Salary (USD)");
  
  const legend = d3.select("#scatter-legend").html(""); // Legend
  jobTitles.forEach(jt => {
    legend.append("div").attr("class", "legend-row")
      .html(`<span class="legend-swatch" style="background:${colorJob(jt)}"></span>${jt}`);
  });
}
/************************************************************************
//This function Highlight the bars, lines, etc. based on brushedPoints.
 ************************************************************************/
function highlightBrushed() {
  
  if (brushedPoints.length === 0) {
    d3.selectAll(".bar").classed("selected", false);
    d3.select("#parallel-coords").selectAll("path").classed("selected", false);
    return;
  }
  const brushedTitles = new Set(brushedPoints.map(d => d.job_title));
  d3.selectAll(".bar").classed("selected", d => brushedTitles.has(d[0]));
  d3.select("#parallel-coords").selectAll("path").classed("selected", d => brushedPoints.includes(d));
}

/************************************************************************************************************************************************
Function: drawParallelCoords
Purpose: Draws the parallel coordinates chart for salary, remote ratio, experience, and location.
Implements selection by clicking a line.
************************************************************************************************************************************************/
function drawParallelCoords(year = currentYear) {
  d3.select("#parallel-coords").selectAll("*").remove();
  const svg = d3.select("#parallel-coords");
  const margin = getMargin(), width = 700 - margin.left - margin.right, height = 350 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  let filtered = data.filter(d => d.year === year);
  if (selectedJobTitle) filtered = filtered.filter(d => d.job_title === selectedJobTitle);

  const dimensions = [
    {name: "salary", scale: d3.scaleLinear().domain(d3.extent(filtered, d => d.salary)).range([height, 0])},
    {name: "remote_ratio", scale: d3.scaleLinear().domain([0, 100]).range([height, 0])},
    {name: "experience", scale: d3.scalePoint().domain(experienceLevels).range([height, 0])},
    {name: "company_location", scale: d3.scalePoint().domain(companyLocations).range([height, 0])}
  ];
  const x = d3.scalePoint().domain(dimensions.map(d => d.name)).range([0, width]);
  g.selectAll("path")
    .data(filtered)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", d => colorLoc(d.company_location))
    .attr("stroke-width", 1.0)
    .attr("opacity", 0.6)
    .attr("class", d => brushedPoints.includes(d) ? "selected" : "")
    .attr("d", d => d3.line()(dimensions.map(dim => [x(dim.name), dim.scale(d[dim.name])])))
    .on("mousemove", function(event, d) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px")
        .style("display", "block")
        .html(
          `<strong>${d.job_title}</strong><br>
           Salary: $${d3.format(",.0f")(d.salary)}<br>
           Remote: ${d.remote_ratio}%<br>
           Experience: ${d.experience}<br>
           Location: ${d.company_location}`
        );
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
    })
    /*************************************************************
     //ADDED: Click to select job title from line.
     ************************************************************/
    
    .on("click", function(event, d) {
      selectedJobTitle = d.job_title;
      drawBarChart(currentYear);
      drawScatterPlot(currentYear);
      drawParallelCoords(currentYear);
      drawLineAreaChart(selectedJobTitle);
      drawStreamGraph();
    });
  dimensions.forEach(dim => {
    g.append("g")
      .attr("transform", `translate(${x(dim.name)},0)`)
      .call(d3.axisLeft(dim.scale))
      .append("text")
      .attr("y", -10)
      .attr("fill", "#e0c70c")
      .attr("text-anchor", "middle")
      .text(dim.name.replace("_", " "));
  });
  const legend = d3.select("#parallel-legend").html("");
  companyLocations.forEach(loc => {
    legend.append("div").attr("class", "legend-row")
      .html(`<span class="legend-swatch" style="background:${colorLoc(loc)}"></span>${loc}`);
  });
}

/************************************************************************************************************************************************
Function: drawLineAreaChart
Purpose: Draws the line and area chart of average salary by year.
Implements selection by clicking a dot (year).
************************************************************************************************************************************************/

function drawLineAreaChart(jobTitle = null) {
  d3.select("#line-area-chart").selectAll("*").remove();
  const svg = d3.select("#line-area-chart");
  const margin = getMargin(), width = 750 - margin.left - margin.right, height = 350 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  let avgByYear;
  if (jobTitle) {
    avgByYear = years.map(y => ({
      year: y,
      avg: d3.mean(data.filter(d => d.year === y && d.job_title === jobTitle), d => d.salary)
    }));
  } else {
    avgByYear = years.map(y => ({
      year: y,
      avg: d3.mean(data.filter(d => d.year === y), d => d.salary)
    }));
  }
  const x = d3.scalePoint().domain(years).range([0, width]);
  const y = d3.scaleLinear().domain([d3.min(avgByYear, d => d.avg)*0.95, d3.max(avgByYear, d => d.avg)*1.05]).range([height, 0]);
  // Dot color scale by year
  const yearColor = d3.scaleOrdinal()
    .domain(years)
    .range(d3.schemeSet2);

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
  g.append("g").call(d3.axisLeft(y));
  g.append("path")
    .datum(avgByYear)
    .transition()
    .duration(800)
    .attr("fill", "rgb(252, 235, 4)")
    .attr("stroke", "none")
    .attr("d", d3.area().x(d => x(d.year)).y0(height).y1(d => y(d.avg)));
  g.append("path")
    .datum(avgByYear)
    .transition()
    .duration(800)
    .attr("fill", "none")
    .attr("stroke", "rgb(36, 61, 247)")
    .attr("stroke-width", 4)
    .attr("d", d3.line().x(d => x(d.year)).y(d => y(d.avg)));
  g.selectAll(".line-point")
    .data(avgByYear)
    .join("circle")
    .attr("class", "line-point")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.avg))
    .attr("r", 5)
    .attr("fill", d => yearColor(d.year))
    .on("mousemove", function(event, d) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px")
        .style("display", "block")
        .html(`<strong>${d.year}</strong><br>Avg Salary: $${d3.format(",.0f")(d.avg)}`);
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
    })
    // --- ADDED: Click to select year from dot ---
    .on("click", function(event, d) {
      currentYear = d.year;
      renderYearButtons();
      drawBarChart(currentYear);
      drawScatterPlot(currentYear);
      drawParallelCoords(currentYear);
      drawLineAreaChart(selectedJobTitle);
      drawStreamGraph();
    });
 // g.append("text").attr("class", "axis-label").attr("x", width/2).attr("y", height+40)
//    .attr("text-anchor", "middle").text("Year");
 // g.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("x", -height/2).attr("y", -40)
 //   .attr("text-anchor", "middle").text("Average Salary (USD)");

  
  const legend = d3.select("#linearea-legend").html(""); // Add legend for colored dots
  years.forEach(y => {
    legend.append("div")
      .attr("class", "legend-row")
      .html(`<span class="legend-swatch" style="background:${yearColor(y)}"></span>${y}`);
  });
}

/************************************************************************************************************************************************
Function: drawStreamGraph
Purpose: Draws the stream graph of job title counts over time.
Implements selection by clicking an area.
************************************************************************************************************************************************/

function drawStreamGraph() {
  d3.select("#stream-graph").selectAll("*").remove();
  const svg = d3.select("#stream-graph");
  const margin = getMargin(), width = 750 - margin.left - margin.right, height = 485 - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const counts = {};
  years.forEach(y => {
    counts[y] = {};
    jobTitles.forEach(jt => {
      counts[y][jt] = data.filter(d => d.year === y && d.job_title === jt).length;
    });
  });
  const stackData = years.map(y => {
    const obj = {year: y};
    jobTitles.forEach(jt => obj[jt] = counts[y][jt]);
    return obj;
  });
  const stack = d3.stack().keys(jobTitles);
  const series = stack(stackData);
  const x = d3.scalePoint().domain(years).range([0, width]);
  const y = d3.scaleLinear().domain([0, d3.max(stackData, d => d3.sum(jobTitles, jt => d[jt]))]).range([height, 0]);
  const area = d3.area()
    .x(d => x(d.data.year))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));
  g.selectAll("path")
    .data(series)
    .join("path")
    .attr("fill", d => colorJob(d.key))
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .attr("d", area)
    .attr("opacity", 0.85)
    .on("mousemove", function(event, d) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px")
        .style("display", "block")
        .html(`<strong>${d.key}</strong>`);
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
    })
  
/************************************************************************************************************************************************
Functions Purpose:  
//Click to select job title from stream area 
//Draw All Function
//Calls all chart-drawing functions to update the dashboard.
************************************************************************************************************************************************/
    .on("click", function(event, d) {
      selectedJobTitle = d.key;
      drawBarChart(currentYear);
      drawScatterPlot(currentYear);
      drawParallelCoords(currentYear);
      drawLineAreaChart(selectedJobTitle);
      drawStreamGraph();
    });
  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
  g.append("g").call(d3.axisLeft(y));
 // g.append("text").attr("class", "axis-label").attr("x", width/2).attr("y", height+40)
 //   .attr("text-anchor", "middle").text("Year");
 // g.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("x", -height/2).attr("y", -40)
  //  .attr("text-anchor", "middle").text("Count");
  const legend = d3.select("#stream-legend").html("");
  jobTitles.forEach(jt => {
    legend.append("div").attr("class", "legend-row")
      .html(`<span class="legend-swatch" style="background:${colorJob(jt)}"></span>${jt}`);
  });
}
// --- Initial Render ---
renderYearButtons();
drawBarChart(currentYear);
drawScatterPlot(currentYear);
drawParallelCoords(currentYear);
drawLineAreaChart();
drawStreamGraph();
