/*******************************************************************************
 * main.js
 * Global Terrorism Dashboard
 * Author: Jaya Singh
 * Date: 2025-05-14
 * Responsive dashboard with D3.js and CSS Grid.
 * Charts: choropleth map, bar chart, parallel coordinates, streamgraph.
 * This dashboard explores global terrorism by country, attack type, and regional/time impact.
 * The map provides an overview, the bar chart details attack types, and the parallel coordinates
 * plot enables multi-dimensional exploration by year, casualties, and region.
 * All views are interactive, responsive, and include legends and clear labels
 ********************************************************************************/

//colors
const deepVibrantColors = [
  "#e41a1c", "#377eb8", "#4daf4a", "#984ea3",
  "#ff7f00", "#ffff33", "#a65628", "#f781bf",
  "#d62728", "#17becf", "#bcbd22", "#9467bd"
];

const labelMap = {
  iyear: "Year",
  nkill: "Killed",
  nwound: "Wounded",
  region_txt: "Region"
};

let worldData, terrorismData;

Promise.all([
  d3.json('data/world-110m.json'),
  d3.csv('data/terrorism.csv')
]).then(([world, data]) => {
  worldData = world;
  terrorismData = data.map(d => ({
    ...d,
    nkill: +d.nkill || 0,
    nwound: +d.nwound || 0,
    iyear: +d.iyear
  }));
  renderAll();
  window.addEventListener('resize', renderAll);
});

function renderAll() {
  drawGeoMap(worldData, terrorismData);
  drawBarChart(terrorismData);
  drawParallelCoordinates(terrorismData);
  drawStreamgraph(terrorismData);
}

/*******************************************************************************
 * This is cloropleth chart
 *******************************************************************************/
