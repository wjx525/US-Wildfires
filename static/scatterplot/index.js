

//初始化图表信息;
const svgObject = {
  width: 850,
  height: 650,
  margin: { left: 100, right: 100, top: 60, bottom: 60 },

  renderSvg(id) {
    d3.select(`#${id}`).selectAll("*").remove();
    let svg = d3.select(`#${id}`).append("svg");

    svg.attr("width", this.width);
    svg.attr("height", this.height);

    let innerWidth = this.width - this.margin.left - this.margin.right;
    let innerHeight = this.height - this.margin.top - this.margin.bottom;
    const g = svg
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    return { svg, g, innerWidth, innerHeight };
  },
};

async function scatt() {
  const data = await d3.csv("classes_size_top0.1_new.csv");

  //init svg
  const scattObj = Object.create(svgObject);
  const { svg, g, innerWidth, innerHeight } = scattObj.renderSvg("scatt");

  //scale
  const xScale = d3
    .scaleUtc()
    .domain(d3.extent(data, (d) => new Date(d.DISCOVERY_DATE)))
    .range([0, innerWidth]);
  const yScale = d3
    .scaleLog()
    .base(7)
    .domain([0.1, 7 ** 7])
    .range([innerHeight, -1])
    .unknown(10);
  // const yScale=d3.scaleLog().domain([1,d3.max(data,d=>+d.FIRE_SIZE)]).range([innerHeight,0])

  const classSize = d3.groups(data, (d) => d.FIRE_SIZE_CLASS).map((d) => d[0]);
  classSize.sort()
  const color = d3
    .scaleOrdinal()
    .domain(classSize.reverse())
    .range(
      classSize.map((d, i) =>
        d3.interpolateInferno((i + 1) / (classSize.length + 2))
      )
    );
  //axis
  //y
  g.append("g").call(d3.axisLeft(yScale));
  //x
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale));

  //tip
  const html = (e, d, i) => {
    return `<li>${d.FIRE_SIZE_CLASS}</li>
    <li>${d.DISCOVERY_DATE}</li>
    <li>${d.FIRE_SIZE}</li>      
    `;
  };
  const tip = d3.tip().offset([0, 0]).attr("class", "d3-tip").html(html);
  g.call(tip);

  // scatter

  g.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => xScale(new Date(d.DISCOVERY_DATE)))
    .attr("cy", (d) => yScale(+d.FIRE_SIZE))
    .attr("r", 5)
    .attr("opacity", 0.8)
    .attr("stroke", "white")
    .attr("fill", (d) => color(d.FIRE_SIZE_CLASS))
    .on("mouseover", tip.show).on("mouseout", tip.hide)
    ;

  //label
  g.append("g")
    .attr("transform", `translate(-50,${innerHeight / 2}) rotate(270)`)
    .append("text")
    .text("Acres Burned (Log Scale)")
    .style('text-anchor', 'middle')
    .style("font-size", "12px"); 
  g.append("g")
    .attr("transform", `translate(${innerWidth / 2},${innerHeight + 40})`)
    .append("text")
    .text("Year")
    .style('text-anchor', 'middle')
    .style("font-size", "12px");

  addLegend(color, g, innerWidth + 20, 10, 10, "ordinary");
}
function addLegend(color, svg, x, y, count = 5, type = "linear") {
  const position = { top: y, left: x };
  const domain = color.domain();

  const g = svg
    .append("g")
    .attr("transform", `translate(${position.left},${position.top})`);
  count = type != "linear" ? domain.length : count;
  const data = Array(count).fill(1);
  data.forEach((d, i) => {
    if (type === "linear") {
      data[i] = ((domain[1] + domain[0]) / count) * i;
    } else {
      data[i] = domain[i];
    }
  });
  const h = 20,
    w = 20;

  g.selectAll("myrect")
    .data(data)
    .join("rect")
    .attr("fill", (d) => color(d))
    .attr("y", (d, i) => i * h + 10)
    .attr("x", 0)
    .attr("width", w)
    .attr("height", h);
  g.selectAll("myrect")
    .data(data)
    .join("text")
    .attr("fill", "gray")
    .attr("y", (d, i) => i * h + 26)
    .attr("x", 30)
    .text((d) => d);
}
scatt();
