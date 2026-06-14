// ============================================================
  // Slide 2: Problem Demo
  // ============================================================

  let slide2Packets = [];
  let slide2PacketTimer = null;
  let slide2Mode = "shortest";

  function initSlide2() {
    const svg = d3.select("#slide2-graph");
    svg.selectAll("*").remove();
    const data = demoSmall;
    const nodeMap = {};
    data.nodes.forEach(n => { nodeMap[n.id] = n; });

    // Scale nodes to fit SVG
    const svgW = +svg.attr("width"), svgH = +svg.attr("height");
    const sx = svgW / 800, sy = svgH / 380;
    data.nodes.forEach(n => { n.sx = n.x * sx + 20; n.sy = n.y * sy + 10; });

    // Draw edges
    const edgeGroup = svg.append("g").attr("class", "edges");
    data.edges.forEach(e => {
      edgeGroup.append("line")
        .attr("class", "edge")
        .attr("data-key", edgeKey(e.source, e.target))
        .attr("x1", nodeMap[e.source].sx).attr("y1", nodeMap[e.source].sy)
        .attr("x2", nodeMap[e.target].sx).attr("y2", nodeMap[e.target].sy)
        .attr("stroke", "#00e676").attr("stroke-width", 5)
        .attr("stroke-linecap", "round");
    });

    svg.append("g").attr("class", "link-load-labels");
    svg.append("g").attr("class", "congestion-effects");

    // Packet layer
    svg.append("g").attr("class", "packets");

    // Draw nodes
    const nodeGroup = svg.append("g").attr("class", "nodes");
    data.nodes.forEach(n => {
      // Check if this node is src or dst for any commodity
      const comRings = data.commodities.filter(c => c.src === n.id || c.dst === n.id);
      comRings.forEach((c, i) => {
        nodeGroup.append("circle")
          .attr("cx", n.sx).attr("cy", n.sy).attr("r", 22 + i * 5)
          .attr("fill", "none").attr("stroke", c.color).attr("stroke-width", 2.5)
          .attr("opacity", 0.7);
      });

      nodeGroup.append("circle")
        .attr("cx", n.sx).attr("cy", n.sy).attr("r", 18)
        .attr("fill", "#4fc3f7").attr("stroke", "#0a0e27").attr("stroke-width", 2);
      nodeGroup.append("text")
        .attr("x", n.sx).attr("y", n.sy + 5)
        .attr("text-anchor", "middle").attr("fill", "#0a0e27")
        .attr("font-size", 14).attr("font-weight", 700)
        .text(n.label);
    });

    drawEndpointBadges(
      svg,
      data.commodities.flatMap(c => ([
        { id: "s-" + c.id, nodeId: c.src, kind: "S", color: c.color },
        { id: "g-" + c.id, nodeId: c.dst, kind: "G", color: c.color },
      ])),
      nodeMap,
      { className: "endpoint-badges2", badgeDistance: 32, badgeRadius: 12 }
    );

    updateSlide2("shortest");
  }

  function updateSlide2(mode) {
    slide2Mode = mode;
    const data = demoSmall;
    const nodeMap = {};
    data.nodes.forEach(n => { nodeMap[n.id] = n; });

    const paths = mode === "shortest" ? data.shortestPaths : data.balancedPaths;

    // Compute edge loads
    const loads = {};
    data.edges.forEach(e => { loads[edgeKey(e.source, e.target)] = 0; });
    data.commodities.forEach((c, i) => {
      const p = paths[i];
      for (let j = 0; j < p.length - 1; j++) {
        const k = edgeKey(p[j], p[j + 1]);
        loads[k] += c.demand;
      }
    });

    // Max utilization
    let maxUtil = 0;
    data.edges.forEach(e => {
      const k = edgeKey(e.source, e.target);
      const u = loads[k] / e.capacity;
      if (u > maxUtil) maxUtil = u;
    });

    // Update edges
    const svg = d3.select("#slide2-graph");
    const congestedEdges = [];
    data.edges.forEach(e => {
      const k = edgeKey(e.source, e.target);
      const u = loads[k] / e.capacity;
      if (u >= 0.89) congestedEdges.push({ ...e, util: u });
      svg.select(`line[data-key="${k}"]`)
        .transition().duration(800).ease(d3.easeCubicInOut)
        .attr("stroke", utilColor(u))
        .attr("stroke-width", 5);
    });

    updateSlide2LoadLabels(loads, nodeMap);
    updateCongestionEffects(svg.select(".congestion-effects"), congestedEdges, nodeMap, { effectScale: 1.05 });

    // Update meter
    drawMeter("slide2-meter", maxUtil);
    const pct = Math.round(maxUtil * 100);
    d3.select("#slide2-meter-label").text("最大混雑度: " + pct + "%")
      .style("color", meterColor(maxUtil));

    // Buttons
    d3.select("#btn-shortest").classed("active", mode === "shortest");
    d3.select("#btn-balanced").classed("active", mode === "balanced");

    // Start packet animation
    startSlide2Packets(paths);
  }

  function startSlide2Packets(paths) {
    if (slide2PacketTimer) clearInterval(slide2PacketTimer);
    const data = demoSmall;
    const nodeMap = {};
    data.nodes.forEach(n => { nodeMap[n.id] = n; });
    const svg = d3.select("#slide2-graph .packets");

    function spawnPackets() {
      data.commodities.forEach((c, i) => {
        const p = paths[i];
        const totalDur = 2000;
        const segDur = totalDur / (p.length - 1);

        const pkt = svg.append("circle")
          .attr("cx", nodeMap[p[0]].sx).attr("cy", nodeMap[p[0]].sy)
          .attr("r", 5.5 + c.demand * 0.7)
          .attr("fill", c.color)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.95);

        let chain = pkt;
        for (let j = 1; j < p.length; j++) {
          chain = chain.transition().duration(segDur).ease(d3.easeLinear)
            .attr("cx", nodeMap[p[j]].sx).attr("cy", nodeMap[p[j]].sy);
        }
        chain.transition().duration(200).attr("opacity", 0).remove();
      });
    }

    spawnPackets();
    slide2PacketTimer = setInterval(spawnPackets, 2500);
  }

  function updateSlide2LoadLabels(loads, nodeMap) {
    const svg = d3.select("#slide2-graph");
    const labels = svg.select(".link-load-labels")
      .selectAll(".link-load-label")
      .data(demoSmall.edges, d => edgeKey(d.source, d.target));

    const entered = labels.enter()
      .append("g")
      .attr("class", "link-load-label");

    entered.append("rect")
      .attr("x", -18)
      .attr("y", -10)
      .attr("width", 36)
      .attr("height", 20)
      .attr("rx", 4);

    entered.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central");

    entered.merge(labels)
      .transition().duration(800).ease(d3.easeCubicInOut)
      .attr("transform", d => {
        const s = nodeMap[d.source], t = nodeMap[d.target];
        const mx = (s.sx + t.sx) / 2;
        const my = (s.sy + t.sy) / 2;
        const dx = t.sx - s.sx;
        const dy = t.sy - s.sy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        return `translate(${mx + (-dy / len) * 14},${my + (dx / len) * 14})`;
      });

    entered.merge(labels).select("rect")
      .transition().duration(800).ease(d3.easeCubicInOut)
      .attr("fill", d => meterColor(loads[edgeKey(d.source, d.target)] / d.capacity));

    entered.merge(labels).select("text")
      .attr("fill", d => {
        const u = loads[edgeKey(d.source, d.target)] / d.capacity;
        return u > 1.0 ? "#fff" : "#0a0e27";
      })
      .text(d => Math.round((loads[edgeKey(d.source, d.target)] / d.capacity) * 100) + "%");

    labels.exit().remove();
  }

  function stopSlide2Packets() {
    if (slide2PacketTimer) { clearInterval(slide2PacketTimer); slide2PacketTimer = null; }
    d3.select("#slide2-graph .packets").selectAll("*").remove();
  }
