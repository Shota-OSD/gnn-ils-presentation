// ============================================================
  // Slide 4: Improvement Steps
  // ============================================================

  let slide4Step = 0;
  let slide4AutoTimer = null;
  let slide4PacketTimer = null;

  function initSlide4() {
    slide4Step = 0;
    stopSlide4Auto();
    const svg = d3.select("#slide4-graph");
    svg.selectAll("*").remove();

    const svgW = +svg.attr("width"), svgH = +svg.attr("height");
    const sx = svgW / 840, sy = svgH / 460;

    const nodes = NSFNET.nodes.map(n => ({
      ...n, sx: n.x * sx + 20, sy: n.y * sy + 10
    }));
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    // Draw edges
    const edgeGroup = svg.append("g").attr("class", "edges4");
    NSFNET.edges.forEach(e => {
      edgeGroup.append("line")
        .attr("class", "edge4")
        .attr("data-key", edgeKey(e.source, e.target))
        .attr("x1", nodeMap[e.source].sx).attr("y1", nodeMap[e.source].sy)
        .attr("x2", nodeMap[e.target].sx).attr("y2", nodeMap[e.target].sy)
        .attr("stroke", "#2a3060").attr("stroke-width", 4)
        .attr("stroke-linecap", "round");
    });

    svg.append("g").attr("class", "link-load-labels");
    svg.append("g").attr("class", "congestion-effects");

    // Old path layer (dashed lines for previous route)
    svg.append("g").attr("class", "oldpaths");
    // Packet layer
    svg.append("g").attr("class", "packets4");

    // Draw nodes
    const nodeGroup = svg.append("g").attr("class", "nodes4");
    nodes.forEach(n => {
      nodeGroup.append("circle")
        .attr("cx", n.sx).attr("cy", n.sy).attr("r", 14)
        .attr("fill", "#4fc3f7").attr("stroke", "#0a0e27").attr("stroke-width", 2);
      nodeGroup.append("text")
        .attr("x", n.sx).attr("y", n.sy + 4)
        .attr("text-anchor", "middle").attr("fill", "#0a0e27")
        .attr("font-size", 11).attr("font-weight", 700)
        .text(n.label);
    });

    renderSlide4Step(0, false);
  }

  function renderSlide4Step(step, animate) {
    const stepData = improvementSteps[step];
    const flows = stepData.flows || improvementSteps[step - 1].flows;
    const svg = d3.select("#slide4-graph");
    const svgW = +svg.attr("width"), svgH = +svg.attr("height");
    const sx = svgW / 840, sy = svgH / 460;
    const nodeMap = {};
    NSFNET.nodes.forEach(n => { nodeMap[n.id] = { ...n, sx: n.x * sx + 20, sy: n.y * sy + 10 }; });
    const dur = animate ? 1000 : 0;

    // Compute loads
    const loads = computeEdgeLoads(flows, NSFNET.edges);
    const rawMaxUtil = d3.max(NSFNET.edges, e => loads[edgeKey(e.source, e.target)] / e.capacity) || 1;
    const utilScale = stepData.maxUtil / rawMaxUtil;
    const congestedEdges = [];

    // Update edges
    NSFNET.edges.forEach(e => {
      const k = edgeKey(e.source, e.target);
      const u = (loads[k] / e.capacity) * utilScale;
      if (u >= 0.9) congestedEdges.push({ ...e, util: u });
      const sel = svg.select(`.edge4[data-key="${k}"]`);
      if (animate) {
        sel.transition().duration(dur).ease(d3.easeCubicInOut)
          .attr("stroke", utilColor(u)).attr("stroke-width", 4);
      } else {
        sel.attr("stroke", utilColor(u)).attr("stroke-width", 4);
      }
      // Pulsing for overloaded
      if (u > 1.0) {
        sel.classed("link-overloaded", true);
      } else {
        sel.classed("link-overloaded", false);
      }
    });

    updateSlide4LoadLabels(loads, nodeMap, animate, utilScale);
    updateCongestionEffects(svg.select(".congestion-effects"), congestedEdges, nodeMap);
    drawEndpointBadges(
      svg,
      flows.flatMap(f => ([
        { id: "s-" + f.id, nodeId: f.path[0], kind: "S", color: f.color },
        { id: "g-" + f.id, nodeId: f.path[f.path.length - 1], kind: "G", color: f.color },
      ])),
      nodeMap,
      { className: "endpoint-badges4", badgeDistance: 27, badgeRadius: 10 }
    );

    // Show old path if changed
    const oldPathGroup = svg.select(".oldpaths");
    oldPathGroup.selectAll("*").remove();
    if (animate && stepData.changedFlow) {
      const cf = stepData.changedFlow;
      const oldP = cf.oldPath;
      for (let i = 0; i < oldP.length - 1; i++) {
        const s = nodeMap[oldP[i]], t = nodeMap[oldP[i + 1]];
        oldPathGroup.append("line")
          .attr("x1", s.sx).attr("y1", s.sy)
          .attr("x2", t.sx).attr("y2", t.sy)
          .attr("stroke", flows[cf.id].color).attr("stroke-width", 3)
          .attr("stroke-dasharray", "6,4").attr("opacity", 0.7)
          .transition().duration(1200).attr("opacity", 0).remove();
      }
    }

    // Update meter
    drawMeter("slide4-meter", stepData.maxUtil);
    const pct = Math.round(stepData.maxUtil * 100);
    d3.select("#slide4-meter-label").text("Step: " + step + "/5　混雑度: " + pct + "%")
      .style("color", meterColor(stepData.maxUtil));

    // Update description
    const descEl = d3.select("#step-description");
    if (step === 5) {
      descEl.html("").append("div").attr("class", "completion-banner")
        .text(stepData.description);
    } else {
      descEl.text(stepData.description);
    }

    // Buttons
    d3.select("#btn-prev").property("disabled", step <= 0);
    d3.select("#btn-next").property("disabled", step >= 5);

    // Packets
    startSlide4Packets(flows);
  }

  function startSlide4Packets(flows) {
    if (slide4PacketTimer) clearInterval(slide4PacketTimer);
    const svg = d3.select("#slide4-graph");
    const pktGroup = svg.select(".packets4");
    pktGroup.selectAll("*").remove();

    const svgW = +svg.attr("width"), svgH = +svg.attr("height");
    const sx = svgW / 840, sy = svgH / 460;
    const nodeMap = {};
    NSFNET.nodes.forEach(n => { nodeMap[n.id] = { sx: n.x * sx + 20, sy: n.y * sy + 10 }; });

    function spawn() {
      flows.forEach(f => {
        const p = f.path;
        const totalDur = 2000;
        const segDur = totalDur / (p.length - 1);
        const pkt = pktGroup.append("circle")
          .attr("cx", nodeMap[p[0]].sx).attr("cy", nodeMap[p[0]].sy)
          .attr("r", 5 + f.demand * 0.7)
          .attr("fill", f.color)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.3)
          .attr("opacity", 0.92);
        let chain = pkt;
        for (let j = 1; j < p.length; j++) {
          chain = chain.transition().duration(segDur).ease(d3.easeLinear)
            .attr("cx", nodeMap[p[j]].sx).attr("cy", nodeMap[p[j]].sy);
        }
        chain.transition().duration(200).attr("opacity", 0).remove();
      });
    }
    spawn();
    slide4PacketTimer = setInterval(spawn, 2500);
  }

  function updateSlide4LoadLabels(loads, nodeMap, animate, utilScale) {
    const svg = d3.select("#slide4-graph");
    const labels = svg.select(".link-load-labels")
      .selectAll(".link-load-label")
      .data(NSFNET.edges, d => edgeKey(d.source, d.target));

    const entered = labels.enter()
      .append("g")
      .attr("class", "link-load-label");

    entered.append("rect")
      .attr("x", -17)
      .attr("y", -9)
      .attr("width", 34)
      .attr("height", 18)
      .attr("rx", 4);

    entered.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central");

    const merged = entered.merge(labels);
    const dur = animate ? 1000 : 0;

    merged.transition().duration(dur).ease(d3.easeCubicInOut)
      .attr("transform", d => {
        const s = nodeMap[d.source], t = nodeMap[d.target];
        const mx = (s.sx + t.sx) / 2;
        const my = (s.sy + t.sy) / 2;
        const dx = t.sx - s.sx;
        const dy = t.sy - s.sy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        return `translate(${mx + (-dy / len) * 12},${my + (dx / len) * 12})`;
      });

    merged.select("rect")
      .transition().duration(dur).ease(d3.easeCubicInOut)
      .attr("fill", d => meterColor((loads[edgeKey(d.source, d.target)] / d.capacity) * utilScale));

    merged.select("text")
      .attr("fill", d => {
        const u = (loads[edgeKey(d.source, d.target)] / d.capacity) * utilScale;
        return u > 1.0 ? "#fff" : "#0a0e27";
      })
      .text(d => Math.round((loads[edgeKey(d.source, d.target)] / d.capacity) * utilScale * 100) + "%");

    labels.exit().remove();
  }

  function stopSlide4Packets() {
    if (slide4PacketTimer) { clearInterval(slide4PacketTimer); slide4PacketTimer = null; }
    d3.select(".packets4").selectAll("*").remove();
  }

  function stopSlide4Auto() {
    if (slide4AutoTimer) { clearInterval(slide4AutoTimer); slide4AutoTimer = null; }
    d3.select("#btn-autoplay").classed("active", false).text("自動再生");
  }
