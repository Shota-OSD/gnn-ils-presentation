// ============================================================
  // Slide 1: Background Network Animation
  // ============================================================

  function initSlide1() {
    const svg = d3.select("#bg-network");
    const w = window.innerWidth, h = window.innerHeight;
    svg.attr("width", w).attr("height", h);

    // Simple NSFNET silhouette scaled to full screen
    const scaleX = w / 840, scaleY = h / 500;
    const nodes = NSFNET.nodes.map(n => ({
      ...n, sx: n.x * scaleX, sy: n.y * scaleY
    }));
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    NSFNET.edges.forEach(e => {
      svg.append("line")
        .attr("x1", nodeMap[e.source].sx).attr("y1", nodeMap[e.source].sy)
        .attr("x2", nodeMap[e.target].sx).attr("y2", nodeMap[e.target].sy)
        .attr("stroke", "#1a2040").attr("stroke-width", 1);
    });

    nodes.forEach(n => {
      svg.append("circle")
        .attr("cx", n.sx).attr("cy", n.sy).attr("r", 4)
        .attr("fill", "#2a3060").attr("opacity", 0.3)
        .style("animation-delay", (Math.random() * 3) + "s");
    });
  }
