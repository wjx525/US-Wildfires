//code referenced from lab 7: https://gitlab.cs.umd.edu/leozcliu/cmsc734-2020-labs/-/wikis/Lab-7:-Interaction-and-Transition-Part-2
var toolTip_chart = d3.tip()
    .attr("class", "d3-tip")
    .offset([-10, -10])
    .html(function(d) {
        return "<div class='toolTipBar'>"+"Year: " + d.FIRE_YEAR + "<br/>"+
            "Area " + d.FIRE_SIZE +" hectares"+"<br/>"+
            "Cost: $" + d.Total_Federal_Spending+"<br/>"+
            "Time needed: " + d.hours_to_control  +" hours" + "<br/>"
    
    });

var svg = d3.select('#barChart-svg');

svg.call(toolTip_chart);

var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

svgWidth = svgWidth


var padding = {t: 40, r: 40, b: 40, l: 40};
var cellPadding = 30;


var chartG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

var dataAttributes = ['FIRE_SIZE','hours_to_control','Total_Federal_Spending'];

var N = dataAttributes.length;

var cellWidth = (svgWidth - padding.l*2 - padding.r) / N;

var cellHeight = (svgHeight - padding.t - padding.b) ;

var xScale = d3.scaleLinear().range([cellPadding, cellWidth - cellPadding*2]);

var yScale = d3.scaleLinear().range([ cellHeight - cellPadding, cellPadding/2]);

var xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d3.format(""));
var yAxis = d3.axisLeft(yScale).ticks(15)


var extentByAttribute = {};

var brushCell;

function SplomCell(x, y, col, row,mean_row) {
    this.x = x;
    this.y = y;
    this.mean_row = mean_row;
    this.col = col;
    this.row = row;
}

var cells = [];
dataAttributes.forEach(function(attrY, col){
   
        mean_row = String(attrY)+"_mean"
        cells.push(new SplomCell('FIRE_YEAR', attrY, col, 0, mean_row));
   
});

SplomCell.prototype.init = function(g) {
    var cell = d3.select(g);

    cell.append('rect')
      .attr('class', 'frame')
      .attr('width', cellWidth - cellPadding*2)
      .attr('height', cellHeight - cellPadding);
}

SplomCell.prototype.update = function(g, data) {
    var cell = d3.select(g);

    // Update the global x,yScale objects for this cell's x,y attribute domains
    xScale.domain(extentByAttribute[this.x]);
    yScale.domain(extentByAttribute[this.y]);

    var _this = this;

    var dots = cell.selectAll('.dot')
        .data(data, function(d){
            return d.FIRE_YEAR +'-'+d.FIRE_SIZE; 
        });

    
    var dotsEnter = dots.enter()
        .append('rect')
        .attr('class', 'dot')
        .style("fill", "#B73239" )
        .attr('width', 5);
        
    dotsEnter.on('mouseover', toolTip_chart.show)
    .on('hover', toolTip_chart.show)
    .on('mouseout', toolTip_chart.hide);

    

    dots.merge(dotsEnter).attr('x', function(d){
            return  xScale(d[_this.x]) - cellPadding/2;
        })
        .attr('height', function(d,i){
            return (cellHeight  - cellPadding)  - yScale(d[_this.y]);
        })
        .attr('y', function(d,i){
            return yScale(d[_this.y]) ;
        });



    var lines = cell.selectAll('.lineChart')
        .data(data, function(d){
            return d.FIRE_YEAR +'-'+d.FIRE_SIZE; 
        });
    var linesEnter = lines.enter()
        .append('path')
        .attr('class', 'lineChart')
        .attr('class', 'lineChart')
        .attr("fill", "None")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .datum(data)
        .attr("d", d3.line()
          .x(function(d) { 
              
             return  xScale(d[_this.x]) - cellPadding/2;
            })
          .y(function(d) { 
            
              return yScale(d[_this.mean_row] - cellHeight + cellPadding/2);}) 
          );
    

   
    dots.exit().remove();
    lines.exit().remove();
}

