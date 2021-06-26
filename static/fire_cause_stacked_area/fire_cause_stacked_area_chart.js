// set the dimensions and margins of the graph
var margin = {top: 10, right: 200, bottom: 50, left: 70},
    width = 900 - margin.left - margin.right,
    height = 550 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select(".Causes_vis")
    .append("svg")
        .attr("id", "stacked-area-svg")
        .attr("width", + width + margin.left + margin.right )
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

// Parse the Data
  d3.csv("data/data_stackedBarChart.csv", function(data) {
  // List of groups = header of the csv files
  var keys = data.columns.slice(1);

  // color palette
  var color = d3.scaleOrdinal()
    .domain(keys)
    .range(d3.schemeSet3);

  //stack the data
  var stackedData = d3.stack()
    .keys(keys)
    (data)


  //////////
  // AXIS //
  //////////

  // Add X axis
  var x = d3.scaleTime()
    .domain(d3.extent(data, function(d) { return d.Year; }))
    .range([ 0, width ]);

  var xAxis = svg.append("g")                                                                                       
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(10));

  // Add X axis label:
  svg.append("text")
  .attr("class","axisLabel")
      .attr("text-anchor", "end")
      .attr("x", width/2)
      .attr("y", height+40 )
      .text("Time (year)");                                                                                                                                

  // Add Y axis label:
  svg.append("text")
  .attr("class","axisLabel")
      .attr("text-anchor", "end")
      .attr("transform", 'translate(-50,300) rotate(270)')
      .text("Number of Fires")
      .attr("text-anchor", "start");

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, 90000])
    .range([ height, 0 ]);

  svg.append("g")
    .call(d3.axisLeft(y).ticks(5));


  //////////
  // BRUSHING AND CHART //
  //////////

  // Add a clipPath: everything out of this area won't be drawn.
  var clip = svg.append("defs").append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("width", width)
      .attr("height", height )
      .attr("x", 0)
      .attr("y", 0);

  // Add brushing
  var brush = d3.brushX()                 // Add the brush feature using the d3.brush function
      .extent( [ [0,0], [width,height] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
      .on("end", updateChart); // Each time the brush selection changes, trigger the 'updateChart' function

  // Create the scatter variable: where both the circles and the brush take place
  var areaChart = svg.append('g')
    .attr("clip-path", "url(#clip)");

  // Area generator
  var area = d3.area()
    .x(function(d,i) { return x(d.data.Year); })
    .y0(function(d) { return y(d[0]); })
    .y1(function(d) { return y(d[1]); });

  // Show the areas
  areaChart
    .selectAll("mylayers")
    .data(stackedData)
    .enter()
    .append("path")
      .attr("class", function(d) { return "myArea " + d.key; })
      .style("fill", function(d) { return color(d.key); })
      .attr("d", area)
      .on('mouseover', function(d) {
        
        // Use this to select the hovered element
        var hovered = d3.select(this);

        // add hovered class to style the group
        hovered.classed('hovered', true);        
        var pos = d3.mouse(this);
        hovered.append('text')
            .attr('class', 'value')
            .attr('x', pos[0])
            .attr('y', pos[1])
            .attr('dy', '0.7em')
            .style('visibility',"visible")
            .style("position", "absolute")
            .style("fill", "black")
            .text(function(){ return 'Year: ' + x.invert(pos[0]) + '# of fires: ' + y.invert(pos[1]);});
    })
    .on('mouseleave', function(d) {
        // Clean up the actions that happened in mouseover
        var hovered = d3.select(this);
        hovered.classed('hovered', false);
        hovered.select('text.value').remove();
    });
    

  // Add the brushing
  areaChart
    .append("g")
      .attr("class", "brush")
      .call(brush);

  var idleTimeout;
  function idled() { idleTimeout = null; }



  // A function that update the chart for given boundaries
  function updateChart() {

    extent = d3.event.selection;
    // If no selection, back to initial coordinate. Otherwise, update X axis domain
    if(!extent){
      if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
      x.domain(d3.extent(data, function(d) { return d.Year; }));
    }else{
      x.domain([ x.invert(extent[0]), x.invert(extent[1]) ]);
      areaChart.select(".brush").call(brush.move, null) ;// This remove the grey brush area as soon as the selection has been done
    }

    // Update axis and area position
    xAxis.transition().duration(1000).call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(5));
    areaChart
      .selectAll("path")
      .transition().duration(1000)
      .attr("d", area);    
    }

    //////////
    // HIGHLIGHT GROUP //
    //////////

    // What to do when one group is hovered
    var highlight = function(d){
      // reduce opacity of all groups
      d3.selectAll(".myArea").style("opacity", .1);
      // expect the one that is hovered
      d3.select("."+d).style("opacity", 1);
    }

    // And when it is not hovered anymore
    var noHighlight = function(d){
      d3.selectAll(".myArea").style("opacity", 1);
    }


    //////////
    // LEGEND //
    //////////

    // Add one dot in the legend for each name.
    var size = 10
    svg.selectAll("myrect")
      .data(keys)
      .enter()
      .append("rect")
        .attr("x", 650)
        .attr("y", function(d,i){ return i*(size+5) +45}) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("width", size)
        .attr("height", size)
        .style("fill", function(d){ return color(d)})
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight);

    // Add one dot in the legend for each name.
    svg.selectAll("mylabels")
      .data(keys)
      .enter()
      .append("text")
        .attr("x", 650 + size*1.2)
        .attr("y", function(d,i){ return  i*(size+5) + (size/2) +50}) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", "black")
        .text(function(d){ return d})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight);

});
