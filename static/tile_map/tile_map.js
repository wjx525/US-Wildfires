var stateAbbrevToNameDict = {
  "AL": "Alabama",
  "AK": "Alaska",
  "AS": "American Samoa",
  "AZ": "Arizona",
  "AR": "Arkansas",
  "CA": "California",
  "CO": "Colorado",
  "CT": "Connecticut",
  "DE": "Delaware",
  "DC": "District Of Columbia",
  "FM": "Federated States Of Micronesia",
  "FL": "Florida",
  "GA": "Georgia",
  "GU": "Guam",
  "HI": "Hawaii",
  "ID": "Idaho",
  "IL": "Illinois",
  "IN": "Indiana",
  "IA": "Iowa",
  "KS": "Kansas",
  "KY": "Kentucky",
  "LA": "Louisiana",
  "ME": "Maine",
  "MH": "Marshall Islands",
  "MD": "Maryland",
  "MA": "Massachusetts",
  "MI": "Michigan",
  "MN": "Minnesota",
  "MS": "Mississippi",
  "MO": "Missouri",
  "MT": "Montana",
  "NE": "Nebraska",
  "NV": "Nevada",
  "NH": "New Hampshire",
  "NJ": "New Jersey",
  "NM": "New Mexico",
  "NY": "New York",
  "NC": "North Carolina",
  "ND": "North Dakota",
  "MP": "Northern Mariana Islands",
  "OH": "Ohio",
  "OK": "Oklahoma",
  "OR": "Oregon",
  "PW": "Palau",
  "PA": "Pennsylvania",
  "PR": "Puerto Rico",
  "RI": "Rhode Island",
  "SC": "South Carolina",
  "SD": "South Dakota",
  "TN": "Tennessee",
  "TX": "Texas",
  "UT": "Utah",
  "VT": "Vermont",
  "VI": "Virgin Islands",
  "VA": "Virginia",
  "WA": "Washington",
  "WV": "West Virginia",
  "WI": "Wisconsin",
  "WY": "Wyoming"
}
// hues:  https://github.com/d3/d3-scale-chromatic#sequential-single-hue
var causeOptions;
var causeColors;
var dataOptions = {
  areaBurned: {
    displayName: "Area Burned",
    file: "./data/state_year_firesize.csv",
    unit: "acres",
    colorScheme: "interpolateInferno",
    processor: function (row) {
      var processedRow = {
        'name': row.STATE,
        'key': row.STATE,
        'year': +row.FIRE_YEAR,
        'value': +row.TOTAL_FIRE_SIZE
      }
      return processedRow;
    },
    xDomain: null,
    yDomain: null,
    data: null,
    averageValuesPerState: null
  },
  containmentTime: {
    displayName: "Time Fighting Fires",
    file: "./data/state_year_timeToControl.csv",
    unit: "days",
    colorScheme: "interpolateInferno",
    processor: function (row) {
      var processedRow = {
        'name': row.STATE,
        'key': row.STATE,
        'year': +row.FIRE_YEAR,
        'value': +row.total_days_to_control
      }
      return processedRow;
    },
    xDomain: null,
    yDomain: null,
    data: null,
    averageValuesPerState: null
  },
  numberFires: {
    displayName: "Number of Fires",
    file: "./data/state_year_statistics_forHeatMaps.csv",
    unit: "count",
    colorScheme: "interpolateInferno",
    processor: function (row) {
      var processedRow = {
        'name': row.STATE,
        'key': row.STATE,
        'year': +row.FIRE_YEAR,
        'value': +row.NUMBER_OF_FIRES
      }
      return processedRow;
    },
    xDomain: null,
    yDomain: null,
    data: null,
    averageValuesPerState: null
  },

  avrgSize: {
    displayName: "Average Fire Size",
    file: "./data/state_year_firesize.csv",
    unit: "acres",
    colorScheme: "interpolateInferno",
    processor: function (row) {
      var processedRow = {
        'name': row.STATE,
        'key': row.STATE,
        'year': +row.FIRE_YEAR,
        'value': +row.AVERAGE_FIRE_SIZE
      }
      return processedRow;
    },
    xDomain: null,
    yDomain: null,
    data: null,
    averageValuesPerState: null
  }

}
// set up template for US tilemap
var mapOptions = {
  rectWidth: 52,
  rectHeight: 52,
  mapPaddingLeft: 3,
};
var fireCause = {
  file: "./data/state_year_causesOfFire_count.csv",
  unit: "count",
  processor: function (row) {
    var processedRow = {
      'name': row.STATE,
      'key': row.STATE,
      'year': +row.FIRE_YEAR,
      'cause': row.STAT_CAUSE_DESCR,
      'value': +row.COUNT_CAUSES
    }
    return processedRow;
  },
};

