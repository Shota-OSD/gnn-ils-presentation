// ============================================================
  // Slide 5: Results Bar Chart
  // ============================================================

  let slide5Drawn = false;

  function initSlide5() {
    if (slide5Drawn) return;
    slide5Drawn = true;

    const svg = d3.select("#slide5-chart");
    const svgW = +svg.attr("width"), svgH = +svg.attr("height");
    const margin = { top: 30, right: 40, bottom: 60, left: 80 };
    const w = svgW - margin.left - margin.right;
    const h = svgH - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(resultsData.map(d => d.label)).range([0, w]).padding(0.35);
    const y = d3.scaleLinear().domain([78, 100]).range([h, 0]);

    // Grid lines
    g.append("g").attr("class", "grid")
      .selectAll("line")
      .data([80, 85, 90, 95, 100])
      .enter().append("line")
      .attr("x1", 0).attr("x2", w)
      .attr("y1", d => y(d)).attr("y2", d => y(d))
      .attr("stroke", "#1a2040").attr("stroke-width", 1);

    // 80% baseline
    g.append("line")
      .attr("x1", 0).attr("x2", w)
      .attr("y1", y(80)).attr("y2", y(80))
      .attr("stroke", "rgba(255,255,255,0.3)").attr("stroke-width", 1).attr("stroke-dasharray", "4,3");
    g.append("text").attr("x", w + 5).attr("y", y(80) + 4)
      .attr("fill", "#888").attr("font-size", 12).text("80%");

    // X axis
    g.append("g").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll("text").attr("fill", "#ccc").attr("font-size", 14);
    g.append("text").attr("x", w / 2).attr("y", h + 45)
      .attr("text-anchor", "middle").attr("fill", "#aaa").attr("font-size", 16)
      .text("データの流れの数");

    // Y axis
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"))
      .selectAll("text").attr("fill", "#ccc").attr("font-size", 13);
    g.append("text").attr("x", -h / 2).attr("y", -55)
      .attr("text-anchor", "middle").attr("fill", "#aaa").attr("font-size", 16)
      .attr("transform", "rotate(-90)").text("理想への近さ（%）");

    // Remove axis lines
    g.selectAll(".domain").attr("stroke", "#333");
    g.selectAll(".tick line").attr("stroke", "#333");

    // Bars with stagger animation
    g.selectAll(".bar")
      .data(resultsData)
      .enter().append("rect")
      .attr("x", d => x(d.label))
      .attr("y", h)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", (d, i) => d3.interpolateCool(0.3 + i * 0.15))
      .attr("rx", 4)
      .transition().duration(1000).ease(d3.easeCubicOut)
      .delay((d, i) => i * 200)
      .attr("y", d => y(d.value))
      .attr("height", d => h - y(d.value));

    // Value labels
    g.selectAll(".val-label")
      .data(resultsData)
      .enter().append("text")
      .attr("x", d => x(d.label) + x.bandwidth() / 2)
      .attr("y", d => y(d.value) - 8)
      .attr("text-anchor", "middle")
      .attr("fill", "#fff").attr("font-size", 16).attr("font-weight", 700)
      .attr("opacity", 0)
      .text(d => Math.round(d.value) + "%")
      .transition().duration(600).delay((d, i) => 600 + i * 200)
      .attr("opacity", 1);
  }
