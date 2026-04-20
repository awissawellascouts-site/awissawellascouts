const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfWB-5TORmjd9esujymIRWQGn7K9oxUmzKOwMORO6nfVBGpMvbbaYlGS0td302bZZxNc6DscbGU6FR/pub?gid=974684895&single=true&output=csv'; 

let allData = [];

function init() {
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            allData = results.data;
            renderCategories(allData);
            renderCards(allData);
        }
    });
}

function renderCategories(data) {
    const categories = ['All', ...new Set(data.map(item => item.Category).filter(c => c))];
    const filterContainer = document.getElementById('category-filters');
    filterContainer.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `tab ${cat === 'All' ? 'active' : ''}`;
        btn.innerText = cat;
        btn.onclick = () => filterCards(cat, btn);
        filterContainer.appendChild(btn);
    });
}

function renderCards(data) {
    const grid = document.getElementById('talent-grid');
    grid.innerHTML = '';

    data.forEach(item => {
        if(!item.Title) return;

        const card = document.createElement('div');
        card.className = 'card';
        
        let mediaHTML = '';
        if (item.Type === 'video') {
            mediaHTML = `<video autoplay muted loop playsinline><source src="${item.ContentURL}" type="video/mp4"></video><div class="mute-badge"><i class="fa-solid fa-volume-xmark"></i> Muted</div>`;
        } else if (item.Type === 'audio') {
            mediaHTML = `<div class="audio-placeholder"><i class="fa-solid fa-music"></i></div>`;
        } else {
            mediaHTML = `<img src="${item.ContentURL}" alt="Preview">`;
        }

        let tagsHTML = '';
        if(item.Category) {
            tagsHTML = `<div class="tag-list"><span class="tag-item">#${item.Category}</span><span class="tag-item">#ScoutTalent</span></div>`;
        }

        card.innerHTML = `
            <div class="card-media" onclick="openMedia('${item.Type}', '${item.ContentURL}')">
                ${mediaHTML}
            </div>
            <div class="card-body">
                <div class="user-info">
                    <img src="${item.StudentPhoto || 'https://via.placeholder.com/50'}" class="user-img">
                    <div class="user-details">
                        <h4>${item.StudentName} | Age ${item.Age}</h4>
                        <span>${item.ScoutTroop}</span>
                    </div>
                </div>
                <div class="creative-title">${item.Title}</div>
                <p class="creative-desc">${item.Description}</p>
                ${tagsHTML}
                <div class="card-footer">
                    <button class="stat-btn" onclick="openMedia('${item.Type}', '${item.ContentURL}')">
                        <i class="fa-regular fa-eye"></i> View Full
                    </button>
                    <button class="stat-btn" onclick="this.classList.toggle('like-active')">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterCards(category, btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    if(btn) btn.classList.add('active');
    const filtered = category === 'All' ? allData : allData.filter(d => d.Category === category);
    renderCards(filtered);
}

function openMedia(type, url) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    const wrapper = document.getElementById('wrapper');

    if (type === 'video') {
        content.innerHTML = `<video controls autoplay><source src="${url}" type="video/mp4"></video>`;
    } else if (type === 'audio') {
        content.innerHTML = `<div style="background:white; padding:20px; width:100%; border-radius:15px; text-align:center;">
                                <i class="fa-solid fa-music" style="font-size:40px; color:green; margin-bottom:15px;"></i><br>
                                <audio controls autoplay style="width:100%;"><source src="${url}" type="audio/mpeg"></audio>
                             </div>`;
    } else {
        content.innerHTML = `<img src="${url}">`;
    }

    overlay.style.display = 'flex';
    wrapper.classList.add('blur-container');
}

function closeMedia() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('wrapper').classList.remove('blur-container');
    document.getElementById('modal-content').innerHTML = '';
}

window.onload = init;