var defaultSelectedAttr = "areaBurned";
var tileMapWidth = 12 * mapOptions.rectWidth;
var tileMapHeight = 9 * mapOptions.rectHeight;

var legendOptions = {
  svgWidth: 130,
  barMarginLeft: 20,
  barWidth: 25,
  barHeight: 5 * mapOptions.rectHeight,
  titleHeight: 20
}

var controlOptions = {
  marginTop: 50,
  buttonWidth: 130,
}

var zoomedPlotOptions = {
  panelWidth: 350,
  panelHeight: 600,
  get lineChartWidth() { return this.panelWidth - 2 * this.padding },
  get lineChartHeight() { return this.lineChartWidth * 0.54 },
  lineChartPaddingBottom: 25,
  padding: 15,

  get miniLineChartWidth() { return (this.panelWidth - 2 * this.padding - this.miniLineChartPadding * (Object.keys(dataOptions).length - 2)) / (Object.keys(dataOptions).length - 1) },
  get miniLineChartHeight() { return this.miniLineChartWidth * 3 / 4 },
  miniLineChartPadding: 8,
}



var svg = d3.select('#tilemap-svg')
  .attr('width', tileMapWidth + legendOptions.svgWidth + zoomedPlotOptions.panelWidth)
  .attr('height', tileMapHeight + controlOptions.marginTop);

var mapG = svg.append('g');

legendG = svg
  .append('g')
  .attr('class', 'legend')
  .attr('width', legendOptions.barWidth)
  .attr('height', legendOptions.barHeight)
  .attr('transform', 'translate(' + (tileMapWidth + legendOptions.barMarginLeft) + ',' + (controlOptions.marginTop) + ')');


var controlG = svg.append('g');

var zoomG = svg.append('g')
  .attr('class', 'stateDetail')
  .attr('width', 500)
  .attr('height', 600)
  .attr("transform", "translate(" + (tileMapWidth + legendOptions.svgWidth) + ",0)");

function drawControlPanel() {
  var numberOfOptions = Object.keys(dataOptions).length;
  var controlPanelMargins = 0.5 * (tileMapWidth - numberOfOptions * controlOptions.buttonWidth)
  var tileButtonsIndex = 0;
  for (const key in dataOptions) {
    var buttonG = controlG.append('g')
      .attr("class", key == defaultSelectedAttr ? "filter selected" : "filter")
      .attr("value", key)
      .attr("transform", "translate(" + (tileButtonsIndex * controlOptions.buttonWidth + mapOptions.mapPaddingLeft + controlPanelMargins) + ",0)");

    buttonG.append("rect")
      .attr("height", 20)
      .attr("width", controlOptions.buttonWidth - 10)
      .attr("rx", 3)
      .attr("ry", 3);

    buttonG.append("text")
      .text(dataOptions[key].displayName)
      .attr("x", 4)
      .attr("dy", "1.3em");
    tileButtonsIndex = tileButtonsIndex + 1;
  }

  d3.selectAll('.filter')
    .on('click', function () {
      // Remove the currently selected classname from that element
      d3.select('.filter.selected').classed('selected', false);
      removeZoomedPlot();
      var clicked = d3.select(this);

      // Add the selected classname to element that was just clicked
      clicked.classed('selected', true);
      updateMap(clicked.attr('value'));
    });
}

function getColors(d, dataKey, domain) {
  var colorScheme = dataOptions[dataKey].colorScheme;
  var numColScale;
  if (colorScheme === "interpolateInferno" || colorScheme === "interpolateRdYlGn") {
    numColScale = d3.scaleSequential(d3[dataOptions[dataKey].colorScheme]).domain([domain[1], domain[0]]);
  }
  else {
    numColScale = d3.scaleSequential(d3[dataOptions[dataKey].colorScheme]).domain([domain[0], domain[1]]);
  }
  return numColScale(d);
}

function StateTile(x, y, key, name) {
  this.x = x;
  this.y = y;
  this.key = key;
  this.name = name;
}