function drawGeoMap(world, data) {
  d3.select("#geo").select("svg").remove();
  const container = d3.select("#geo").node();
  const width = container.clientWidth;
  const height = container.clientHeight;
  const margin = { top: 70, right: 20, bottom: 20, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Aggregate attacks by country
  const attacksByCountry = d3.rollup(data, v => v.length, d => d.country_txt);

  // Compute color scale using log for better contrast
  const values = Array.from(attacksByCountry.values());
  const q99 = d3.quantile(values.sort(d3.ascending), 0.99);
  const color = d3.scaleSequential(d3.interpolateInferno)
    .domain([0, Math.log1p(q99)]);
  function getColor(count) {
    return color(Math.log1p(Math.min(count || 0, q99)));
  }
  // SVG and main group
  const svg = d3.select("#geo")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  // Countries as GeoJSON features
  const countries = topojson.feature(world, world.objects.countries).features;
  const projection = d3.geoMercator().fitSize([chartWidth, chartHeight], topojson.feature(world, world.objects.countries));
  const path = d3.geoPath().projection(projection);

  // This structure Ddraws countries and add tooltips.
  g.selectAll("path")
    .data(countries)
    .join("path")
    .attr("d", path)
    .attr("fill", d => getColor(attacksByCountry.get(d.properties.name)))
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .append("title")
    .text(d => `${d.properties.name}: ${attacksByCountry.get(d.properties.name) || 0} attacks`);

  // This holds attributes of the Title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("fill", "rgb(88, 4, 158)")
    .attr("stroke", "rgb(31, 149, 185)")
    .style("font-size", Math.max(12, width / 28) + "px")
    .style("font-weight", "bold")
    .text("GeoMap:Terrorist Attacks by Country");

  // Color legends
  const legendWidth = Math.min(180, width / 4);
  const legendHeight = 16;
  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient").attr("id", "legend-gradient");
  linearGradient.selectAll("stop")
    .data(d3.range(0, 1.01, 0.01))
    .enter().append("stop")
    .attr("offset", d => d)
    .attr("stop-color", d => color(d * Math.log1p(q99)));
  svg.append("rect")
    .attr("x", width - legendWidth - 30)
    .attr("y", height - 40)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");
  svg.append("text")
    .attr("x", width - legendWidth - 30)
    .attr("y", height - 45)
    .attr("text-anchor", "start")
    .style("font-size", Math.max(14, width / 70) + "px")
    .style("font-weight", "bold")
    .text("Fewer");
  svg.append("text")
    .attr("x", width - 30)
    .attr("y", height - 45)
    .attr("text-anchor", "end")
    .style("font-size", Math.max(14, width / 70) + "px")
    .style("font-weight", "bold")
    .text("More");
}
/*******************************************************************************************
 *Function Name: drawBarChart
 *Purpose: THis function creates the bar chart.
 ********************************************************************************************/
function drawBarChart(data) {
  d3.select("#bar").select("svg").remove();
  const container = d3.select("#bar").node();
  const width = container.clientWidth;
  const height = container.clientHeight;
  const margin = { top: 70, right: 28, bottom: 70, left: 70 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const minYear = d3.min(data, d => d.iyear);
  const maxYear = d3.max(data, d => d.iyear);

  const attacksByType = d3.rollup(data, v => v.length, d => d.attacktype1_txt);
  let types = Array.from(attacksByType, ([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  const topN = 8;
  if (types.length > topN) {
    const others = types.slice(topN).reduce((sum, d) => sum + d.count, 0);
    types = types.slice(0, topN);
    types.push({ type: "Other", count: others });
  }

  // This add this for unique bar colors
  const barColors = d3.schemeCategory10;
  const color = d3.scaleOrdinal()
    .domain(types.map(d => d.type))
    .range(barColors);
  const svg = d3.select("#bar")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleBand()
    .domain(types.map(d => d.type))
    .range([0, chartWidth])
    .padding(0.30);
  const y = d3.scaleLinear()
    .domain([0, d3.max(types, d => d.count)])
    .range([chartHeight, 0])
    .nice();
  g.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-12)")
    .style("font-weight", "bold")
    .style("text-anchor", "end")
    .style("font-size", Math.max(12, chartWidth / 70) + "px");
 g.append("g").call(d3.axisLeft(y));
  g.selectAll("rect")
    .data(types)
    .join("rect")
    .attr("x", d => x(d.type))
    .attr("y", d => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", d => chartHeight - y(d.count))
    .attr("fill", d => color(d.type)) // Each bar gets a different color
    .attr("stroke", "rgb(210, 227, 16)");
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("fill", "rgb(88, 4, 158)")
    .attr("stroke", "rgb(31, 149, 185)")
    .style("font-size", Math.max(16, chartWidth / 25) + "px")
    .style("font-weight", "bold")
    .attr("fill", "rgb(88, 4, 158)")
    .attr("stroke", "rgb(31, 149, 185)")
    .text(`Attacks by Type (${minYear}–${maxYear})`);
}
/*******************************************************************************************
 *Function Name: drawParallelCoordinates
 *Purpose: THis function creates the Parallel Cordinate chart
 ********************************************************************************************/
function drawParallelCoordinates(data) {
  d3.select("#parallel").select("svg").remove();
  const container = d3.select("#parallel").node();
  const width = container.clientWidth;
  const height = container.clientHeight;
  const margin = { top: 88, right: 180, bottom: 70, left: 70 }; // Increased right margin
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const dimensions = ['iyear', 'nkill', 'nwound', 'region_txt'];
  if (!data.length || !dimensions.every(d => d in data[0])) return;

  const svg = d3.select("#parallel")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const y = {};
  y['iyear'] = d3.scaleLinear().domain(d3.extent(data, d => +d.iyear)).range([chartHeight, 0]);
  y['nkill'] = d3.scaleLinear().domain(d3.extent(data, d => +d.nkill)).range([chartHeight, 0]);
  y['nwound'] = d3.scaleLinear().domain(d3.extent(data, d => +d.nwound)).range([chartHeight, 0]);
  y['region_txt'] = d3.scalePoint().domain([...new Set(data.map(d => d.region_txt))]).range([chartHeight, 0]);

  const x = d3.scalePoint().range([0, chartWidth]).domain(dimensions);
  const regionSet = [...new Set(data.map(d => d.region_txt))];
  const color = d3.scaleOrdinal().domain(regionSet).range([
    "#e41a1c", "#377eb8", "#4daf4a", "#984ea3",
    "#ff7f00", "#ffff33", "#a65628", "#f781bf",
    "#d62728", "#17becf", "#bcbd22", "#9467bd"
  ]);

  function path(d) {
    return d3.line()(dimensions.map(p => [x(p), y[p](d[p])]));
  }

  g.selectAll("path")
    .data(data)
    .join("path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", d => color(d.region_txt))
    .attr("stroke-width", 1.5)
    .attr("opacity", 0.15);

  const labelMap = {
    iyear: "Year",
    nkill: "Killed",
    nwound: "Wounded",
    region_txt: "Region"
  };

  dimensions.forEach(function(dim) {
    const axis = g.append("g")
      .attr("transform", `translate(${x(dim)})`)
      .call(
        dim === "iyear"
          ? d3.axisLeft(y[dim]).tickFormat(d3.format("d"))
          : d3.axisLeft(y[dim])
      );
    axis.append("text")
      .attr("y", -19)
      .attr("x", 5)
      .attr("text-anchor", "middle")
      .attr("fill", "rgb(57, 7, 143)")
      .attr("stroke", "rgb(193, 24, 55)")
      .style("font-weight", "bold")
      .style("font-size", Math.max(10, chartWidth / 45) + "px")
      .text(labelMap[dim] || dim);

    // Remove region axis tick labels to avoid overlap with legend
    if (dim === "region_txt") {
      axis.selectAll(".tick text").remove();
    }
  });

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("fill", "rgb(88, 4, 158)")
    .attr("stroke", "rgb(31, 149, 185)")
    .style("font-size", Math.max(12, chartWidth / 25) + "px")
    .style("font-weight", "bold")
    .text("Parallel Coordinates: Year, Killed, Wounded, Region");

  // Move legend further right, outside the chart area
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 20},${margin.top})`);
  regionSet.forEach((region, i) => {
    legend.append("rect")
      .attr("x", 0)
      .attr("y", i * 22)
      .attr("width", 16)
      .attr("height", 16)
      .attr("fill", color(region));
    legend.append("text")
      .attr("x", 22)
      .attr("y", i * 22 + 13)
      .text(region)
      .style("font-size", "13px")
      .attr("alignment-baseline", "middle");
  });
}



/*******************************************************************************************
 *Function Name: drawStreamgraph
 *Purpose: THis function creates the streamgraph chart
 ********************************************************************************************/
function drawStreamgraph(data) {
  d3.select("#streamgraph").select("svg").remove();
  const container = d3.select("#streamgraph").node();
  const width = container.clientWidth;
  const height = container.clientHeight;
  const margin = { top: 60, right: 210, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const years = Array.from(new Set(data.map(d => d.iyear))).sort((a, b) => a - b);
  const types = Array.from(new Set(data.map(d => d.attacktype1_txt))).slice(0, 6);

  const yearTypeCounts = years.map(year => {
    const row = { year: +year };
    types.forEach(type => {
      row[type] = data.filter(d => d.iyear === year && d.attacktype1_txt === type).length;
    });
    return row;
  });

  const stack = d3.stack()
    .keys(types)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetSilhouette);

  const series = stack(yearTypeCounts);

  const x = d3.scaleLinear()
    .domain(d3.extent(years))
    .range([0, chartWidth]);
  const y = d3.scaleLinear()
    .domain([
      d3.min(series, layer => d3.min(layer, d => d[0])),
      d3.max(series, layer => d3.max(layer, d => d[1]))
    ])
    .range([chartHeight, 0]);

  const color = d3.scaleOrdinal()
    .domain(types)
    .range(deepVibrantColors);

  const area = d3.area()
    .x((d, i) => x(years[i]))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))
    .curve(d3.curveCatmullRom);

  const svg = d3.select("#streamgraph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.selectAll("path")
    .data(series)
    .join("path")
    .attr("d", area)
    .attr("fill", (d, i) => color(types[i]))
    .attr("stroke-width", 0.5)
    .attr("opacity", 3.0);

  g.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(8));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("fill", "rgb(88, 4, 158)")
    .attr("stroke", "rgb(31, 149, 185)")
    .style("font-size", Math.max(12, chartWidth / 22) + "px")
    .style("font-weight", "bold")
    .text("Streamgraph: Evolution of Attack Types Over Years");

  const legendBoxHeight = types.length * 22;
  const legend = svg.append("g")
    .attr(
      "transform",
      `translate(${width - margin.right + 10},${margin.top + (chartHeight - legendBoxHeight) / 2})`
    );
  types.forEach((type, i) => {
    legend.append("rect")
      .attr("x", 0)
      .attr("y", i * 22)
      .attr("width", 16)
      .attr("height", 16)
      .attr("fill", color(type));
    legend.append("text")
      .attr("x", 22)
      .attr("y", i * 22 + 13)
      .text(type)
      .style("font-weight", "bold")
      .attr("font-size", Math.max(11, chartWidth /65) + "px")
      .attr("alignment-baseline", "middle");
  });
}
/*****************************************************************************************************************************************
 *                                                References
Bostock, M., Ogievetsky, V., & Heer, J. (2011). D3: Data-driven documents (Version 7) [JavaScript library]. https://d3js.org/
Curran, S. (2022, March 15). Introduction to data visualization with D3.js [Video]. YouTube. https://www.youtube.com/watch?v=stqJ2vd0LLo
D3.js contributors. (n.d.). Getting started with D3.js. https://observablehq.com/@d3/learn-d3
Global Terrorism Database. (2023). Global Terrorism Database [Data set]. University of Maryland. https://www.start.umd.edu/gtd/
 *****************************************************************************************************************************************/