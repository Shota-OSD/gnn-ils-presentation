// ============================================================
  // Reveal.js Init & Event Handling
  // ============================================================

  Reveal.initialize({
    hash: true,
    width: 960,
    height: 700,
    margin: 0.04,
    transition: 'slide',
    transitionSpeed: 'default',
    controls: true,
    progress: true,
    center: false,
    keyboard: true,
  });

  // Init slide 1 background
  initSlide1();

  Reveal.on('slidechanged', event => {
    const idx = event.indexh;

    // Stop all animations from other slides
    stopSlide2Packets();
    stopSlide4Packets();

    if (idx === 1) {
      initSlide2();
    } else if (idx === 2) {
      initSlide3();
    } else if (idx === 3) {
      initSlide4();
    } else if (idx === 4) {
      initSlide5();
    }
  });

  // Slide 2 buttons
  document.getElementById("btn-shortest").addEventListener("click", () => updateSlide2("shortest"));
  document.getElementById("btn-balanced").addEventListener("click", () => updateSlide2("balanced"));

  // Slide 3 button
  document.getElementById("btn-propagate").addEventListener("click", propagateOnce);

  // Slide 4 buttons
  document.getElementById("btn-next").addEventListener("click", () => {
    if (slide4Step < 5) {
      slide4Step++;
      renderSlide4Step(slide4Step, true);
    }
  });

  document.getElementById("btn-prev").addEventListener("click", () => {
    if (slide4Step > 0) {
      slide4Step--;
      renderSlide4Step(slide4Step, true);
    }
  });

  document.getElementById("btn-reset").addEventListener("click", () => {
    stopSlide4Auto();
    slide4Step = 0;
    renderSlide4Step(0, false);
  });

  document.getElementById("btn-autoplay").addEventListener("click", function() {
    if (slide4AutoTimer) {
      stopSlide4Auto();
    } else {
      this.classList.add("active");
      this.textContent = "停止";
      slide4AutoTimer = setInterval(() => {
        if (slide4Step < 5) {
          slide4Step++;
          renderSlide4Step(slide4Step, true);
        } else {
          stopSlide4Auto();
        }
      }, 2500);
    }
  });