StateTile.prototype.init = function (g) {
  var tile = d3.select(g);
  tile.append('rect')
    .attr('class', 'tileRect')
    .attr('width', mapOptions.rectWidth)
    .attr('height', mapOptions.rectHeight)
    .style('stroke', '#ffffff');

  tile.append('text')
    .attr('x', mapOptions.rectWidth / 2)
    .attr('y', mapOptions.rectHeight / 4)
    .style('text-anchor', 'middle')
    .style("font-size", "11px")
    .text(function (d) { return d.key; });
};

function drawLinePlot(tile, state, dataKey, tileWidth, tileHeight, drawAxis) {
  var data = dataOptions[dataKey].data.filter(element => element.key == state);
  var colorDomain = d3.extent(Object.values(dataOptions[dataKey].averageValuesPerState));
  var color = getColors(dataOptions[dataKey].averageValuesPerState[state], dataKey, colorDomain);
  var xDomain = dataOptions[dataKey].xDomain;
  var yDomain = dataOptions[dataKey].yDomain;
  var xRange;
  var yRange;
  if (tileWidth == zoomedPlotOptions.miniLineChartWidth) {
    xRange = [tileWidth * 0.2, tileWidth * 0.9];
    yRange = [tileHeight * 0.8, tileHeight * 0.2];
  } else {
    xRange = [tileWidth * 0.1, tileWidth * 0.9];
    yRange = [tileHeight * 0.9, tileHeight * 0.2];
  }

  const xScale = d3
    .scaleLinear()
    .domain(xDomain)
    .range(xRange);

  var yScale;
  if (specialScalingNeeded(data[0].key, dataKey)) {
    yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data.map(d => d.value))])
      .range(yRange);
    if (!drawAxis) {
      tile.append('line')
        .style("stroke", "black")
        .attr("x1", -4)
        .attr("y1", tileHeight - 25)
        .attr("x2", 4)
        .attr("y2", tileHeight - 20);

      tile.append('line')
        .style("stroke", "black")
        .attr("x1", -4)
        .attr("y1", tileHeight - 20)
        .attr("x2", 4)
        .attr("y2", tileHeight - 15);
    }
  }
  else if(tileWidth!==mapOptions.rectWidth){
    yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data.map(d => d.value))*1.5])
    .range(yRange);
  }
  else {
    yScale = d3
      .scaleLinear()
      .domain(yDomain)
      .range(yRange);
  }
  var averageLine;
  if (drawAxis) {
    var average = dataOptions[dataKey].averageValuesPerState[state];
    averageLine = tile.append("line")
      .style("stroke", "#bababa")
      .attr("x1", xScale(xDomain[0]))
      .attr("y1", yScale(average))
      .attr("x2", xScale(xDomain[1]))
      .attr("y2", yScale(average));
    if (tileWidth === zoomedPlotOptions.lineChartWidth) {
      averageLabelG = tile.append('g').attr("transform", "translate(" + (xScale(xDomain[1]) + 5) + "," + yScale(average) + ")");
      averageLabelG.append('text')
        .style("fill", "black")
        .style("font-size", "8px")
        .attr("transform", "translate(-3,-6)")
        .text(state + " avg:");
      averageLabelG.append('text')
        .style("fill", "black")
        .style("font-size", "10px")
        .attr("transform", "translate(-3,6)")
        .text(d3.format(".3s")(average));
    }
  }
  var tilePath = tile.append("path")
  .datum(data)
  .attr("d", d3.line()
    .x(function (d) { return xScale(d.year) })
    .y(function (d) { return yScale(d.value) })
  )
  .attr("stroke", color)
  .attr("stroke-width", 2)
  .attr("fill", "none");
const tilePathLength = tilePath.node().getTotalLength();
const transitiontilePath = d3
  .transition()
  .ease(d3.easeSin)
  .duration(2500);
