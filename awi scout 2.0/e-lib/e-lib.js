/**
 * බැජ් එක සෙවීමේ ප්‍රධාන ශ්‍රිතය
 */
async function findBadge() {
    const input = document.getElementById('badgeSearch').value.trim().toLowerCase();
    const panel = document.getElementById('badgePanel');
    const errorMsg = document.getElementById('errorMessage');

    // Input එක හිස් නම් සියල්ල සඟවන්න
    if (input === "") {
        panel.style.display = 'none';
        errorMsg.style.display = 'none';
        return;
    }

    // Async fetch from Firebase
    let allBadges = typeof window.DB !== 'undefined' ? await window.DB.getCollection('scout_proficiency_badges') : [];

    let foundData = null;
    for (let i = 0; i < allBadges.length; i++) {
        const badgeName = allBadges[i].name.toLowerCase();
        const badgeCode = allBadges[i].badgeCode.toLowerCase();
        if (badgeCode === input || badgeName.includes(input)) {
            foundData = allBadges[i];
            break;
        }
    }

    if (foundData) {
        document.getElementById('resGroup').innerText = foundData.group || '';
        document.getElementById('resName').innerText = foundData.name || '';
        document.getElementById('resCode').innerText = "REF: " + foundData.badgeCode;
        document.getElementById('resSyllabus').innerText = foundData.syllabus || '';
        document.getElementById('resTeacher').innerText = foundData.teacher || '';
        document.getElementById('resContact').innerText = foundData.contact || '';
        document.getElementById('logoImg').src = foundData.logo || '';
        document.getElementById('lightboxImg').src = foundData.logo || '';
        panel.style.display = 'block';
        errorMsg.style.display = 'none';
    } else {
        panel.style.display = 'none';
        errorMsg.style.display = 'block';
    }
}
/**
 * රූපය විශාල කර පෙන්වීම (Lightbox)
 */
function openLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    const wrapper = document.getElementById('mainWrapper');
    
    lightbox.style.display = 'flex';
    wrapper.classList.add('blur-content');
}

/**
 * Lightbox එක වසා දැමීම
 */
function closeLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    const wrapper = document.getElementById('mainWrapper');
    
    lightbox.style.display = 'none';
    wrapper.classList.remove('blur-content');
}

// Auto-scroll when page is opened with section hashes
function scrollToHashSection() {
    const rawHash = window.location.hash ? window.location.hash.substring(1) : '';
    if (!rawHash) return;

    const hash = decodeURIComponent(rawHash).replace(/\s+/g, '').toLowerCase();
    const targetByHash = {
        progress: document.getElementById('Progress'),
        progressa: document.getElementById('Progressa'),
        badge: document.getElementById('badge'),
        proficiency: document.getElementById('Proficiency'),
        proficiencybadge: document.getElementById('Proficiency'),
        downloads: document.getElementById('Downloads')
    };

    const target = targetByHash[hash];
    if (!target) return;

    const header = document.getElementById('header');
    const offset = header ? header.offsetHeight + 12 : 90;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({
        top: Math.max(top, 0),
        behavior: 'smooth'
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(scrollToHashSection, 120);
        renderProgressBadges();
        renderDownloads();
    });
} else {
    setTimeout(scrollToHashSection, 120);
    renderProgressBadges();
    renderDownloads();
}

window.addEventListener('load', () => setTimeout(scrollToHashSection, 80));
window.addEventListener('hashchange', scrollToHashSection);

// --- DYNAMIC PROGRESS BADGE RENDERING ---
async function renderProgressBadges() {
    const container = document.getElementById('progress-cards-container');
    if (!container || typeof window.DB === 'undefined') return;

    container.innerHTML = '<p style="text-align:center; padding:20px; color:#aaa;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';

    const badges = await window.DB.getCollection('scout_progress_badges');
    if (badges.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; color:#888;">No progress badges available.</p>';
        return;
    }

    let cardsHTML = '';
    badges.forEach(b => {
        cardsHTML += `
            <div class="card" data-card="${b.id}" onclick="openProgressBadgeTitles('${b.id}')">
                <div class="card-icon">
                    <img src="${b.logo}" alt="${b.name} Icon">
                </div>
                <h3>${b.name}</h3>
                <p>${b.description}</p>
            </div>
        `;
    });
    container.innerHTML = cardsHTML;
}

// 1. User clicks a Main Badge -> Show Sub-topics list (titlesModal)
async function openProgressBadgeTitles(badgeId) {
    const badges = await window.DB.getCollection('scout_progress_badges');
    const badge = badges.find(b => b.id === badgeId);
    if (!badge) return;

    const titlesModal = document.getElementById('titlesModal');
    const modalTitle = document.getElementById('modalTitle');
    const titlesGrid = document.getElementById('titlesGrid');
    
    if(!titlesModal || !titlesGrid) return; // Fallback if HTML is missing modals

    modalTitle.innerHTML = `
        <div style="font-size: 13px; color: #888; margin-bottom: 5px; font-weight: 500; font-family: 'Poppins', sans-serif; display: flex; align-items: center; gap: 5px; justify-content: center;">
            <i class="fas fa-book-open" style="font-size: 12px;"></i> E-Library &rsaquo; <span style="color:#d88a2a;">${badge.name}</span>
        </div>
        <div style="margin-top: 5px; font-size: 24px;">${badge.name}</div>
    `;
    titlesGrid.innerHTML = '';

    const subs = badge.subtopics || [];
    if (subs.length === 0) {
        titlesGrid.innerHTML = '<p style="text-align:center; padding:20px;">No sub-topics available yet.</p>';
    } else {
        subs.forEach(sub => {
            const titleItem = document.createElement('div');
            titleItem.className = 'title-item';
            titleItem.textContent = sub.title;
            // 2. Click a sub-topic -> Show detail view (contentModal)
            titleItem.addEventListener('click', () => openSubtopicContent(badgeId, sub.id));
            titlesGrid.appendChild(titleItem);
        });
    }

    titlesModal.style.display = 'block';

    // Hook up close buttons dynamically for these modals if not already done
    setupModalCloseEvents();
}

