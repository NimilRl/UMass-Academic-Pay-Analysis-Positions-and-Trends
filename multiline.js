let voronoi = false; // Initial state of the Voronoi diagram

document.getElementById('toggleVoronoi').addEventListener('change', function () {
    voronoi = this.checked;
    loaddata(); // Redraw chart when Voronoi toggle changes
});

// function loaddata() {
//     d3.json("unemployment.json").then(function (data) {
//         // Parse years if they are not in year format
//         data.forEach(d => {
//             d.year = new year(d.year);
//         });

//         drawChart(data); // Call drawChart function with the loaded data
//     });
// }

function loaddata() {
    d3.csv("coach_vs_faculty.csv", function (d) {
        return {
            job: d.POSITION_TITLE, // Combine positiontitle and Job fields
            year: new Date(+d.YEAR, 0, 1), // Convert year to year object
            payTotalActual: +d.NORMALIZED_ANNUAL_RATE // Convert PAY_TOTAL_ACTUAL to number
        };
    }).then(function (data) {
        data.forEach(d => {
            d.year = new Date(d.year);
        });
        drawChart(data); // Call drawChart function with the loaded data
    });
}





function drawChart(unemployment) {

    console.log(unemployment);

    // Clear existing content
    document.querySelector('.chart-container').innerHTML = '<svg id="chart"></svg>';

    const width = 1400;
    const height = 800;
    const marginTop = 5;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 30;

    const svg = d3.select('#chart')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');

    const x = d3.scaleUtc()
        .domain(d3.extent(unemployment, d => d.year))
        .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(unemployment, d => d.payTotalActual)]).nice()
        .range([height - marginBottom, marginTop]);

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("↑ pay total  (%)"));

    // More D3.js chart implementation here

    // Compute the points in pixel space as [x, y, z], where z is the name of the series.
    const points = unemployment.map((d) => [x(d.year), y(d.payTotalActual), d.job]);

    // An optional Voronoi display (for fun).
    if (voronoi) svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("d", d3.Delaunay
            .from(points)
            .voronoi([0, 0, width, height])
            .render());

    // Group the points by series.
    const groups = d3.rollup(points, v => Object.assign(v, {
        z: v[0][2]
    }), d => d[2]);

    // Draw the lines.
    const line = d3.line();
    const path = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .selectAll("path")
        .data(groups.values())
        .join("path")
        .style("mix-blend-mode", "multiply")
        .attr("d", line);

    // Add an invisible layer for the interactive tip.
    const dot = svg.append("g")
        .attr("display", "none");

    dot.append("circle")
        .attr("r", 2.5);

    dot.append("text")
        .attr("text-anchor", "middle")
        .attr("y", -8);

    svg
        .on("pointerenter", pointerentered)
        .on("pointermove", pointermoved)
        .on("pointerleave", pointerleft)
        .on("touchstart", event => event.preventDefault());

    return svg.node();

    // When the pointer moves, find the closest point, upyear the interactive tip, and highlight
    // the corresponding line. Note: we don't actually use Voronoi here, since an exhaustive search
    // is fast enough.
    function pointermoved(event) {
        const [xm, ym] = d3.pointer(event);
        const i = d3.leastIndex(points, ([x, y]) => Math.hypot(x - xm, y - ym));
        const [x, y, k] = points[i];
        path.style("stroke", ({
            z
        }) => z === k ? null : "#ddd").filter(({
            z
        }) => z === k).raise();
        dot.attr("transform", `translate(${x},${y})`);
        dot.select("text").text(k);
        svg.property("value", unemployment[i]).dispatch("input", {
            bubbles: true
        });
    }

    function pointerentered() {
        path.style("mix-blend-mode", null).style("stroke", "#ddd");
        dot.attr("display", null);
    }

    function pointerleft() {
        path.style("mix-blend-mode", "multiply").style("stroke", null);
        dot.attr("display", "none");
        svg.node().value = null;
        svg.dispatch("input", {
            bubbles: true
        });
    }
}
loaddata()