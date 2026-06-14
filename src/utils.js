// ============================================================
  // Utility Functions
  // ============================================================

  function edgeKey(s, t) {
    return Math.min(s, t) + "-" + Math.max(s, t);
  }

  function utilColor(u) {
    if (u <= 0.35) return "#00e676";
    if (u <= 0.5) return d3.interpolateRgb("#00e676", "#ffeb3b")((u - 0.35) / 0.15);
    if (u <= 0.85) return d3.interpolateRgb("#ffeb3b", "#ff8a00")((u - 0.5) / 0.35);
    return d3.interpolateRgb("#ff8a00", "#ff1744")(Math.min((u - 0.85) / 0.05, 1));
  }

  function meterColor(u) {
    if (u <= 0.35) return "#00e676";
    if (u <= 0.85) return "#ffeb3b";
    return "#ff1744";
  }

  function computeEdgeLoads(flows, edges) {
    const loads = {};
    edges.forEach(e => { loads[edgeKey(e.source, e.target)] = 0; });
    flows.forEach(f => {
      for (let i = 0; i < f.path.length - 1; i++) {
        const k = edgeKey(f.path[i], f.path[i + 1]);
        if (loads[k] !== undefined) loads[k] += f.demand;
      }
    });
    return loads;
  }

  function drawEndpointBadges(svg, endpoints, nodeMap, options) {
    const className = (options && options.className) || "endpoint-badges";
    const badgeDistance = (options && options.badgeDistance) || 30;
    const badgeRadius = (options && options.badgeRadius) || 11;

    let layer = svg.select("." + className);
    if (layer.empty()) {
      layer = svg.append("g").attr("class", className);
    }

    const byNode = {};
    endpoints.forEach(endpoint => {
      if (!byNode[endpoint.nodeId]) byNode[endpoint.nodeId] = [];
      byNode[endpoint.nodeId].push(endpoint);
    });

    const positioned = [];
    Object.keys(byNode).forEach(nodeId => {
      const entries = byNode[nodeId];
      const node = nodeMap[nodeId];
      entries.forEach((endpoint, i) => {
        const angle = -Math.PI / 2 + (i - (entries.length - 1) / 2) * 0.72;
        positioned.push({
          ...endpoint,
          x: node.sx + Math.cos(angle) * badgeDistance,
          y: node.sy + Math.sin(angle) * badgeDistance,
        });
      });
    });

    const badges = layer.selectAll(".endpoint-badge")
      .data(positioned, d => d.id);

    const entered = badges.enter()
      .append("g")
      .attr("class", "endpoint-badge");

    entered.append("circle")
      .attr("r", badgeRadius);

    entered.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central");

    const merged = entered.merge(badges);
    merged.attr("transform", d => `translate(${d.x},${d.y})`);
    merged.select("circle").attr("fill", d => d.color);
    merged.select("text").text(d => d.kind);

    badges.exit().remove();
  }

  function updateCongestionEffects(layer, congestedEdges, nodeMap, options) {
    const settings = {
      warningThreshold: 0.9,
      overflowThreshold: 1.0,
      ringRadius: 12,
      overflowRingRadius: 14,
      effectScale: 1,
      ...options,
    };

    layer.selectAll("*").interrupt();
    layer.selectAll("*").remove();

    congestedEdges.forEach((edge, edgeIndex) => {
      const s = nodeMap[edge.source];
      const t = nodeMap[edge.target];
      const isOverflowing = edge.util > settings.overflowThreshold;
      const mainColor = isOverflowing ? "#ff1744" : "#ffeb3b";
      const secondaryColor = "#ff8a00";
      const dx = t.sx - s.sx;
      const dy = t.sy - s.sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;
      const mx = (s.sx + t.sx) / 2;
      const my = (s.sy + t.sy) / 2;
      const scale = settings.effectScale;
      const group = layer.append("g")
        .attr("class", "congestion-effect")
        .attr("data-key", edgeKey(edge.source, edge.target));

      group.append("circle")
        .attr("class", "congestion-warning-ring")
        .attr("cx", mx)
        .attr("cy", my)
        .attr("r", (isOverflowing ? settings.overflowRingRadius : settings.ringRadius) * scale)
        .attr("fill", "none")
        .attr("stroke", mainColor)
        .attr("stroke-width", (isOverflowing ? 3 : 2.5) * scale)
        .attr("opacity", 0.85)
        .attr("stroke-dasharray", "3,3");
      animateWarningRing(group.select(".congestion-warning-ring"), isOverflowing, scale);

      const jamRatios = isOverflowing ? [0.36, 0.44, 0.52, 0.6, 0.68] : [0.42, 0.5, 0.58];
      jamRatios.forEach((ratio, i) => {
        const jam = group.append("circle")
          .attr("class", "congestion-jam")
          .attr("cx", s.sx + dx * ratio)
          .attr("cy", s.sy + dy * ratio)
          .attr("r", (isOverflowing ? 5.5 + (i % 3) : 4.5 + i) * scale)
          .attr("fill", i % 2 === 0 ? mainColor : secondaryColor)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1)
          .attr("opacity", 0.95);
        animateJam(jam, ux, uy, i * 120, isOverflowing, scale);
      });

      const leakCount = isOverflowing ? (edge.util > 1.2 ? 10 : 7) : 4;
      for (let i = 0; i < leakCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const offset = (i - (leakCount - 1) / 2) * 3 * scale;
        const startX = mx + ux * offset;
        const startY = my + uy * offset;
        const leak = group.append("circle")
          .attr("class", "congestion-leak")
          .attr("cx", startX)
          .attr("cy", startY)
          .attr("r", (isOverflowing ? 3.7 : 2.8) * scale)
          .attr("fill", mainColor)
          .attr("opacity", 0);
        animateLeak(leak, startX, startY, nx * side, ny * side, edgeIndex * 140 + i * 100, isOverflowing, scale);
      }
    });
  }

  function animateWarningRing(selection, isOverflowing, scale) {
    const baseR = +selection.attr("r");
    function loop() {
      selection
        .attr("r", baseR)
        .attr("opacity", isOverflowing ? 0.95 : 0.75)
        .transition().duration(isOverflowing ? 520 : 700).ease(d3.easeCubicOut)
        .attr("r", baseR + (isOverflowing ? 9 : 6) * scale)
        .attr("opacity", 0.15)
        .transition().duration(120)
        .attr("r", baseR)
        .attr("opacity", isOverflowing ? 0.95 : 0.75)
        .on("end", loop);
    }
    loop();
  }

  function animateJam(selection, ux, uy, delay, isOverflowing, scale) {
    const startX = +selection.attr("cx");
    const startY = +selection.attr("cy");
    const travel = (isOverflowing ? 7 : 4) * scale;
    function loop() {
      selection
        .attr("cx", startX - ux * travel)
        .attr("cy", startY - uy * travel)
        .attr("opacity", 0.55)
        .transition().delay(delay).duration(isOverflowing ? 300 : 420).ease(d3.easeCubicInOut)
        .attr("cx", startX + ux * travel)
        .attr("cy", startY + uy * travel)
        .attr("opacity", 1)
        .transition().duration(isOverflowing ? 300 : 420).ease(d3.easeCubicInOut)
        .attr("cx", startX - ux * travel)
        .attr("cy", startY - uy * travel)
        .attr("opacity", 0.55)
        .on("end", loop);
    }
    loop();
  }

  function animateLeak(selection, startX, startY, nx, ny, delay, isOverflowing, scale) {
    const distance = (isOverflowing ? 48 : 28) * scale;
    function loop() {
      selection
        .attr("cx", startX)
        .attr("cy", startY)
        .attr("r", 3.2 * scale)
        .attr("opacity", 0)
        .transition().delay(delay).duration(isOverflowing ? 180 : 260).ease(d3.easeCubicOut)
        .attr("opacity", 0.95)
        .transition().duration(isOverflowing ? 780 : 900).ease(d3.easeCubicOut)
        .attr("cx", startX + nx * distance)
        .attr("cy", startY + ny * distance)
        .attr("r", 1.2 * scale)
        .attr("opacity", 0)
        .on("end", loop);
    }
    loop();
  }

  function drawMeter(svgId, util, maxScale) {
    maxScale = maxScale || 1.5;
    const svg = d3.select("#" + svgId);
    svg.selectAll("*").remove();
    const w = +svg.attr("width"), h = +svg.attr("height");
    const barW = w - 20;

    // Background
    svg.append("rect").attr("x", 10).attr("y", 5).attr("width", barW).attr("height", h - 10)
      .attr("rx", 5).attr("fill", "#1a1a3a");

    // Value bar
    const valW = Math.max(0, Math.min(util / maxScale, 1)) * barW;
    svg.append("rect").attr("x", 10).attr("y", 5).attr("width", 0).attr("height", h - 10)
      .attr("rx", 5).attr("fill", meterColor(util))
      .transition().duration(800).ease(d3.easeCubicInOut)
      .attr("width", valW);

    // 100% line
    const x100 = 10 + (1.0 / maxScale) * barW;
    svg.append("line").attr("x1", x100).attr("x2", x100).attr("y1", 0).attr("y2", h)
      .attr("stroke", "#ff1744").attr("stroke-width", 2).attr("stroke-dasharray", "4,2");
    svg.append("text").attr("x", x100).attr("y", h - 1).attr("text-anchor", "middle")
      .attr("fill", "#ff1744").attr("font-size", 10).text("限界");
  }
