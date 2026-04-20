// Fetching News & Announcements from Firebase
const el = id => document.getElementById(id);
const formatDate = d => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

function sortByDate(arr) {
  return arr.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Typewriter effect for loader motto
const mottoText = ".";
let i = 0;
function typeWriter() {
  if (i < mottoText.length) {
    const motoEl = el('moto-text');
    if (motoEl) motoEl.innerHTML += mottoText.charAt(i);
    i++;
    setTimeout(typeWriter, 50);
  }
}

// Reverted to standard async IIFE (Previous Type)
(async function init() {
  // Start typewriter text
  typeWriter();

  // OPTIMIZATION: Hide loader aggressively rather than waiting for Firebase to unblock screen
  const loader = el('loader-wrapper');
  setTimeout(() => {
    if (loader) loader.classList.add('fade-out');
  }, 1000); // 1-second max aesthetic loader

  // Ensure DB is loaded
  if (typeof DB === 'undefined') {
    return;
  }

  try {
    const rawNews = await DB.getCollection('scout_news');

    if (!rawNews || rawNews.length === 0) {
      const fTitle = el('featured-title');
      if (fTitle) fTitle.textContent = 'No news available yet.';
      return;
    }

    const news = sortByDate(rawNews);

    /* FEATURED */
    const f = news[0];
    if (f) {
      const fImg = el('featured-img');
      if (fImg) fImg.style.backgroundImage = `url('${f.image}')`;
      const fTitle = el('featured-title');
      if (fTitle) fTitle.textContent = f.title;
      const fDate = el('featured-date');
      if (fDate) fDate.textContent = formatDate(f.date);
      const fDesc = el('featured-desc');
      if (fDesc) fDesc.textContent = f.description;
      const fLink = el('featured-link');
      if (fLink) { fLink.href = f.link; fLink.textContent = "Read full News..."; }
    }

    /* OTHER NEWS */
    const mid = el('middle');
    if (mid) {
      news.slice(1, 3).forEach(n => {
        mid.innerHTML += `
              <div class="news-item">
                <div class="news-thumb" style="background-image:url('${n.image}')"></div>
                <h3>${n.title}</h3>
                <div class="meta">${formatDate(n.date)}</div>
                <p>${n.description}</p>
                <a class="link" href="${n.link}" target="_blank">Read full News...</a>
              </div>`;
      });
    }

    /* OLD NEWS */
    const old = el('oldNews');
    if (old) {
      news.slice(3).forEach(n => {
        old.innerHTML += `
              <div class="old-item">
                <img src="${n.image}">
                <h3>${n.title}</h3>
                <div class="meta">${formatDate(n.date)}</div>
                <p>${n.description}</p>
                <a class="link" href="${n.link}" target="_blank">Read full News...</a>
              </div>`;
      });
    }

    /* ANNOUNCEMENTS */
    const annDiv = el('ann');
    if (annDiv) {
      let annHTML = "";

      // Load ALL Special Notices
      try {
        const notices = await DB.getCollection('scout_notices');
        if (notices && notices.length > 0) {
          const enabledNotices = notices.filter(n => n.enabled);
          enabledNotices.forEach(notice => {
            annHTML += `
              <div class="ann-item special-notice-sidebar" style="border-left: 4px solid #f39c12; background: #fffcf0; padding:10px; margin-bottom:10px; border-radius:4px;">
                 <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
                    <i class="fas fa-bullhorn" style="color:#f39c12"></i>
                    <strong style="color:#e67e22; font-size:14px;">IMPORTANT NOTICE</strong>
                 </div>
                 <p style="margin:0; font-size:13px; color:#333; line-height:1.4;">${notice.text}</p>
                 ${notice.link ? `<a href="${notice.link}" target="_blank" style="color:#0a2d5e; font-size:12px; font-weight:600; text-decoration:none; display:inline-block; margin-top:5px;">${notice.btnText || 'Learn More'} <i class="fas fa-arrow-right" style="font-size:10px"></i></a>` : ""}
              </div>
            `;
          });
        }
      } catch (e) { console.error("Notice error:", e); }

      // Heading for News Headlines
      annHTML += `<h3 style="margin-top: 20px; font-size: 1rem; color: var(--primary);"><i class="fas fa-newspaper"></i> Latest News</h3>`;

      // Clickable news titles
      annHTML += news.slice(0, 5).map(a => `
          <div class="ann-item news-headline-item">
            <a href="${a.link || '#'}" target="_blank" style="text-decoration:none; color:inherit; display:block;">
                <strong style="display:block; margin-bottom:2px;">${a.title}</strong>
                <small style="color:var(--muted);">${formatDate(a.date)}</small>
            </a>
          </div>`).join('');

      annDiv.innerHTML = annHTML;
      checkAnnCount();
    }

    /* TOGGLE SHOW/HIDE OLD NEWS */
    const showBtn = el('show-old');
    const hideBtn = el('hide-old');
    if (showBtn && hideBtn && old) {
      showBtn.onclick = () => {
        old.style.display = 'grid';
        showBtn.style.display = 'none';
        hideBtn.style.display = 'inline-block';
      };
      hideBtn.onclick = () => {
        old.style.display = 'none';
        showBtn.style.display = 'inline-block';
        hideBtn.style.display = 'none';
      };
    }
  } catch (e) {
    console.error("Content load error:", e);
  }
})();

function checkAnnCount() {
  const annDiv = document.getElementById('ann');
  const controls = document.getElementById('ann-controls');
  if (!annDiv || !controls) return;

  const items = Array.from(annDiv.querySelectorAll('.ann-item'));
  
  if (window.innerWidth <= 768) {
    if (items.length > 3) {
      controls.style.display = 'block';
      // Hide everything after the 3rd item
      for (let i = 3; i < items.length; i++) {
        items[i].classList.add('ann-hidden');
      }
    } else {
      controls.style.display = 'none';
    }
  } else {
    controls.style.display = 'none';
    items.forEach(el => el.classList.remove('ann-hidden'));
  }
}

function toggleAnnouncements() {
  const annDiv = document.getElementById('ann');
  const items = Array.from(annDiv.querySelectorAll('.ann-item'));
  const btn = document.getElementById('btn-show-all-ann');

  const isShowingAll = btn.innerText.includes('Show Less');

  if (!isShowingAll) {
    items.forEach(el => el.classList.remove('ann-hidden'));
    btn.innerHTML = 'Show Less <i class="fas fa-chevron-up"></i>';
  } else {
    // Re-hide after 3rd item
    for (let i = 3; i < items.length; i++) {
      items[i].classList.add('ann-hidden');
    }
    btn.innerHTML = 'View All Announcements <i class="fas fa-chevron-down"></i>';
    // Smooth scroll back to top of sidebar
    document.querySelector('.sidebar h3').scrollIntoView({ behavior: 'smooth' });
  }
}

window.addEventListener('resize', checkAnnCount);

// Scroll Reveal Script (Standalone)
function reveal() {
  var reveals = document.querySelectorAll(".reveal");
  for (var i = 0; i < reveals.length; i++) {
    var windowHeight = window.innerHeight;
    var elementTop = reveals[i].getBoundingClientRect().top;
    var elementVisible = 150;
    if (elementTop < windowHeight - elementVisible) {
      reveals[i].classList.add("active");
    }
  }
}
window.addEventListener("scroll", reveal);
reveal();








// 1. Slider Logic
let slideIndex = 0;
let slides = document.getElementsByClassName("slide");
let autoScroll = setInterval(() => changeSlide(1), 5000);

function showSlides(n) {
  if (n >= slides.length) { slideIndex = 0; }
  if (n < 0) { slideIndex = slides.length - 1; }
  for (let i = 0; i < slides.length; i++) {
    slides[i].classList.remove("active");
  }
  slides[slideIndex].classList.add("active");
}

function changeSlide(n) {
  clearInterval(autoScroll);
  slideIndex += n;
  showSlides(slideIndex);
  autoScroll = setInterval(() => changeSlide(1), 7000);
}























// Hero background rotator with crossfade every 10s
(function () {
  var hero = document.querySelector('.hero');
  var bgA = document.querySelector('.hero .hero-bg');
  var bgB = document.querySelector('.hero .hero-bg-2');
  if (!hero || !bgA || !bgB) return;

  var backgrounds = [
    './home/image-main/5.jpg',
    './home/image-main/IMG-20250328-WA0065 (1).jpg',
    './home/image-main/IMG-20250331-WA0166.jpg',
    './home/image-main/IMG-20250331-WA0346.jpg',
    './home/image-main/IMG-20250331-WA0346.jpg'
  ];

  // Preload images
  backgrounds.forEach(function (src) { var img = new Image(); img.src = src; });

  var idx = 0;
  var showingA = true;

  function setBg(el, src) {
    var gradient = 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0) 70%)';
    el.style.backgroundImage = gradient + ', url("' + src + '")';
  }

  // Initialize first two images
  setBg(bgA, backgrounds[idx]);
  bgA.style.opacity = '1';
  setBg(bgB, backgrounds[(idx + 1) % backgrounds.length]);
  bgB.style.opacity = '0';

  setInterval(function () {
    // Next image index
    idx = (idx + 1) % backgrounds.length;

    if (showingA) {
      // Fade in B with next image, fade out A
      setBg(bgB, backgrounds[idx]);
      bgB.style.opacity = '1';
      bgA.style.opacity = '0';
    } else {
      setBg(bgA, backgrounds[idx]);
      bgA.style.opacity = '1';
      bgB.style.opacity = '0';
    }
    showingA = !showingA;
  }, 10000);
})();

