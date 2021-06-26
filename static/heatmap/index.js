initChart();

async function initChart() {
  let data = await d3.csv("heatmap/fires.csv");
  let minYear = d3.min(data, (d) => +d.FIRE_YEAR);
  let maxYear = d3.max(data, (d) => +d.FIRE_YEAR);

  const yearGroupData = d3
    .rollups(
      data,
      (v) => d3.sum(v, (d) => +d.FIRE_SIZE),
      (d) => d.FIRE_YEAR
    )
    .sort();

  let yearData = dataFilterbyYear(2005, data);
  let usaMap = await d3.json("heatmap/us.json");
  const states = await d3.csv("heatmap/statecode.csv");
  usaMap.features.forEach((d) => {
    const code = states.find((v) => v.state === d.properties.name)?.code;
    d.code = code;
  });
  usaMap = addDataToMap(usaMap, yearData);

  drawMap(usaMap);
  drawBar(yearGroupData);
  let timerId; 
  d3.select("#play").on("click", () => {
    const isplay = d3.select("#isPlay").html();
    if (isplay != "Pause") {
      d3.select("#isPlay").html("Pause");

      timerId = setInterval(() => {
        nextYearMap(usaMap, data, maxYear, minYear);
      }, 1000);
    } else {
      d3.select("#isPlay").html("Play");
      clearInterval(timerId);
    }
  });
  //pre
  d3.select("#pre").on("click", () => {
    const isplay = d3.select("#isPlay").html();
    if (isplay === "Pause") return;
    preYearMap(usaMap, data, maxYear, minYear);
  });
  //next

  d3.select("#next").on("click", () => {
    const isplay = d3.select("#isPlay").html();
    if (isplay === "Pause") return;
    nextYearMap(usaMap, data, maxYear, minYear);
  });
}

function drawMap(data) {
  const div = d3.select("#map");
  div.selectAll("*").remove();
  const svg = div.append("svg");
  const width = 600;
  const height = 400;
  svg.attr("width", width);
  svg.attr("height", height);
  svg
    .append("text")
    .attr("x", 125)
    .attr("y", 25)
    .style("font-size", 25)
    .text("Total Area Burned Per State");

  const project = d3.geoAlbersUsa().fitSize([width, height], data);
  const path = d3.geoPath().projection(project);

  const color = d3
    .scaleSequential(d3.interpolateInferno)
    .domain(d3.extent(data.features, (d) => d.size).reverse())
  //tip
  const tip = d3
    .tip()
    .offset([0, 0])
    .attr("class", "d3-tip")
    .html(
      (EVENT, d) =>
        `<li>${d.code}</li><li>burned area:${d3.format(".1f")(d.size)}</li>`
    );
  svg.call(tip);
  svg
    .selectAll(".state")
    .data(data.features)
    .join("path")
    .attr("class", (d) => d.code)
    .attr("fill", (d) => color(d.size))
    .attr("stroke", "#303841")
    .attr("d", path)
    .on("mouseover", tip.show)
    .on("mouseout", tip.hide);
}
function drawBar(data) {
  let { width, height, svg, margin, innerHeight, innerWidth, g } = chartArea(
    600,
    400,
    "bar"
  );
  //title
  svg
    .append("text")
    .attr("x", 125)
    .attr("y", 25)
    .style("font-size", 25)
    .text("Total US Area Burned Per Year");
  //tip
  const tip = d3
    .tip()
    .attr("class", "d3-tip")
    .html(
      (EVENT, d) =>
        `<li>year:${d[0]}</li><li> Burned area:${d3.format(".1f")(d[1])}</li>`
    );
  svg.call(tip);

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d[0]))
    .range([0, innerWidth])
    .padding(0.3);
  const xAxis = d3.axisBottom(x);
  const xG = g
    .append("g")
    .attr("transform", `translate(${0},${innerHeight})`)
    .call(xAxis)
    .selectAll('text')
    .attr('transform','translate(-10,10) rotate(-45)');

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d[1])])
    .range([innerHeight, 0]);
  const yAxis = d3.axisLeft(y);
  const yG = g
    .append("g")
    .attr("transform", `translate(${0},${0})`)
    .call(yAxis);
  console.log("bar", data);
  g.selectAll("myrect")
    .data(data)
    .join("rect")
    .attr("class", (d) => "A" + d[0])
    .attr("x", (d) => x(d[0]))
    .attr("y", (d) => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", (d) => innerHeight - y(d[1]))
    .attr("fill", "#303841")
    .on("mouseover", tip.show)
    .on("mouseout", tip.hide);
  d3.select(`#bar .A${1992}`).attr("fill", "#B73239");
  g.append('g')
    .attr('transform',`translate(-65,${innerHeight/2}) rotate(270)`)
    .append('text')
    .text('Acres Burned')
    .style('text-anchor', 'middle')
    .style("font-size", "12px")   
  g.append('g')
    .attr('transform',`translate(${innerWidth/2},${innerHeight+50})`)
    .append('text')
    .text('Year')
    .style('text-anchor', 'middle')
    .style("font-size", "12px")
    
}


function chartArea(w, h, id) {
  const width = w;
  const height = h;
  const margin = { left: 90, top: 50, right: 50, bottom: 50 };
  const innerWidth = width - margin.right - margin.left;
  const innerHeight = height - margin.top - margin.bottom;
  let div = d3.select(`#${id}`);
  div.selectAll("*").remove();
  const svg = div.append("svg");
  svg.attr("width", width);
  svg.attr("height", height);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  return { width, height, svg, margin, innerHeight, innerWidth, g };
}
function dataFilterbyYear(year, data) {
  let yearFilterData = data.filter((d) => d.FIRE_YEAR === year.toString());
  return d3.rollups(
    yearFilterData,
    (v) => d3.sum(v, (d) => +d.FIRE_SIZE),
    (d) => d.STATE
  );
}
function addDataToMap(usaMap, yearData) {
  usaMap.features.forEach((d) => {
    const size = yearData.find((v) => v[0] === d.code);
    d.size = size ? size[1] : 0;
  });
  return usaMap;
}
function nextYearMap(usaMap, data, maxYear, minYear) {
  let initYear = +d3.select("#year").html();
  let nextYear = ++initYear;

  barColor(nextYear);
  d3.select("#year").html(`${nextYear}`);
  if (nextYear > maxYear) {
    d3.select("#year").html(`${minYear}`);
    nextYear = minYear;
  }
  let yearData = dataFilterbyYear(nextYear, data);
  let map = addDataToMap(usaMap, yearData);
  drawMap(map);
}
function preYearMap(usaMap, data, maxYear, minYear) {
  let initYear = +d3.select("#year").html();
  let preYear = --initYear;
  barColor(preYear);

  d3.select("#year").html(`${preYear}`);
  if (preYear < minYear) {
    d3.select("#year").html(`${maxYear}`);
    preYear = maxYear;
  }
  let yearData = dataFilterbyYear(preYear, data);
  let map = addDataToMap(usaMap, yearData);
  drawMap(map);
}
function barColor(year) {
  d3.selectAll(`#bar rect`).attr("fill", "#303841");
  d3.select(`#bar .A${year}`).attr("fill", "#B73239");
}