tilePath.attr("stroke-dashoffset", tilePathLength)
  .attr("stroke-dasharray", tilePathLength)
  .transition(transitiontilePath)
  .attr("stroke-dashoffset", 0);
  if(drawAxis){
    var xAxis;
    var yAxis;
    var yAxisClass = 'y axis';
    if (tileWidth == zoomedPlotOptions.miniLineChartWidth) {
      xAxis = d3.axisBottom(xScale).tickValues(xDomain).tickFormat(d3.format("d"));
      yAxis = d3.axisLeft(yScale).ticks(3).tickFormat(d3.format(".1s"));
      yAxisClass = yAxisClass + ' miniAxis'
    } else {
      xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.format("d"));
      yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(".1s"));
    }

    tile.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + yRange[0] + ')')
      .call(xAxis);

    tile.append('g')
      .attr('class', yAxisClass)
      .attr('transform', 'translate(' + xRange[0] + ',0)')
      .call(yAxis);

    var focus = tile.append("g")
      .attr("class", "focus")
      .style("display", "none");

    focus.append("line")
      .attr("class", "x-hover-line hover-line")
      .attr("y1", 0)
      .attr("y2", tileHeight);

    focus.append("line")
      .attr("class", "y-hover-line hover-line")
      .attr("x1", 0)
      .attr("x2", tileWidth);

    focus.append("circle")
      .style("stroke", color)
      .attr("r", 3);

    var tooltip = focus.append('g').attr("transform", "translate(-20,-35)")

    tooltip.append("rect")
      .attr("height", 30)
      .attr("width", 40)
      .style("stroke", color)
      .style("fill", "none")
      .style("stroke-width", 1);

    tooltip.append("rect")
      .attr("class", "hoverTextBG")
      .style("fill", "white")
      .style("opacity", 0.8)
      .attr("width", 40)
      .attr("height", 30)
      .attr("dy", ".31em");
    tooltip.append("text")
      .attr("id", "hoverValue")
      .attr("class", "hoverText")
      .style("fill", "black")
      .attr("x", 5)
      .attr("y", 10)
      .attr("dy", ".31em");

    tooltip.append("text")
      .attr("id", "hoverYear")
      .attr("class", "hoverText")
      .style("fill", "black")
      .attr("x", 5)
      .attr("y", 20)
      .attr("dy", ".31em");

    tile.append("rect")
      .attr("class", "overlay")
      .attr("width", tileWidth)
      .attr("height", tileHeight)
      .on("mouseover", function () { focus.style("display", null); })
      .on("mouseout", function () { focus.style("display", "none"); })
      .on("mousemove", mousemove);

    var bisectDate = d3.bisector(function (d) { return d.year; }).left;

    function mousemove() {
      var x0 = xScale.invert(d3.mouse(this)[0]),
        i = bisectDate(data, x0, 1),
        d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.year > d1.year - x0 ? d1 : d0;
      focus.attr("transform", "translate(" + xScale(d.year) + "," + yScale(d.value) + ")");
      tooltip.select("#hoverValue").text(function () { return d3.format(".3s")(d.value); });
      tooltip.select("#hoverYear").text(function () { return "(" + d3.format("d")(d.year) + ")"; });
      focus.select(".x-hover-line").attr("y2", yRange[0] - yScale(d.value)).style("stroke", color);
      focus.select(".y-hover-line").attr("x2", xRange[0] - xScale(d.year)).style("stroke", color);
    }
  }
 
}

function specialScalingNeeded(stateKey, dataType) {
  return (stateKey === "AK" && (dataType === "areaBurned" || dataType === "avrgSize")) ||
    (stateKey === "NY" && (dataType === "containmentTime"));
}

StateTile.prototype.update = function (g, dataKey) {
  var tile = d3.select(g);
  if ((typeof dataKey) === "string") {
    drawLinePlot(tile, this.key, dataKey, mapOptions.rectWidth, mapOptions.rectHeight, false)
  }
}

var tiles = [];
gridmapLayoutUsa.forEach(function (d) {
  tiles.push(new StateTile(d.x, d.y, d.key, d.name));
});

Promise.all(Object.values(dataOptions).map(x => d3.csv(x.file, x.processor)).concat([d3.csv(fireCause.file, fireCause.processor)]))
  .then(function (dataset) {
    Object.values(dataOptions).map((dataType, i) => {
      processedData = dataset[i];
      dataType.data = processedData;
      dataType.xDomain = d3.extent(processedData, function (state) {
        return state.year;
      });
      dataType.yDomain = [0, d3.max(processedData, function (state) {
        if (!specialScalingNeeded(state.key, Object.keys(dataOptions)[i])) {
          return state.value;
        }
      })];
      var holder = {}
      processedData.forEach(function (d) {
        if (!holder.hasOwnProperty(d.key)) {
          holder[d.key] = [];
        }
        holder[d.key].push(d.value);
      });
      Object.entries(holder).forEach(([k, v]) => {
        holder[k] = v.reduce((total, next) => total + next, 0) / v.length;
      })
      dataType.averageValuesPerState = holder;
    })
    fireCause.data = dataset[Object.keys(dataOptions).length].filter((data) => { return data.cause !== "Debris Burning" });
    causeOptions = [...new Set(fireCause.data.map(item => item.cause))];
    causeColors = d3.scaleOrdinal(d3.schemeSet3).domain(causeOptions);
    updateMap(defaultSelectedAttr);
    drawControlPanel();
  });