// Hero foreground 4-card rotator (every 10s)
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.hero-rotator .card'));
  if (!cards.length) return;

  var n = cards.length;
  var current = 0; // index that should be at center

  function applyPositions() {
    for (var i = 0; i < n; i++) {
      // remove previous pos-* classes
      cards[i].classList.remove('pos-0', 'pos-2', 'pos-3');
      var delta = (i - current + n) % n;
      var cls = 'pos-3';
      if (delta === 0) cls = 'pos-0';         // center

      else if (delta === n - 1) cls = 'pos-2';// left (prev)
      else cls = 'pos-3';                     // back/faded
      cards[i].classList.add(cls);
    }
  }

  applyPositions();
  setInterval(function () {
    current = (current + 1) % n;
    applyPositions();
  }, 10000);
})();














// Image paths for different sections and tabs 
const IMAGE_PATHS = {
  'sigithi-general': 'https://via.placeholder.com/450x450/20c997/ffffff?text=Sigithi+Group+%28About%2C+Law%2C+Start%29',
  'sigithi-uniform': './scout-cat-img/sigithi/singithi stu.png',
  'sigithi-badges': './scout-cat-img/sigithi/sigithi badge.png',


  'cub-general': 'https://via.placeholder.com/450x450/28a745/ffffff?text=Cub+Scout+Camp+%28About%2C+Law%2C+Start%29',
  'cub-uniform': 'https://via.placeholder.com/450x450/007bff/ffffff?text=Cub+Scout+Uniform',
  'cub-badges': 'https://via.placeholder.com/450x450/fd7e14/ffffff?text=Cub+Badges',



  'junior-general': 'https://via.placeholder.com/450x450/6f42c1/ffffff?text=Junior+Scout+Patrol',
  'junior-uniform': 'https://via.placeholder.com/450x450/dc3545/ffffff?text=Junior+Uniform',
  'junior-badges': 'https://via.placeholder.com/450x450/ffc107/333333?text=Junior+Badges',


  'senior-general': 'https://via.placeholder.com/450x450/343a40/ffffff?text=Senior+Scout+Leadership',
  'senior-uniform': 'https://via.placeholder.com/450x450/e83e8c/ffffff?text=Senior+Uniform',
  'senior-badges': 'https://via.placeholder.com/450x450/6610f2/ffffff?text=Senior+Badges',


  'rover-general': 'https://via.placeholder.com/450x450/00bcd4/ffffff?text=Rover+Scout+Service',
  'rover-uniform': 'https://via.placeholder.com/450x450/9c27b0/ffffff?text=Rover+Uniform',
  'rover-badges': 'https://via.placeholder.com/450x450/ff9800/333333?text=Rover+Badges',


  'leaders-general': 'https://via.placeholder.com/450x450/17a2b8/ffffff?text=Scout+Leaders+%28About%2C+Law%2C+Start%29',
  'leaders-uniform': 'https://via.placeholder.com/450x450/28a745/ffffff?text=Leader+Uniform',
  'leaders-badges': 'https://via.placeholder.com/450x450/007bff/ffffff?text=Wood+Badge+Training',
};

