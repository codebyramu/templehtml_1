// --- Loading Sequence & Animations ---
document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById('loader');
  const tapBtn = document.getElementById('tap-to-enter');
  const loadingBar = document.querySelector('.loading-bar');
  const fluteAudio = document.getElementById('flute-audio');
  
  const texts = [
    document.getElementById('lt1'),
    document.getElementById('lt2'),
    document.getElementById('lt3')
  ];
  
  // Split text for hero heading
  const splitTextEl = document.querySelector('.split-text');
  if (splitTextEl) {
    const words = splitTextEl.innerText.split(' ');
    splitTextEl.innerHTML = '';
    words.forEach(word => {
      const span = document.createElement('span');
      span.innerHTML = word + '&nbsp;';
      splitTextEl.appendChild(span);
    });
  }

  // Dashboard Smooth Scroll
  document.querySelectorAll('#dashboard a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      if(this.getAttribute('href') === '#') return;
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });

  // Loading Sequence
  let currentText = 0;
  function showNextText() {
    if (currentText > 0 && texts[currentText - 1]) texts[currentText - 1].style.opacity = 0;
    if (currentText < texts.length) {
      if(texts[currentText]) texts[currentText].style.opacity = 1;
      currentText++;
      setTimeout(showNextText, 1500); // 1.5s per text
    } else {
      // Sequence done, show tap to enter
      if(tapBtn) {
        tapBtn.style.opacity = 1;
        tapBtn.style.pointerEvents = 'auto';
      }
    }
  }
  
  // Start sequence
  setTimeout(showNextText, 500);
  
  // Loading bar animation
  setTimeout(() => { if(loadingBar) loadingBar.style.width = '30%'; }, 1000);
  setTimeout(() => { if(loadingBar) loadingBar.style.width = '70%'; }, 2500);
  setTimeout(() => { if(loadingBar) loadingBar.style.width = '100%'; }, 4000);

  // Tap to enter interaction
  if(tapBtn) {
    tapBtn.addEventListener('click', () => {
      // Fade out loader
      if(loader) {
        loader.style.opacity = 0;
        loader.style.visibility = 'hidden';
      }
      
      // Force all videos to play on user interaction (bypasses mobile restrictions)
      document.querySelectorAll('video').forEach(vid => {
        vid.play().catch(e => console.log('Video play failed on tap:', e));
      });
      
      // Play audio smoothly
      if(fluteAudio) {
        fluteAudio.volume = 0;
        fluteAudio.play().catch(e => console.log('Audio play failed', e));
        let vol = 0;
        const fadeAudio = setInterval(() => {
          if (vol < 0.6) {
            vol += 0.05;
            fluteAudio.volume = Math.min(vol, 1);
          } else {
            clearInterval(fadeAudio);
          }
        }, 200);
      }

      // Trigger stagger text animations
      setTimeout(() => {
        if(splitTextEl) {
          splitTextEl.classList.add('visible');
          // Stagger child spans
          const spans = splitTextEl.querySelectorAll('span');
          spans.forEach((span, i) => {
            span.style.transitionDelay = `${i * 0.08}s`;
          });
        }
        
        const fadeUpEl = document.querySelector('.fade-up-text');
        if (fadeUpEl) fadeUpEl.classList.add('visible');
        
        // Start subtitle rotation 2 seconds after the initial fade-in
        setTimeout(startSubtitleRotation, 2000);
      }, 800); // Wait for loader to fade out
    });
  }

  // --- Subtitle Rotation Logic ---
  function startSubtitleRotation() {
    const subtitles = document.querySelectorAll('.hero-subtitle');
    if (subtitles.length > 1) {
      let currentSub = 0;
      setInterval(() => {
        // Current one leaves
        subtitles[currentSub].classList.remove('active');
        subtitles[currentSub].classList.add('outgoing');
        
        const prevSub = currentSub;
        // Clean up outgoing class after transition finishes (1s)
        setTimeout(() => {
          subtitles[prevSub].classList.remove('outgoing');
        }, 1000);
        
        // Next one arrives
        currentSub = (currentSub + 1) % subtitles.length;
        subtitles[currentSub].classList.add('active');
      }, 4000);
    }
  }
});

