var options = {
    marginTop: 25,
    cellWidth: 50,
    cellHeight: 400,
    cellPaddingHoriz: 6,
    cellPaddingVert: 4,
    sectionMargin: 2,
    xAxisHeight: 50,
    xAxisLabel: 10,
    yAxisWidth: 70
};
processedData = [];

var categories = [];

var xScale = d3.scaleLinear().range([0, options.cellWidth-2*options.cellPaddingHoriz])
var yScale = d3.scaleLinear().range([options.cellHeight-2*options.cellPaddingVert, 0])

var svg = d3.select('#firecauses-svg')
    .attr('width', 1000)
    .attr('height', options.cellHeight+options.xAxisHeight+options.marginTop);

var plotG = svg.append('g').attr("class","bubble-plot").attr("transform","translate(0,"+options.marginTop+")");

var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-10, -5])
    .html(function(d) {
        return "<div class='tooltiptext'>"+d.name+" ("+d.state+")<br/>"+
            "Date: " + d.year + "<br/>"+
            "Acres burned: " + d.size +"<br/>"+
            "Cause: " + d.cause
            +"</div>"
    });

svg.call(toolTip);

function dataPreprocessor(row) {
    var processedRow = {
        'name': row.FIRE_NAME,
        'year': +row.FIRE_YEAR,
        'cause': row.STAT_CAUSE_DESCR,
        'size': +row.FIRE_SIZE,
        'state': row.STATE
    }
    return processedRow;
}

var cells = [];

function BubbleCell(x, cause, data) {
    this.x = x;
    this.cause = cause;
    this.data = data;
}

BubbleCell.prototype.init = function(g) {
    var cell = d3.select(g);
    cell.append('rect')
        .attr('width', options.cellWidth)
        .attr('height', options.cellHeight)
        .style('opacity', 0.5)
        .style('fill', '#bababa')
        .style('stroke', '#ffffff');
        
    cell.append('text')
        .attr('x', options.cellWidth/2)
        .attr('y', options.cellHeight+options.xAxisHeight-20)
        .style('text-anchor', 'middle')
        .style("font-size", "10px")
        .text(function(d){
            if(d.cause==="Missing/Undefined"){
                return "Missing"
            }
            else if(d.cause=="Miscellaneous"){
                return "Misc."
            }
            else if(d.cause=="Equipment Use"){
                return "Equipment"
            }
            else{
                return d.cause;
            }
        });
};

BubbleCell.prototype.update = function(g){
    var cell = d3.select(g);
    var _this = this;
    var dots = cell.selectAll('.dot')
        .data(this.data, function(d){
            return d.name +'-'+d.year+'-'+d.size+'-'+d.cause; // Create a unique id for the car
        });

    var dotsEnter = dots.enter()
        .append('circle')
        .attr('class', 'dot')
        .style("fill", "#B73239" )
        .style('opacity', 0.5)
        .attr('r', 3);
    
    dotsEnter.on('mouseover', toolTip.show)
        .on('mouseout', toolTip.hide);
    
    dots.merge(dotsEnter).attr('cx', function(d){
            return xScale(d.year)+options.cellPaddingHoriz;
        })
        .attr('cy', function(d){
            return yScale(d.size)+options.cellPaddingVert;
        });
    
    dots.exit().remove();
}

d3.csv('./data/data_top1.csv', dataPreprocessor)
.then(function(dataset){
    var data = dataset.filter((data)=>{return data.cause!=="Debris Burning"});
    categories = [...new Set(data.map(item => item.cause))];
    var yearRange = d3.extent(data.map(a => a.year));
    xScale.domain(d3.extent(data.map(a => a.year)));
    var yDomain = d3.extent(data.map(a => a.size));
    yDomain[1] = yDomain[1] * 1.1;
    yScale.domain(yDomain);

    var xAxis = d3.axisBottom(xScale).tickValues(yearRange).tickFormat(d3.format("d"));
    var yAxis = d3.axisLeft(yScale);
    
    plotG.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate('+(options.yAxisWidth+options.cellPaddingHoriz)+','+options.cellHeight+')')
        .call(xAxis);

    plotG.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate('+options.yAxisWidth+','+options.cellPaddingVert+')')
        .call(yAxis);
    
    plotG.append("text")
        .attr("class","axisLabel")
        .attr("transform", 'translate(10,'+(options.cellHeight/2+options.xAxisHeight)+')rotate(270)')
        .attr("dy","0.3em")
        .text("Acres Burned");

    var holder = []
    for (var i = 0; i < categories.length; i++){
        var categoryData = data.filter((d)=>{return d.cause === categories[i]});
        //var max = d3.max(categoryData.map(d => d.size))
        holder.push({
            category: categories[i],
            data: categoryData,
            max: categoryData.length
        })
    }
    holder = holder.sort((a, b) => (a.max < b.max) ? 1 : -1);
    for (var i = 0; i < holder.length; i++){
        cells.push(new BubbleCell(i, holder[i].category, holder[i].data));
    }

    var cellEnter = plotG.selectAll('.bubble_cell')
        .data(cells)
        .enter()
        .append('g')
        .attr('class','bubble_cell')
        .attr('transform', function(d){return 'translate('+(options.yAxisWidth + d.x*(options.cellWidth+options.sectionMargin))+',0)';});
    
    cellEnter.each(function(cell){
        cell.init(this);
        cell.update(this);
    });
    
})