document.addEventListener('DOMContentLoaded', function () {
  const tabNavItems = document.querySelectorAll('.tab-nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const scoutImage = document.getElementById('scout-image');
  const allInnerTabs = document.querySelectorAll('.inner-tab');
  const contentSection = document.querySelector('.content-section');

  // Track the currently active tab ID 
  let activeTabId = null;

  // --- Function to update the image based on section and inner tab ---
  function updateImage(scoutType, innerTabName) {
    let imageKey;
    const tabEndName = innerTabName.split('-').pop();
    if (tabEndName === 'uniform') {
      imageKey = `${scoutType}-uniform`;
    } else if (tabEndName === 'badges') {
      imageKey = `${scoutType}-badges`;
    } else {
      imageKey = `${scoutType}-general`;
    }

    if (IMAGE_PATHS[imageKey]) {
      scoutImage.src = IMAGE_PATHS[imageKey];
      scoutImage.alt = imageKey;
    } else {
      scoutImage.src = 'https://via.placeholder.com/450x450/999999/ffffff?text=Image+Not+Found';
      scoutImage.alt = 'Image not found';
    }
  }

  // --- Function to handle inner tab clicks ---
  function handleInnerTabClick(clickedTab) {
    const innerTabId = clickedTab.getAttribute('data-inner-tab');
    const parentNav = clickedTab.closest('.inner-nav');
    const scoutType = parentNav.getAttribute('data-current-scout');

    // 1. Deactivate all inner tabs in the current section
    parentNav.querySelectorAll('.inner-tab').forEach(nav => nav.classList.remove('active'));

    // 2. Hide all inner tab content sections in the current main tab
    const parentContent = document.getElementById(`tab-${scoutType}`);
    parentContent.querySelectorAll('.inner-tab-content').forEach(content => content.classList.remove('active'));

    // 3. Activate the clicked inner tab
    clickedTab.classList.add('active');

    // 4. Show the corresponding inner content
    document.getElementById(innerTabId).classList.add('active');

    // 5. Update the image based on the new active inner tab
    updateImage(scoutType, innerTabId);
  }

  // --- 1. Main (Top) Tab switching/Toggling functionality ---
  tabNavItems.forEach(item => {
    item.addEventListener('click', function () {
      const tabId = this.getAttribute('data-tab');

      if (activeTabId === tabId) {
        // Case 1: Clicked the currently active tab (Toggle Off)

        // Hide the main content section (removes space)
        contentSection.classList.add('hidden');

        // Deactivate all main nav items
        tabNavItems.forEach(nav => nav.classList.remove('active'));

        // Clear active tab tracker
        activeTabId = null;

      } else {
        // Case 2: Clicked a new tab OR clicked a tab when content was hidden (Toggle On)

        // A. Show the main content section (restores space)
        contentSection.classList.remove('hidden');

        // B. Update main navigation item active state
        tabNavItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');

        // C. Update main content tab active state
        tabContents.forEach(content => content.classList.remove('active'));
        const activeContent = document.getElementById(`tab-${tabId}`);
        activeContent.classList.add('active');

        // D. Reset and activate the first inner tab ('About') of the new main section
        const firstInnerTab = activeContent.querySelector('.inner-tab');
        if (firstInnerTab) {
          handleInnerTabClick(firstInnerTab);
        }

        // E. Update active tab tracker
        activeTabId = tabId;
      }
    });
  });

  // --- 2. Inner Tab (Sub-navigation) click functionality ---
  allInnerTabs.forEach(item => {
    item.addEventListener('click', function () {
      handleInnerTabClick(this);
    });
  });

  // --- Initialization: Set up initial content data (Sigithi/About) but keep hidden ---
  const initialTab = document.querySelector('#tab-sigithi');
  if (initialTab) {
    const initialInnerTab = initialTab.querySelector('.inner-tab');
    if (initialInnerTab) {
      handleInnerTabClick(initialInnerTab);
    }
  }
});