function updateMap(dataKey) {
  drawTiles(dataKey);
  drawLegend(dataKey);
}

function drawTiles(dataKey) {
  mapG.selectAll('.tile')
    .remove();

  var tileEnter = mapG.selectAll('.tile')
    .data(tiles)
    .enter()
    .append('g')
    .attr('class', 'tile')
    .attr('transform', function (d) { return 'translate(' + (d.x * mapOptions.rectWidth + mapOptions.mapPaddingLeft) + ',' + (d.y * mapOptions.rectHeight + controlOptions.marginTop) + ')'; });

  tileEnter.each(function (tile) {
    tile.init(this);
    tile.update(this, dataKey);
  });

  tileEnter.on('click', function (d) {
    // Remove the currently selected classname from that element
    var clickedTile = d3.select(this);
    var selectedBeforeClick = clickedTile.classed('selected');
    removeZoomedPlot();
    d3.select('.tile.selected').classed('selected', false);
    if (!selectedBeforeClick) {
      d3.select(this).classed('selected', true);
      drawZoomedPlot(d.key, dataKey);
    }
  });
}

function removeZoomedPlot() {
  zoomG.selectAll(".detailView").remove();
}

function drawZoomedPlot(state, dataKey) {
  var data = dataOptions[dataKey].data.filter(element => element.key == state);

  var zoomEnter = zoomG.append("rect")
    .attr('class', 'detailView')
    .attr("height", zoomedPlotOptions.panelHeight)
    .attr("width", zoomedPlotOptions.panelWidth)
    .attr("fill", "#dedede")
    .style('opacity', 0.3)
    .attr("rx", 3)
    .attr("ry", 3);

  zoomG.append('text')
    .attr('class', 'detailView stateName')
    .attr("transform", "translate(" + zoomedPlotOptions.padding + "," + (5 + controlOptions.marginTop / 2) + ")")
    .text(stateAbbrevToNameDict[state] + " (" + state + ")");

  var plotsG = zoomG.append('g')
    .attr('transform', 'translate(0,' + (controlOptions.marginTop / 2) + ")")
  var linePlot = plotsG.append("g")
    .attr('class', 'detailView')
    .attr("height", zoomedPlotOptions.lineChartHeight)
    .attr("width", zoomedPlotOptions.lineChartWidth)
    .attr("fill", "white")
    .attr("transform", "translate(" + (zoomedPlotOptions.panelWidth - zoomedPlotOptions.lineChartWidth) / 2 + "," + zoomedPlotOptions.padding + ")");

  linePlot.append("rect")
    .attr('class', 'detailView zoomPlot')
    .attr("height", zoomedPlotOptions.lineChartHeight)
    .attr("width", zoomedPlotOptions.lineChartWidth)
    .attr("fill", "#dedede")
    .attr("rx", 3)
    .attr("ry", 3);

  linePlot.append('text')
    .attr('class', 'detailView zoomPlotTitle')
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + zoomedPlotOptions.panelWidth / 2 + "," + 0.1 * zoomedPlotOptions.lineChartHeight + ")")
    .text(dataOptions[dataKey].displayName + " (" + dataOptions[dataKey].unit + ")");
  drawLinePlot(linePlot, state, dataKey, zoomedPlotOptions.lineChartWidth, zoomedPlotOptions.lineChartHeight, true)

  var miniPlotCol = 0;

  Object.values(dataOptions).map((dataset, i) => {
    var plotKey = Object.keys(dataOptions)[i];
    if (plotKey !== dataKey) {
      var miniLinePlot = plotsG.append("g")
        .attr('class', 'detailView')
        .attr("height", zoomedPlotOptions.miniLineChartHeight)
        .attr("width", zoomedPlotOptions.miniLineChartWidth)
        .attr("fill", "white")
        .attr("transform", "translate(" + (zoomedPlotOptions.padding + miniPlotCol * (zoomedPlotOptions.miniLineChartWidth + zoomedPlotOptions.miniLineChartPadding)) + "," + (zoomedPlotOptions.padding + zoomedPlotOptions.lineChartHeight + zoomedPlotOptions.lineChartPaddingBottom) + ")");
      miniLinePlot.append("rect")
        .attr('class', 'detailView zoomPlot')
        .attr("height", zoomedPlotOptions.miniLineChartHeight)
        .attr("width", zoomedPlotOptions.miniLineChartWidth)
        .attr("fill", "white")
        .attr("rx", 3)
        .attr("ry", 3);
      miniLinePlot.append('text')
        .attr('class', 'detailView zoomPlotSubTitle')
        .style("text-anchor", "middle")
        .attr("transform", "translate(" + zoomedPlotOptions.miniLineChartWidth / 2 + "," + 0.1 * zoomedPlotOptions.miniLineChartHeight + ")")
        .text(dataOptions[plotKey].displayName + " (" + dataOptions[plotKey].unit + ")");
      drawLinePlot(miniLinePlot, state, plotKey, zoomedPlotOptions.miniLineChartWidth, zoomedPlotOptions.miniLineChartHeight, true)
      miniPlotCol++;
    }
  })
  var miniCausePlot = plotsG.append("g")
    .attr('class', 'detailView stackArea')
    .attr("height", zoomedPlotOptions.lineChartHeight)
    .attr("width", zoomedPlotOptions.lineChartWidth)
    .attr("transform", "translate(" + zoomedPlotOptions.padding + "," + (zoomedPlotOptions.padding + zoomedPlotOptions.lineChartHeight + 2 * zoomedPlotOptions.lineChartPaddingBottom + zoomedPlotOptions.miniLineChartHeight) + ")");
  miniCausePlot.append("rect")
    .attr('class', 'detailView zoomPlot')
    .attr("height", zoomedPlotOptions.lineChartHeight)
    .attr("width", zoomedPlotOptions.lineChartWidth)
    .attr("fill", "white")
    .attr("rx", 3)
    .attr("ry", 3);
  miniCausePlot.append('text')
    .attr('class', 'detailView zoomPlotTitle')
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + zoomedPlotOptions.panelWidth * 0.45 + "," + 0.15 * zoomedPlotOptions.lineChartHeight + ")")
    .text("Fire Causes");
  drawStackedArea(miniCausePlot, state)
}