var cellEnter = chartG.selectAll('.cell')
    .data(cells)
    .enter()
    .append('g')
    .attr('class', 'cell')
    .attr("transform", function(d) {
       
        var tx = (N - d.col - 1) * cellWidth + cellPadding*2 ;
        var ty = d.row * cellHeight + cellPadding ;
        return "translate("+[tx, ty]+")";
     });


d3.csv('./data/data_for_barCharts.csv', dataPreprocessor).then(function(dataset) {
    
    dataBar = dataset
      
        dataAttributes.forEach(function(attribute){
            extentByAttribute[attribute] = d3.extent(dataset, function(d){
                return d[attribute];
            });
        });
        extentByAttribute['FIRE_YEAR'] = d3.extent(dataset,function(d){
             return d['FIRE_YEAR']
        });
       
        chartG.selectAll('.x.axis')
            .data(dataAttributes)
            .enter()
            .append('g')
            .attr('class', 'x axis')
            .attr('transform', function(d,i) {
                return 'translate('+[(N - i - 1) * cellWidth + cellPadding*1.5, cellHeight]+')';
            })
            .each(function(attribute){
                
                xScale.domain(extentByAttribute['FIRE_YEAR']);
                d3.select(this).call(xAxis);
                d3.select(this).append('text')
                    .text('YEAR')
                    .attr('class', 'axis-label')
                    .attr('transform', 'translate('+[cellWidth / 2, +30]+')');
            });
        chartG.selectAll('.y.axis')
            .data(dataAttributes)
            .enter()
            .append('g')
            .attr('class', 'y axis')
            .attr('transform', function(d,i) {
                return 'translate('+[(N - i - 1) * cellWidth + cellPadding*2 ,+cellPadding]+')';
            })
            .each(function(attribute){
                yScale.domain(extentByAttribute[attribute]);
                d3.select(this).call(yAxis);
                d3.select(this).append('text')
                    .text(Maptext(attribute))
                    .attr('class', 'axis-label')
                    .attr('transform', 'translate('+[ cellWidth/4 + cellWidth/10,-5]+')');
            });
       
        cellEnter.append('g')
        .call(brush);

        cellEnter.each(function(c){
            c.init(this);
            c.update(this, dataset);
        });
    });
    

var brush = d3.brush()
.extent([[0, 0], [cellWidth - cellPadding, cellHeight - cellPadding]])
.on("start", brushstart)
.on("brush", brushmove)
.on("end", brushend);


function brushstart(cell) {
    
    if(brushCell !== this) {

        brush.move(d3.select(brushCell), null);

        xScale.domain(extentByAttribute[cell.x]);
        yScale.domain(extentByAttribute[cell.y]);

        brushCell = this;
    }
}

function brushmove(cell) {
 
    var e = d3.event.selection;
    
    
    if(e) {

        svg.selectAll(".dot")
            .classed("hidden", function(d){
                
                return e[0][0]  >  xScale(d[cell.x]) - cellPadding/2  || e[1][0] <  xScale(d[cell.x])-cellPadding/2;    
            })
    
    }
}

function brushend() {
    
    if(!d3.event.selection) {
        svg.selectAll('.hidden').classed('hidden', false);      
        brushCell = undefined;      
    }
}

// Remember code outside of the data callback function will run before the data loads
var Maptext = function(text){
    if ( text == 'Total_Federal_Spending')
        return 'Federal Cost Incurred (in $)';
    if ( text == 'hours_to_control')
        return 'Time Needed to Control (in hours)';
        if ( text == 'FIRE_SIZE')
        return 'Area burned (in hectares)';


}
function dataPreprocessor(row) {
    return {
        
        'FIRE_YEAR': row['FIRE_YEAR'],
        'FIRE_SIZE': +row['FIRE_SIZE'],
        'hours_to_control': +row['hours_to_control'],
        'Total_Federal_Spending': +row['Total_Federal_Spending'],
        'FIRE_SIZE_mean': +row['FIRE_SIZE_mean'],
        'hours_to_control_mean': +row['hours_to_control_mean'],
        'Total_Federal_Spending_mean': +row['Total_Federal_Spending_mean']
        
    };
}