// 3. User clicks a subtopic -> Detail View
async function openSubtopicContent(badgeId, subtopicId) {
    const badges = await window.DB.getCollection('scout_progress_badges');
    const badge = badges.find(b => b.id === badgeId);
    if (!badge || !badge.subtopics) return;
    
    const sub = badge.subtopics.find(s => s.id === subtopicId);
    if (!sub) return;

    const contentModal = document.getElementById('contentModal');
    const contentContainer = document.getElementById('contentContainer');
    const titlesModal = document.getElementById('titlesModal');

    if(!contentModal || !contentContainer) return;

    // Formatting description: replacing newlines with <br> and bolding the first line optionally (similar to old system)
    let desc = sub.description || 'No description available.';
    desc = desc.replace(/\n/g, '<br>');
    
    let html = `
        <div style="font-size: 13px; color: #888; margin-bottom: 5px; font-weight: 500; font-family: 'Poppins', sans-serif; display: flex; align-items: center; gap: 5px;">
            <i class="fas fa-book-open" style="font-size: 12px;"></i> E-Library &rsaquo; ${badge.name} &rsaquo; <span style="color:#d88a2a;">${sub.title}</span>
        </div>
        <h3 style="margin-top: 10px;">${sub.title}</h3>
        <div class="description-block">${desc}</div>
    `;

    // Process Images (Comma separated links)
    if (sub.images && sub.images.trim() !== '') {
        const imgs = sub.images.split(',').map(i => i.trim()).filter(i => i);
        if (imgs.length > 0) {
            html += '<div class="images-section">';
            imgs.forEach(src => { html += `<img src="${src}" alt="${sub.title}">`; });
            html += '</div>';
        }
    }

    // Process YouTube Videos
    if (sub.videos && sub.videos.trim() !== '') {
        const vids = sub.videos.split(',').map(v => v.trim()).filter(v => v);
        if (vids.length > 0) {
            html += '<div class="videos-section" style="margin-top: 20px;">';
            vids.forEach(vidUrl => { 
                // Convert basic YT link to embed format
                let embedUrl = vidUrl;
                if (vidUrl.includes('watch?v=')) {
                    embedUrl = vidUrl.replace('watch?v=', 'embed/');
                } else if (vidUrl.includes('youtu.be/')) {
                    embedUrl = vidUrl.replace('youtu.be/', 'youtube.com/embed/');
                }
                html += `<iframe width="100%" height="315" src="${embedUrl}" frameborder="0" allowfullscreen style="margin-bottom: 15px; border-radius: 8px;"></iframe>`;
            });
            html += '</div>';
        }
    }

    contentContainer.innerHTML = html;
    
    // Hide titles, show content
    if(titlesModal) titlesModal.style.display = 'none';
    contentModal.style.display = 'block';
}

function setupModalCloseEvents() {
    const titlesModal = document.getElementById('titlesModal');
    const contentModal = document.getElementById('contentModal');
    const closeButtons = document.querySelectorAll('.close');

    closeButtons.forEach(btn => {
        // Clone to avoid multiple binds
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            if(titlesModal) titlesModal.style.display = 'none';
            if(contentModal) contentModal.style.display = 'none';
        });
    });

    // Close when clicking outside
    window.onclick = function(event) {
        if (event.target === titlesModal) titlesModal.style.display = 'none';
        if (event.target === contentModal) contentModal.style.display = 'none';
    };
}

// ============== DOWNLOADS RENDERING ==============
async function renderDownloads() {
    const container = document.getElementById('downloads-container');
    if (!container || typeof window.DB === 'undefined') return;

    container.innerHTML = '<p style="text-align:center; padding:40px; color:#aaa;"><i class="fas fa-spinner fa-spin"></i> Loading resources...</p>';

    const docs = await window.DB.getCollection('scout_downloads');
    if (docs.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; color:#888; padding: 40px;">No documents available currently.</p>';
        return;
    }

    // Grouping by category
    const categories = {};
    docs.forEach(doc => {
        const cat = doc.category || 'General Resources';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(doc);
    });

    let html = '';
    // Optional: Sort categories if desired
    const sortedCats = Object.keys(categories).sort();

    sortedCats.forEach(cat => {
        html += `
            <div class="category-group">
                <h3 class="category-title"><i class="fas fa-folder-open"></i> ${cat}</h3>
                <div class="download-grid">
        `;
        
        categories[cat].forEach(d => {
            html += `
                <div class="download-card">
                    <div class="download-info">
                        <h3>${d.title}</h3>
                        <p>${d.description || 'No description available.'}</p>
                    </div>
                    <a href="${d.link}" target="_blank" class="download-btn" ${d.link.startsWith('data:') ? 'download="' + d.title + '"' : ''}>
                        <i class="fas fa-cloud-download-alt"></i> Download
                    </a>
                </div>
            `;
        });

        html += `</div></div>`;
    });

    container.innerHTML = html;
}