function drawStackedArea(tile, state) {
  var data = fireCause.data.filter(element => element.key == state);
  var xDomain = d3.extent(data, function (row) {
    return row.year;
  });
  var transformedData = [];
  for (var i = xDomain[0]; i <= xDomain[1]; i++) {
    var holder = { year: i };
    causeOptions.forEach(category => {
      holder[category] = 0;
    })
    var things = data.filter(element => element.year == i);
    things.forEach(row => {
      holder[row.cause] = row.value;
    })
    transformedData.push(holder);
  }
  var width = zoomedPlotOptions.lineChartWidth;
  var height = zoomedPlotOptions.lineChartHeight
  const xScale = d3
    .scaleLinear()
    .domain(xDomain)
    .range([width * 0.1, width * 0.95]);

  const yScale = d3
    .scaleLinear()
    .range([height * 0.2, height * 0.9]);

  const yScale100 = d3
    .scaleLinear()
    .domain([1, 0])
    .range([height * 0.2, height * 0.9]);

  series = d3.stack()
    .keys(causeOptions)
    .offset(d3.stackOffsetExpand)
    (transformedData)

  var area = d3.area()
    .x(d => xScale(d.data.year))
    .y0(d => { return yScale(d[0]) })
    .y1(d => yScale(d[1]))

  tile.selectAll("path")
    .attr("class", "areaPath")
    .data(series)
    .join("path")
    .attr("fill", ({ key }) => causeColors(key))
    .attr("d", area)

  var areas = tile.selectAll("path")
  areas.on('mouseover', function (d) {
    areas.style('opacity', 0.5);
    d3.select(this).style('opacity', 1);
    focus.style("display", null);
  })
    .on('mouseout', function (d) {
      areas.style('opacity', 1);
      focus.style("display", "none");
    })
    .on("mousemove", mousemove);

  xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.format("d"));
  yAxis = d3.axisLeft(yScale100).ticks(5).tickFormat(d3.format(".0%"));
  tile.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height * 0.9 + ')')
    .call(xAxis);

  tile.append('g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(' + width * 0.1 + ',0)')
    .call(yAxis);

  //////////////////////////////////
  var focus = tile.append("g")
    .attr("class", "focus")
    .style("display", "none");
  var color = "black";
  var offset = 5;

  focus.append("line")
    .attr("class", "x-hover-line hover-line")
    .attr("y1", offset)
    .attr("y2", height);

  focus.append("line")
    .attr("class", "y-hover-line hover-line")
    .attr("x1", -offset)
    .attr("x2", width);

  var tooltip = focus.append('g').attr("transform", "translate(-20,-35)")

  tooltip.append("rect")
    .attr("height", 30)
    .attr("width", 110)
    .style("stroke", "black")
    .style("fill", "none")
    .style("stroke-width", 1);

  tooltip.append("rect")
    .attr("class", "hoverTextBG")
    .style("fill", "white")
    .style("opacity", 0.8)
    .attr("width", 110)
    .attr("height", 30)
    .attr("dy", ".31em");
  tooltip.append("text")
    .attr("id", "hoverYear")
    .attr("class", "hoverText")
    .style("fill", "black")
    .attr("x", 5)
    .attr("y", 10)
    .attr("dy", ".31em");

  tooltip.append("text")
    .attr("id", "hoverValue")
    .attr("class", "hoverText")
    .style("fill", "black")
    .attr("x", 5)
    .attr("y", 20)
    .attr("dy", ".31em");

  var bisectDate = d3.bisector(function (d) { return d.year; }).left;
  function mousemove(row) {
    var cause = row.key;
    var x0 = xScale.invert(d3.mouse(this)[0]),
      i = bisectDate(transformedData, x0, 1)
    d0 = transformedData[i - 1],
      d1 = transformedData[i];
    var d = x0 - d0.year > d1.year - x0 ? d1 : d0;
    var percent = d[cause] / (Object.values(d).reduce((total, next) => total + next, 0) - d.year);
    focus.attr("transform", "translate(" + xScale(d.year) + "," + (d3.mouse(this)[1]) + ")");
    tooltip.select("#hoverValue").text(function () { return "Count: " + d[cause] + " (" + d3.format(".0%")(percent) + ")"; });
    tooltip.select("#hoverYear").text(function () { return cause + " (" + d3.format("d")(d.year) + ")"; });
    focus.select(".x-hover-line").attr("y2", height - (d3.mouse(this)[1])).style("stroke", color);
    focus.select(".y-hover-line").attr("x2", 0 - xScale(d.year)).style("stroke", color);
  }
}