// --- Existing Blob Interaction Logic ---
const sections = document.querySelectorAll('.section:not(.temple-showcase)');

// Interpolation targets and current values for smooth movement & morphing
let targetX = -1000;
let targetY = -1000;
let currentX = -1000;
let currentY = -1000;

let targetR1 = 120, currentR1 = 120;
let targetR2 = 120, currentR2 = 120;
let targetR3 = 120, currentR3 = 120;

let activeSection = null;
let isFirstMove = true;

// Preload videos and ensure looping/autoplay
document.querySelectorAll('.media-vid').forEach(vid => {
  vid.play().catch(err => {
    console.log('Autoplay blocked initially. Will try again on interaction.', err);
  });
});

// Start randomizing radii for the organic morphing effect
setInterval(() => {
  // Radius must be random between 80px and 180px
  targetR1 = 80 + Math.random() * 100;
  targetR2 = 80 + Math.random() * 100;
  targetR3 = 80 + Math.random() * 100;
}, 400);

function handleMove(e, section) {
  if (e.touches && e.touches.length > 0) {
    e.clientX = e.touches[0].clientX;
    e.clientY = e.touches[0].clientY;
  }
  
  // To handle sticky containers properly, calculate mouse position relative to the video itself
  const vid = section.querySelector('.media-vid');
  let rect;
  if (vid) {
    rect = vid.getBoundingClientRect();
  } else {
    rect = section.getBoundingClientRect();
  }
  
  targetX = e.clientX - rect.left;
  targetY = e.clientY - rect.top;
  
  if (activeSection !== section) {
    activeSection = section;
    
    // Hide others
    sections.forEach(s => {
      const v = s.querySelector('.media-vid');
      if (v) v.style.opacity = (s === activeSection) ? '1' : '0';
    });
    
    // Snap immediately on first enter to prevent mask flying across the screen
    currentX = targetX;
    currentY = targetY;
  }
}

sections.forEach(sec => {
  sec.addEventListener('mousemove', (e) => handleMove(e, sec));
  sec.addEventListener('touchmove', (e) => handleMove(e, sec), { passive: true });
  
  // Hide when leaving section
  sec.addEventListener('mouseleave', () => {
    if (activeSection === sec) {
      activeSection = null;
      const vid = sec.querySelector('.media-vid');
      if (vid) vid.style.opacity = '0';
    }
  });
  
  sec.addEventListener('touchend', () => {
    if (activeSection === sec) {
      activeSection = null;
      const vid = sec.querySelector('.media-vid');
      if (vid) vid.style.opacity = '0';
    }
  });
});

