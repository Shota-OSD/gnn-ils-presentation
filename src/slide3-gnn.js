// ============================================================
  // Slide 3: Message Passing Visualization
  // ============================================================

  let slide3Layer = 0;
  const slide3MaxLayer = 3;
  let slide3AdjList = {};
  const slide3BaseColors = [
    "#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6",
    "#00d4ff", "#ff006e", "#00e676", "#ffeb3b", "#ff8a00",
    "#7c4dff", "#26a69a", "#ef5350", "#90caf9",
  ];

  function initSlide3() {
    slide3Layer = 0;
    const svg = d3.select("#slide3-graph");
    svg.selectAll("*").remove();

    const svgW = +svg.attr("width"), svgH = +svg.attr("height");
    const sx = svgW / 840, sy = svgH / 460;

    const nodes = NSFNET.nodes.map(n => ({
      ...n, sx: n.x * sx + 20, sy: n.y * sy + 10
    }));
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    // Build adjacency list
    slide3AdjList = {};
    NSFNET.nodes.forEach(n => { slide3AdjList[n.id] = []; });
    NSFNET.edges.forEach(e => {
      slide3AdjList[e.source].push(e.target);
      slide3AdjList[e.target].push(e.source);
    });

    const defs = svg.append("defs");
    nodes.forEach(n => {
      defs.append("linearGradient")
        .attr("id", slide3GradientId(n.id))
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
    });
    updateSlide3Gradients(svg, 0);

    // Draw edges
    const edgeGroup = svg.append("g").attr("class", "edges");
    NSFNET.edges.forEach(e => {
      edgeGroup.append("line")
        .attr("class", "edge3")
        .attr("data-src", e.source).attr("data-tgt", e.target)
        .attr("x1", nodeMap[e.source].sx).attr("y1", nodeMap[e.source].sy)
        .attr("x2", nodeMap[e.target].sx).attr("y2", nodeMap[e.target].sy)
        .attr("stroke", "#2a3060").attr("stroke-width", 2);
    });

    // Message layer
    svg.append("g").attr("class", "messages");

    // Draw nodes
    const nodeGroup = svg.append("g").attr("class", "nodes");
    nodes.forEach(n => {
      nodeGroup.append("circle")
        .attr("class", "node3")
        .attr("data-id", n.id)
        .attr("cx", n.sx).attr("cy", n.sy)
        .attr("r", 13)
        .attr("fill", `url(#${slide3GradientId(n.id)})`)
        .attr("stroke", "#fff").attr("stroke-width", 1.8)
        .attr("cursor", "pointer")
        .on("mouseover", function() { highlightHop(n.id); })
        .on("mouseout", function() { resetHighlight(); });
      nodeGroup.append("text")
        .attr("class", "node3-label")
        .attr("data-id", n.id)
        .attr("x", n.sx).attr("y", n.sy + 4)
        .attr("text-anchor", "middle").attr("fill", "#fff")
        .attr("stroke", "#0a0e27").attr("stroke-width", 3).attr("paint-order", "stroke")
        .attr("font-size", 11).attr("font-weight", 700)
        .attr("pointer-events", "none")
        .text(n.label);
    });

    updateSlide3Label();
  }

  function propagateOnce() {
    if (slide3Layer >= slide3MaxLayer) return;
    slide3Layer++;

    const svg = d3.select("#slide3-graph");
    const nodeMap = {};
    NSFNET.nodes.forEach(n => { nodeMap[n.id] = n; });
    const svgW = +svg.attr("width"), svgH = +svg.attr("height");
    const sx = svgW / 840, sy = svgH / 460;

    // Animate messages along edges
    const msgGroup = svg.select(".messages");
    NSFNET.edges.forEach(e => {
      const s = nodeMap[e.source], t = nodeMap[e.target];
      // Both directions
      [[s, t], [t, s]].forEach(([from, to]) => {
        msgGroup.append("circle")
          .attr("cx", from.x * sx + 20).attr("cy", from.y * sy + 10)
          .attr("r", 4).attr("fill", "#00d4ff").attr("opacity", 0.9)
          .transition().duration(800).ease(d3.easeCubicInOut)
          .attr("cx", to.x * sx + 20).attr("cy", to.y * sy + 10)
          .transition().duration(200).attr("opacity", 0).remove();
      });
    });

    // Update node sizes and colors after messages arrive
    setTimeout(() => {
      const layer = slide3Layer;
      updateSlide3Gradients(svg, layer);
      svg.selectAll(".node3")
        .transition().duration(500).ease(d3.easeCubicInOut)
        .attr("r", 13 + layer * 4);
    }, 850);

    updateSlide3Label();
  }

  function updateSlide3Label() {
    d3.select("#layer-label").text("現在: Layer " + slide3Layer + " / " + slide3MaxLayer);
    d3.select("#btn-propagate").property("disabled", slide3Layer >= slide3MaxLayer);
  }

  function slide3ReachableNodes(nodeId, hops) {
    const visited = new Set();
    let frontier = [nodeId];
    visited.add(nodeId);
    for (let i = 0; i < hops; i++) {
      const next = [];
      frontier.forEach(nid => {
        (slide3AdjList[nid] || []).forEach(nbr => {
          if (!visited.has(nbr)) { visited.add(nbr); next.push(nbr); }
        });
      });
      frontier = next;
    }
    return [...visited];
  }

  function slide3GradientId(nodeId) {
    return "slide3-node-gradient-" + nodeId;
  }

  function updateSlide3Gradients(svg, layer) {
    NSFNET.nodes.forEach(n => {
      const colors = slide3ReachableNodes(n.id, layer)
        .map(id => slide3BaseColors[id % slide3BaseColors.length]);
      const stops = colors.length === 1
        ? [
            { offset: "0%", color: colors[0] },
            { offset: "100%", color: colors[0] },
          ]
        : colors.map((color, i) => ({
            offset: Math.round((i / (colors.length - 1)) * 100) + "%",
            color,
          }));

      const gradient = svg.select("#" + slide3GradientId(n.id));
      const stopSel = gradient.selectAll("stop")
        .data(stops);

      stopSel.enter()
        .append("stop")
        .merge(stopSel)
        .transition().duration(500).ease(d3.easeCubicInOut)
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

      stopSel.exit().remove();
    });
  }

  function highlightHop(nodeId) {
    // BFS to find nodes within slide3Layer hops
    const visited = new Set();
    let frontier = [nodeId];
    visited.add(nodeId);
    for (let i = 0; i < slide3Layer; i++) {
      const next = [];
      frontier.forEach(nid => {
        (slide3AdjList[nid] || []).forEach(nbr => {
          if (!visited.has(nbr)) { visited.add(nbr); next.push(nbr); }
        });
      });
      frontier = next;
    }

    d3.selectAll(".node3").transition().duration(300)
      .attr("opacity", function() {
        return visited.has(+d3.select(this).attr("data-id")) ? 1 : 0.15;
      });
    d3.selectAll(".edge3").transition().duration(300)
      .attr("opacity", function() {
        const s = +d3.select(this).attr("data-src");
        const t = +d3.select(this).attr("data-tgt");
        return (visited.has(s) && visited.has(t)) ? 1 : 0.1;
      });
  }

  function resetHighlight() {
    d3.selectAll(".node3").transition().duration(300).attr("opacity", 1);
    d3.selectAll(".edge3").transition().duration(300).attr("opacity", 1);
  }
