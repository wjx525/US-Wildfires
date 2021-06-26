var margin = {left: 100, right: 30},
    width = 1000,
    height = 500,
    range = [0, 10],
    step = 1; // change the step and if null, it'll switch back to a normal slider

var svg_slider = d3.select('.Severity_div2')
    .append('svg')
    .attr("id", "slider-svg")
    .attr('width', width)
    .attr('height', height);

var slider = svg_slider.append('g')
    .classed('slider', true)
    .attr('transform', 'translate(' + margin.left +', '+ (height - 50) + ')');

var currentValue = 0;
var targetValue = 600  - margin.right;

// using clamp here to avoid slider exceeding the range limits
var xScale = d3.scaleLinear()
    .domain(range)
    .range([0, targetValue])
    .clamp(true);

// array useful for step sliders
var rangeValues = [0, 0.5, 1, 2, 4, 7, 10];
var rangeValuesClass = ["A", "B", "C", "D", "E", "F", "G"];

var playButton = d3.select("#play-button-slider")
        .attr('transform', 'translate(' + margin.left/2 +', '+ (height/2) + ')');
var moving = false;
var mapping_xVal = {"0": 0, "0.5": 1, "1":2, "2":3, "4":4, "7":5, "10":6};

var xAxis = d3.axisBottom(xScale)

    .tickValues(rangeValues)
    .tickFormat((d,i) => rangeValuesClass[i]);

xScale.clamp(true);

// drag behavior initialization
var drag = d3.drag()
    .on('start.interrupt', function () {
        slider.interrupt();
    }).on('start drag', function () {
        currentValue = d3.event.x;
        dragged(currentValue);
        // imgs.exit().remove();
    });

// this is the main bar with a stroke (applied through CSS)
var track = slider.append('line').attr('class', 'track')
    .attr('x1', xScale.range()[0])
    .attr('x2', xScale.range()[1]);

// this is a bar (steelblue) that's inside the main "track" to make it look like a rect with a border
var trackInset = d3.select(slider.node().appendChild(track.node().cloneNode())).attr('class', 'track-inset');

var ticks = slider.append('g').attr('class', 'ticks').attr('transform', 'translate(0, 4)')
    .attr('class', 'xAxis')
    .call(xAxis);

// drag handle
var handle = slider.append('circle').classed('handle', true)
    .attr('r', 8);

// this is the bar on top of above tracks with stroke = transparent and on which the drag behaviour is actually called
// try removing above 2 tracks and play around with the CSS for this track overlay, you'll see the difference
var trackOverlay = d3.select(slider.node().appendChild(track.node().cloneNode())).attr('class', 'track-overlay')
    .call(drag);

// text to display **
var text_class_boundaries = svg_slider.append('text')
.classed('class-boundaries', true)
    .text(' ');

    var xImg = [width/2 - 50, width/2 - 50, width/2 - 80, width/2 - 100, width/2 -100, width/2 - 100, width/2 - 90];
    var yImg = [height/2.5, height/3 , height/3, height/3, height/3 - 20, height/3 - 20, height/4];
    var yLand = [height*0.55/2.5, 0.55*height/3 , 0.55*height/3, 0.55*height/3, 0.6*height/3 - 20, 0.4*height/3 - 20, 0.3*height/4];
    var yLabel = [height/1.5, height/1.5 , height/1.4, height/1.4, height/1.3, height/1.3, height/1.2];
    var widthImg = ["120", "190", "190", "200", "250", "250", "300"];
    var heightImg = ["120", "190", "190", "200", "250", "250", "300"];
    var fileName = ["home", "football_field", "disneyland", "hoover_dam", "central_park", "capitol_hill", "umd_4"];

playButton
    .on("click", function() {
    const isplay = d3.select("#isPlay").html();
    if (isplay != "Play") {
      moving = false;
      clearInterval(timer);
      d3.select("#isPlay").html("Play");
    } 
    else {
      moving = true;
      timer = setInterval(function () {
                                        dragged(currentValue);
                                        if(currentValue <= 42){
                                            currentValue = currentValue + (targetValue/550);
                                        }
                                        else if (currentValue > 42 && currentValue <= 85) {
                                            currentValue = currentValue + (targetValue/320);
                                        }
                                        else if (currentValue > 85 && currentValue <= 167) {
                                            currentValue = currentValue + (targetValue/200);
                                        }
                                        else if (currentValue > 167) {
                                            currentValue = currentValue + (targetValue/120);
                                        }
                                        if (currentValue > targetValue) {
                                            d3.select("#isPlay").html("Play");
                                        moving = false;
                                        currentValue = 0;
                                        clearInterval(timer);
                                        
                                        }
                                    }, 100);
      d3.select("#isPlay").html("Pause");
    }
  })

var class_boundaries = ["0 - 0.25 acres", 
                        "0.25 - 10 acres",
                        "10 - 100 acres", 
                        "100 - 300 acres",
                        "300 - 1000 acres", 
                        "1000 - 5000 acres",
                        "> 5000 acres"] ;
function dragged(value) {
    var x = xScale.invert(value), index = null, midPoint, cx, xVal;
    if(step) {
        // if step has a value, compute the midpoint based on range values and reposition the slider based on the mouse position
        for (var i = 0; i < rangeValues.length - 1; i++) {
            if (x >= rangeValues[i] && x <= rangeValues[i + 1]) {
                index = i;
                break;
            }
        }
        midPoint = (rangeValues[index] + rangeValues[index + 1]) / 2;
        if (x < midPoint) {
            cx = xScale(rangeValues[index]);
            xVal = rangeValues[index];
        } else {
            cx = xScale(rangeValues[index + 1]);
            xVal = rangeValues[index + 1];
        }
    } else {
        // if step is null or 0, return the drag value as is
        cx = xScale(x);
        xVal = x.toFixed(3);
    }
    // use xVal as drag value
    handle.attr('cx', cx);
    text_class_boundaries.attr('transform', 'translate(' + (width/8) + ', ' + yLabel[mapping_xVal[xVal]] + ')')
    .text(class_boundaries[mapping_xVal[xVal]]);
    
    temp = [xVal, xVal];
    var imgs = svg_slider.selectAll("image").data(temp, function(d){
        return d;
    })

    var imgsEnter = imgs.enter()
    
    imgsEnter.append("svg:image")
    .attr("xlink:href", "data/" + rangeValuesClass[mapping_xVal[xVal]] + ".png")
    .attr("x", "0")
    .attr("y", yLand[mapping_xVal[xVal]])
    .attr("width", 400)
    .attr("height", 400);
    
    imgsEnter.append("svg:image")
        .attr("xlink:href", "data/" + fileName[mapping_xVal[xVal]]+ ".png")
        .attr("x", xImg[mapping_xVal[xVal]] + 100)
        .attr("y", yImg[mapping_xVal[xVal]])
        .attr("width", widthImg[mapping_xVal[xVal]])
        .attr("height", heightImg[mapping_xVal[xVal]]);

    imgs.exit().remove();
}