// --- Temple Showcase Internal Scroll Logic ---
const listContainer = document.querySelector('.scrollable-list');
if (listContainer) {
  const items = listContainer.querySelectorAll('li');
  const layers = document.querySelectorAll('.showcase-layer');
  
  function updateShowcaseOnScroll() {
    // Calculate center of the scroll container
    const containerCenter = listContainer.getBoundingClientRect().top + listContainer.clientHeight / 2;
    
    let closestIndex = 0;
    let minDistance = Infinity;
    
    items.forEach((item, index) => {
      const itemRect = item.getBoundingClientRect();
      const itemCenter = itemRect.top + itemRect.height / 2;
      const distance = Math.abs(containerCenter - itemCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    
    // Update active classes for main images
    items.forEach((item, i) => item.classList.toggle('active', i === closestIndex));
    layers.forEach((layer, i) => layer.classList.toggle('active', i === closestIndex));
    
    // Update active classes for bulge images
    document.querySelectorAll('.bulge-img').forEach((img, i) => img.classList.toggle('active', i === closestIndex));
  }

  // Handle sticky scroll sequence based on window scroll
  const sec5 = document.getElementById('sec5');
  window.addEventListener('scroll', () => {
    if (sec5) {
      const rect = sec5.getBoundingClientRect();
      
      // Check if sec5 is currently the sticky active section in viewport
      if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
        // Calculate progress from 0 to 1
        const scrollableDistance = rect.height - window.innerHeight;
        const scrolled = -rect.top;
        let progress = scrolled / scrollableDistance;
        
        // Clamp progress
        progress = Math.max(0, Math.min(1, progress));
        
        // Programmatically scroll the list container
        const maxScroll = listContainer.scrollHeight - listContainer.clientHeight;
        listContainer.scrollTop = progress * maxScroll;
        
        // Trigger visual updates
        updateShowcaseOnScroll();
      } else if (rect.top > 0) {
        // Reset to start if above
        listContainer.scrollTop = 0;
        updateShowcaseOnScroll();
      } else if (rect.bottom < window.innerHeight) {
        // Force to end if below
        listContainer.scrollTop = listContainer.scrollHeight;
        updateShowcaseOnScroll();
      }
    }
  });
  
  // Also update once on load to establish initial state
  updateShowcaseOnScroll();

  // Click to automatically scroll to an item perfectly centered (disabled in sticky scroll mode as it interferes with window scroll mapping)
  /* items.forEach(item => {
    item.addEventListener('click', () => {
      const scrollPos = item.offsetTop - listContainer.clientHeight / 2 + item.clientHeight / 2;
      listContainer.scrollTo({ top: scrollPos, behavior: 'smooth' });
    });
  }); */
}

// Variables for bulge tracking
let bTargetX = -1000, bTargetY = -1000;
let bCurrentX = -1000, bCurrentY = -1000;

// Set up image box mouse tracking
const imageBox = document.querySelector('.image-box');
if (imageBox) {
  imageBox.addEventListener('mousemove', (e) => {
    const rect = imageBox.getBoundingClientRect();
    bTargetX = e.clientX - rect.left;
    bTargetY = e.clientY - rect.top;
  });
  imageBox.addEventListener('mouseleave', () => {
    bTargetX = -1000;
    bTargetY = -1000;
  });
}

// Render loop for 60fps smooth mask following and morphing
function render() {
  if (activeSection) {
    // Smooth follow for position (eased)
    currentX += (targetX - currentX) * 0.15;
    currentY += (targetY - currentY) * 0.15;
    
    // Smooth morph for radii (eased)
    currentR1 += (targetR1 - currentR1) * 0.05;
    currentR2 += (targetR2 - currentR2) * 0.05;
    currentR3 += (targetR3 - currentR3) * 0.05;
    
    const vid = activeSection.querySelector('.media-vid');
    if (vid) {
      vid.style.setProperty('--x', `${currentX}px`);
      vid.style.setProperty('--y', `${currentY}px`);
      vid.style.setProperty('--r1', `${currentR1}px`);
      vid.style.setProperty('--r2', `${currentR2}px`);
      vid.style.setProperty('--r3', `${currentR3}px`);
    }
  }
  
  // Bulge effect update inside image box
  if (imageBox) {
    bCurrentX += (bTargetX - bCurrentX) * 0.15;
    bCurrentY += (bTargetY - bCurrentY) * 0.15;
    
    imageBox.style.setProperty('--bx', `${bCurrentX}px`);
    imageBox.style.setProperty('--by', `${bCurrentY}px`);
    // Scale radii down to make the bulge circles smaller
    imageBox.style.setProperty('--br1', `${currentR1 * 0.4}px`);
    imageBox.style.setProperty('--br2', `${currentR2 * 0.4}px`);
    imageBox.style.setProperty('--br3', `${currentR3 * 0.4}px`);
  }
  
  requestAnimationFrame(render);
}

// Start loop
requestAnimationFrame(render);