function drawLegend(dataKey) {
  legendG.selectAll(".bars").remove();
  legendG.append('g')
    .selectAll(".bars")
    .data(d3.range(legendOptions.barHeight), function (d) { return d; })
    .enter().append("rect")
    .attr("class", "bars")
    .attr("x", 0)
    .attr("y", function (d, i) { return i; })
    .attr("height", 1)
    .attr("width", 25)
    .attr('transform', 'translate(0,' + legendOptions.titleHeight + ')')
    .style("fill", function (d) { return getColors(d, dataKey, [legendOptions.barHeight, 0]); });


  var yScale = d3.scaleLinear()
    .range([legendOptions.barHeight, 0])
    .domain(d3.extent(Object.values(dataOptions[dataKey].averageValuesPerState)));

  var yAxis = d3.axisRight(yScale);

  legendG.selectAll(".legendAxis").remove();
  legendG.selectAll(".label").remove();
  legendG.append("g")
    .attr("class", "legendAxis")
    .attr('transform', 'translate(' + legendOptions.barWidth + ',' + legendOptions.titleHeight + ')')
    .call(yAxis)
    .select(".domain").remove();

  legendG.append('text')
    .attr('class', 'tilemapLegend label')
    .text('Avg ' + dataOptions[dataKey].displayName);

  legendG.append('text')
    .attr('class', 'tilemapLegend label')
    .attr("transform", "translate(0,15)")
    .text("Per Year (" + dataOptions[dataKey].unit + ")");

}

