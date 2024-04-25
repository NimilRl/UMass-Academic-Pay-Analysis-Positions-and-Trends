function _1(md){return(
md`
# <h1 style="text-align: center;">Hierarchical Bar Chart: Exploring Data Hierarchy and Variance</h1>

<p style="text-align: center;">Step into the world of hierarchical data visualization with our innovative hierarchical bar chart! 🌳 This dynamic chart provides a visual representation of the hierarchy and differences within the dataset across all fields. Each bar represents a category or sub-category, showcasing the hierarchical structure of the data. 📈 By observing the varying lengths of bars and their positions within the hierarchy, you can easily discern the relative importance and relationships between different data points. Dive deep into the intricate layers of your dataset and uncover valuable insights with this powerful visualization tool! 🚀💡</p>`
)}

function _chart(d3,width,height,x,root,up,xAxis,yAxis,down)
{
  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto;");

  x.domain([0, root.value]);

  svg.append("rect")
      .attr("class", "background")
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .attr("width", width)
      .attr("height", height)
      .attr("cursor", "pointer")
      .on("click", (event, d) => up(svg, d));

  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);

  down(svg, root);

  return svg.node();
}


function _bar(marginTop,barStep,barPadding,marginLeft,x){return(
function bar(svg, down, d, selector) {
  const g = svg.insert("g", selector)
      .attr("class", "enter")
      .attr("transform", `translate(0,${marginTop + barStep * barPadding})`)
      .attr("text-anchor", "end")
      .style("font", "10px sans-serif");

  const bar = g.selectAll("g")
    .data(d.children)
    .join("g")
      .attr("cursor", d => !d.children ? null : "pointer")
      .on("click", (event, d) => down(svg, d));

  bar.append("text")
      .attr("x", marginLeft - 6)
      .attr("y", barStep * (1 - barPadding) / 2)
      .attr("dy", ".35em")
      .text(d => d.data.name);

  bar.append("rect")
      .attr("x", x(0))
      .attr("width", d => x(d.value) - x(0))
      .attr("height", barStep * (1 - barPadding));

  return g;
}
)}

function _down(d3,duration,bar,stack,stagger,x,xAxis,barStep,color){return(
function down(svg, d) {
  if (!d.children || d3.active(svg.node())) return;

  // Rebind the current node to the background.
  svg.select(".background").datum(d);

  // Define two sequenced transitions.
  const transition1 = svg.transition().duration(duration);
  const transition2 = transition1.transition();

  // Mark any currently-displayed bars as exiting.
  const exit = svg.selectAll(".enter")
      .attr("class", "exit");

  // Entering nodes immediately obscure the clicked-on bar, so hide it.
  exit.selectAll("rect")
      .attr("fill-opacity", p => p === d ? 0 : null);

  // Transition exiting bars to fade out.
  exit.transition(transition1)
      .attr("fill-opacity", 0)
      .remove();

  // Enter the new bars for the clicked-on data.
  // Per above, entering bars are immediately visible.
  const enter = bar(svg, down, d, ".y-axis")
      .attr("fill-opacity", 0);

  // Have the text fade-in, even though the bars are visible.
  enter.transition(transition1)
      .attr("fill-opacity", 1);

  // Transition entering bars to their new y-position.
  enter.selectAll("g")
      .attr("transform", stack(d.index))
    .transition(transition1)
      .attr("transform", stagger());

  // Update the x-scale domain.
  x.domain([0, d3.max(d.children, d => d.value)]);

  // Update the x-axis.
  svg.selectAll(".x-axis").transition(transition2)
      .call(xAxis);

  // Transition entering bars to the new x-scale.
  enter.selectAll("g").transition(transition2)
      .attr("transform", (d, i) => `translate(0,${barStep * i})`);

  // Color the bars as parents; they will fade to children if appropriate.
  enter.selectAll("rect")
      .attr("fill", color(true))
      .attr("fill-opacity", 1)
    .transition(transition2)
      .attr("fill", d => color(!!d.children))
      .attr("width", d => x(d.value) - x(0));
}
)}

function _up(duration,x,d3,xAxis,stagger,stack,color,bar,down,barStep){return(
function up(svg, d) {
  if (!d.parent || !svg.selectAll(".exit").empty()) return;

  // Rebind the current node to the background.
  svg.select(".background").datum(d.parent);

  // Define two sequenced transitions.
  const transition1 = svg.transition().duration(duration);
  const transition2 = transition1.transition();

  // Mark any currently-displayed bars as exiting.
  const exit = svg.selectAll(".enter")
      .attr("class", "exit");

  // Update the x-scale domain.
  x.domain([0, d3.max(d.parent.children, d => d.value)]);

  // Update the x-axis.
  svg.selectAll(".x-axis").transition(transition1)
      .call(xAxis);

  // Transition exiting bars to the new x-scale.
  exit.selectAll("g").transition(transition1)
      .attr("transform", stagger());

  // Transition exiting bars to the parent’s position.
  exit.selectAll("g").transition(transition2)
      .attr("transform", stack(d.index));

  // Transition exiting rects to the new scale and fade to parent color.
  exit.selectAll("rect").transition(transition1)
      .attr("width", d => x(d.value) - x(0))
      .attr("fill", color(true));

  // Transition exiting text to fade out.
  // Remove exiting nodes.
  exit.transition(transition2)
      .attr("fill-opacity", 0)
      .remove();

  // Enter the new bars for the clicked-on data's parent.
  const enter = bar(svg, down, d.parent, ".exit")
      .attr("fill-opacity", 0);

  enter.selectAll("g")
      .attr("transform", (d, i) => `translate(0,${barStep * i})`);

  // Transition entering bars to fade in over the full duration.
  enter.transition(transition2)
      .attr("fill-opacity", 1);

  // Color the bars as appropriate.
  // Exiting nodes will obscure the parent bar, so hide it.
  // Transition entering rects to the new x-scale.
  // When the entering parent rect is done, make it visible!
  enter.selectAll("rect")
      .attr("fill", d => color(!!d.children))
      .attr("fill-opacity", p => p === d ? 0 : null)
    .transition(transition2)
      .attr("width", d => x(d.value) - x(0))
      .on("end", function(p) { d3.select(this).attr("fill-opacity", 1); });
}
)}

function _stack(x,barStep){return(
function stack(i) {
  let value = 0;
  return d => {
    const t = `translate(${x(value) - x(0)},${barStep * i})`;
    value += d.value;
    return t;
  };
}
)}

function _stagger(x,barStep){return(
function stagger() {
  let value = 0;
  return (d, i) => {
    const t = `translate(${x(value) - x(0)},${barStep * i})`;
    value += d.value;
    return t;
  };
}
)}

function _root(d3,data){return(
d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value)
    .eachAfter(d => d.index = d.parent ? d.parent.index = d.parent.index + 1 || 0 : 0)
)}

function _data(FileAttachment){return(
FileAttachment("flare-2.json").json()
)}

function _x(d3,marginLeft,width,marginRight){return(
d3.scaleLinear().range([marginLeft, width - marginRight])
)}

function _xAxis(marginTop,d3,x,width){return(
g => g
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${marginTop})`)
    .call(d3.axisTop(x).ticks(width / 80, "s"))
    .call(g => (g.selection ? g.selection() : g).select(".domain").remove())
)}

function _yAxis(marginLeft,marginTop,height,marginBottom){return(
g => g
    .attr("class", "y-axis")
    .attr("transform", `translate(${marginLeft + 0.5},0)`)
    .call(g => g.append("line")
        .attr("stroke", "currentColor")
        .attr("y1", marginTop)
        .attr("y2", height - marginBottom))
)}

function _color(d3){return(
d3.scaleOrdinal([true, false], ["steelblue", "#aaa"])
)}

function _barStep(){return(
27
)}

function _barPadding(barStep){return(
3 / barStep
)}

function _duration(){return(
750
)}

function _height(root,barStep,marginTop,marginBottom)
{
  let max = 1;
  root.each(d => d.children && (max = Math.max(max, d.children.length)));
  return max * barStep + marginTop + marginBottom;
}


function _marginTop(){return(
30
)}

function _marginRight(){return(
30
)}

function _marginBottom(){return(
0
)}

function _marginLeft(){return(
100
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["flare-2.json", {url: new URL("./files/data.json", import.meta.url), mimeType: "application/json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("chart")).define("chart", ["d3","width","height","x","root","up","xAxis","yAxis","down"], _chart);
  main.variable(observer("bar")).define("bar", ["marginTop","barStep","barPadding","marginLeft","x"], _bar);
  main.variable(observer("down")).define("down", ["d3","duration","bar","stack","stagger","x","xAxis","barStep","color"], _down);
  main.variable(observer("up")).define("up", ["duration","x","d3","xAxis","stagger","stack","color","bar","down","barStep"], _up);
  main.variable(observer("stack")).define("stack", ["x","barStep"], _stack);
  main.variable(observer("stagger")).define("stagger", ["x","barStep"], _stagger);
  main.variable(observer("root")).define("root", ["d3","data"], _root);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  main.variable(observer("x")).define("x", ["d3","marginLeft","width","marginRight"], _x);
  main.variable(observer("xAxis")).define("xAxis", ["marginTop","d3","x","width"], _xAxis);
  main.variable(observer("yAxis")).define("yAxis", ["marginLeft","marginTop","height","marginBottom"], _yAxis);
  main.variable(observer("color")).define("color", ["d3"], _color);
  main.variable(observer("barStep")).define("barStep", _barStep);
  main.variable(observer("barPadding")).define("barPadding", ["barStep"], _barPadding);
  main.variable(observer("duration")).define("duration", _duration);
  main.variable(observer("height")).define("height", ["root","barStep","marginTop","marginBottom"], _height);
  main.variable(observer("marginTop")).define("marginTop", _marginTop);
  main.variable(observer("marginRight")).define("marginRight", _marginRight);
  main.variable(observer("marginBottom")).define("marginBottom", _marginBottom);
  main.variable(observer("marginLeft")).define("marginLeft", _marginLeft);
  return main;
}
