// Admin dashboard logic — connected to Firebase via window.DB

document.addEventListener("DOMContentLoaded", () => {
    
    // Check Auth State on load
    if (DB.isAuthenticated()) {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('dashboard-screen').classList.add('active');
        loadAllData();
    }

    // Set topbar date
    const dateOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date-display').innerText = new Date().toLocaleDateString(undefined, dateOpts);
});

/* --- Authentication --- */
function attemptLogin() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    
    if (DB.login(u, p)) {
        document.getElementById('login-error').style.display = 'none';
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('dashboard-screen').classList.add('active');
        loadAllData();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

function logout() {
    DB.logout();
    document.getElementById('dashboard-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

/* --- Navigation --- */
function switchTab(tabId, el) {
    document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

/* --- Data Loading --- */
 function loadAllData() {
     renderNewsTable();
     renderProfBadgesTable();
     renderProgBadgesTable();
     renderDownloadsTable();
     renderAdminsTable();
     renderSpecialNotice();
 }

function createTableHTML(headers, rowsHTML) {
    return `
        <table>
            <thead>
                <tr>
                    ${headers.map(h => `<th>${h}</th>`).join('')}
                    <th style="width: 100px;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHTML}
            </tbody>
        </table>
    `;
}

// ============== NEWS LOGIC ==============
async function renderNewsTable() {
    const container = document.getElementById('news-table-container');
    container.innerHTML = '<p style="padding:20px; text-align:center; color:#aaa;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';

    const news = await DB.getCollection('scout_news');
    
    if (news.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align:center; color: #888;">No news found. Add some!</p>';
        return;
    }

    const rows = news.map(n => `
        <tr>
            <td><strong>${n.title}</strong></td>
            <td>${n.date || ''}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editNews('${n.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn del-btn" onclick="deleteObj('scout_news', '${n.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = createTableHTML(['Title', 'Date'], rows);
}

 async function saveNews() {
     const id = document.getElementById('news-id').value;
     const obj = {
         title: document.getElementById('news-title').value,
         date: document.getElementById('news-date').value,
         image: document.getElementById('news-image').value,
         link: document.getElementById('news-link').value,
         description: document.getElementById('news-desc').value
     };
     if (id) obj.id = id;
     
     const btn = document.querySelector('#newsModal .btn-save');
     toggleBtnLoading(btn, true, "Saving...");

     try {
         await DB.saveObject('scout_news', obj);
         closeAllModals();
         resetGenericImgUI('news');
         renderNewsTable();
     } catch (e) {
         toggleBtnLoading(btn, false, "Save News");
     }
 }

async function editNews(id) {
    const items = await DB.getCollection('scout_news');
    const item = items.find(i => i.id === id);
    if (!item) return;

    document.getElementById('newsModalTitle').innerText = "Edit News";
    document.getElementById('news-id').value = item.id;
    document.getElementById('news-title').value = item.title;
    document.getElementById('news-date').value = item.date;
    document.getElementById('news-image').value = item.image || '';
    document.getElementById('news-link').value = item.link || '#';
    document.getElementById('news-desc').value = item.description || '';

    // Show preview of existing image
    const imgVal = item.image || '';
    if (imgVal) {
        showGenericPreview('news', imgVal);
        if (!imgVal.startsWith('data:')) {
            switchGenericImgTab('news', 'url');
            document.getElementById('news-img-url-input').value = imgVal;
        }
    } else {
        resetGenericImgUI('news');
    }

    openModalBase('newsModal');
}



// ============== GENERIC IMAGE HELPERS ==============
function switchGenericImgTab(prefix, mode) {
    const uploadSection = document.getElementById(`${prefix}-section-upload`);
    const urlSection    = document.getElementById(`${prefix}-section-url`);
    const tabUpload     = document.getElementById(`${prefix}-tab-upload`);
    const tabUrl        = document.getElementById(`${prefix}-tab-url`);

    if (mode === 'upload') {
        uploadSection.style.display = 'block';
        urlSection.style.display    = 'none';
        tabUpload.classList.add('active');
        tabUrl.classList.remove('active');
    } else {
        uploadSection.style.display = 'none';
        urlSection.style.display    = 'block';
        tabUpload.classList.remove('active');
        tabUrl.classList.add('active');
    }
}

function handleGenericImageUpload(prefix, input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        // Store value
        let targetId = `${prefix}-logo`;
        if (prefix === 'news') targetId = 'news-image';
        if (prefix === 'down') targetId = 'down-logo';
        if (prefix === 'admin') targetId = 'admin-image';
        if (prefix.startsWith('sub')) targetId = `${prefix}-val`;
        
        const target = document.getElementById(targetId);
        if (target) target.value = base64;
        
        if (prefix === 'down') {
            document.getElementById('down-file-name').innerText = file.name;
        }
        showGenericPreview(prefix, base64);
    };
    reader.readAsDataURL(file);
}

function handleGenericImageUrl(prefix, url) {
    let targetId = `${prefix}-logo`;
    if (prefix === 'news') targetId = 'news-image';
    if (prefix === 'down') targetId = 'down-logo';
    if (prefix === 'admin') targetId = 'admin-image';
    if (prefix.startsWith('sub')) targetId = `${prefix}-val`;
    
    const target = document.getElementById(targetId);
    if (target) target.value = url;
    
    if (url.trim()) {
        if (prefix === 'down') document.getElementById('down-file-name').innerText = "Linked Document";
        showGenericPreview(prefix, url);
    } else {
        hideGenericPreview(prefix);
    }
}

function showGenericPreview(prefix, src) {
    if (prefix === 'down') {
        const previewCont = document.getElementById('down-img-preview-container');
        if (previewCont) previewCont.style.display = 'block';
        return;
    }
    const preview = document.getElementById(`${prefix}-img-preview`);
    const placeholder = document.getElementById(`${prefix}-img-placeholder`) || document.getElementById('img-placeholder-text');
    if (preview) {
        preview.src = src;
        preview.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
}

function hideGenericPreview(prefix) {
    if (prefix === 'down') {
        const previewCont = document.getElementById('down-img-preview-container');
        if (previewCont) previewCont.style.display = 'none';
        return;
    }
    const preview = document.getElementById(`${prefix}-img-preview`);
    const placeholder = document.getElementById(`${prefix}-img-placeholder`) || document.getElementById('img-placeholder-text');
    if (preview) {
        preview.src = '';
        preview.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'block';
}

function resetGenericImgUI(prefix) {
    let targetId = `${prefix}-logo`;
    if (prefix === 'news') targetId = 'news-image';
    if (prefix === 'down') targetId = 'down-logo';
    if (prefix === 'admin') targetId = 'admin-image';
    if (prefix.startsWith('sub')) targetId = `${prefix}-val`;
    
    const target = document.getElementById(targetId);
    if (target) target.value = '';
    
    const urlInput = document.getElementById(`${prefix}-img-url-input`) || document.getElementById('news-image-url');
    if (urlInput) urlInput.value = '';
    
    hideGenericPreview(prefix);
    
    const fileInput = document.getElementById(`${prefix}-img-file`) || document.getElementById('news-img-file');
    if (fileInput) fileInput.value = '';
    
    switchGenericImgTab(prefix, 'upload');
}

// ============== PROFICIENCY BADGES ==============
async function renderProfBadgesTable() {
    const container = document.getElementById('prof-table-container');
    container.innerHTML = '<p style="padding:20px; text-align:center; color:#aaa;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';

    const badges = await DB.getCollection('scout_proficiency_badges');
    
    if (badges.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align:center; color: #888;">No badges found.</p>';
        return;
    }
    const rows = badges.map(b => `
        <tr>
            <td><span style="background:var(--bg-light); padding:2px 8px; border-radius:10px; font-size:12px;">${b.badgeCode}</span></td>
            <td>${b.name}</td>
            <td>${b.teacher || 'N/A'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editProfBadge('${b.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn del-btn" onclick="deleteObj('scout_proficiency_badges', '${b.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = createTableHTML(['Code', 'Name', 'Admin/Teacher'], rows);
}

 async function saveProfBadge() {
     const id = document.getElementById('prof-id').value;
     const obj = {
         badgeCode: document.getElementById('prof-code').value,
         group: document.getElementById('prof-group').value,
         name: document.getElementById('prof-name').value,
         logo: document.getElementById('prof-logo').value,
         teacher: document.getElementById('prof-teacher').value,
         contact: document.getElementById('prof-contact').value,
         syllabus: document.getElementById('prof-syllabus').value
     };
     if (id) obj.id = id;
     
     const btn = document.querySelector('#profBadgeModal .btn-save');
     toggleBtnLoading(btn, true, "Saving...");

     try {
         await DB.saveObject('scout_proficiency_badges', obj);
         closeAllModals();
         resetGenericImgUI('prof');
         renderProfBadgesTable();
     } catch (e) {
         toggleBtnLoading(btn, false, "Save Badge");
     }
 }

async function editProfBadge(id) {
    const items = await DB.getCollection('scout_proficiency_badges');
    const item = items.find(i => i.id === id);
    if (!item) return;

    document.getElementById('profModalTitle').innerText = "Edit Proficiency Badge";
    document.getElementById('prof-id').value = item.id;
    document.getElementById('prof-code').value = item.badgeCode;
    document.getElementById('prof-group').value = item.group;
    document.getElementById('prof-name').value = item.name;
    document.getElementById('prof-teacher').value = item.teacher;
    document.getElementById('prof-contact').value = item.contact;
    document.getElementById('prof-syllabus').value = item.syllabus;

    // Logo preview
    const logoVal = item.logo || '';
    document.getElementById('prof-logo').value = logoVal;
    if (logoVal) {
        showGenericPreview('prof', logoVal);
        if (!logoVal.startsWith('data:')) {
            switchGenericImgTab('prof', 'url');
            document.getElementById('prof-img-url-input').value = logoVal;
        }
    } else {
        resetGenericImgUI('prof');
    }
    
    openModalBase('profBadgeModal');
}

// ============== PROGRESS BADGES ==============
async function renderProgBadgesTable() {
    const container = document.getElementById('prog-table-container');
    container.innerHTML = '<p style="padding:20px; text-align:center; color:#aaa;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';

    const badges = await DB.getCollection('scout_progress_badges');
    
    if (badges.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align:center; color: #888;">No badges found.</p>';
        return;
    }
    const rows = badges.map(b => `
        <tr>
            <td>${b.name}</td>
            <td>
                <button class="action-btn" style="color:#FF9800;" onclick="openSubtopicsModal('${b.id}')" title="Manage Subtopics"><i class="fas fa-list"></i></button>
                <button class="action-btn edit-btn" onclick="editProgBadge('${b.id}')" title="Edit Badge"><i class="fas fa-edit"></i></button>
                <button class="action-btn del-btn" onclick="deleteObj('scout_progress_badges', '${b.id}')" title="Delete Badge"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = createTableHTML(['Name'], rows);
}

 async function saveProgBadge() {
     const id = document.getElementById('prog-id').value;
     let subtopics = [];
     if (id) {
         const existing = await DB.getCollection('scout_progress_badges');
         const found = existing.find(b => b.id === id);
         if (found && found.subtopics) subtopics = found.subtopics;
     }

     const obj = {
         name: document.getElementById('prog-name').value,
         logo: document.getElementById('prog-logo').value,
         description: document.getElementById('prog-desc').value,
         subtopics: subtopics
     };
     if (id) obj.id = id;
     
     const btn = document.querySelector('#progBadgeModal .btn-save');
     toggleBtnLoading(btn, true, "Saving...");

     try {
         await DB.saveObject('scout_progress_badges', obj);
         closeAllModals();
         resetGenericImgUI('prog');
         renderProgBadgesTable();
     } catch (e) {
         toggleBtnLoading(btn, false, "Save Badge");
     }
 }

async function editProgBadge(id) {
    const items = await DB.getCollection('scout_progress_badges');
    const item = items.find(i => i.id === id);
    if (!item) return;

    document.getElementById('progModalTitle').innerText = "Edit Progress Badge";
    document.getElementById('prog-id').value = item.id;
    document.getElementById('prog-name').value = item.name;
    document.getElementById('prog-desc').value = item.description;

    // Logo preview
    const logoVal = item.logo || '';
    document.getElementById('prog-logo').value = logoVal;
    if (logoVal) {
        showGenericPreview('prog', logoVal);
        if (!logoVal.startsWith('data:')) {
            switchGenericImgTab('prog', 'url');
            document.getElementById('prog-img-url-input').value = logoVal;
        }
    } else {
        resetGenericImgUI('prog');
    }
    
    openModalBase('progBadgeModal');
}

// ============== DOWNLOADS ==============
async function renderDownloadsTable() {
    const container = document.getElementById('downloads-table-container');
    container.innerHTML = '<p style="padding:20px; text-align:center; color:#aaa;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';

    const docs = await DB.getCollection('scout_downloads');
    
    if (docs.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align:center; color: #888;">No documents found. Add some!</p>';
        return;
    }

    const rows = docs.map(d => `
        <tr>
            <td><strong>${d.title}</strong></td>
            <td><span style="background:var(--bg-light); padding:2px 8px; border-radius:10px; font-size:12px;">${d.category || 'Uncategorized'}</span></td>
            <td>
                <button class="action-btn edit-btn" onclick="editDownload('${d.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn del-btn" onclick="deleteObj('scout_downloads', '${d.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = createTableHTML(['Title', 'Category'], rows);
}

async function saveDownload() {
    const id = document.getElementById('down-id').value;
    const obj = {
        title: document.getElementById('down-title').value,
        category: document.getElementById('down-category').value,
        description: document.getElementById('down-desc').value,
        link: document.getElementById('down-logo').value
    };
    if (id) obj.id = id;
    
    const btn = document.querySelector('#downloadModal .btn-save');
    toggleBtnLoading(btn, true, "Saving...");

    try {
        await DB.saveObject('scout_downloads', obj);
        closeAllModals();
        resetGenericImgUI('down');
        renderDownloadsTable();
    } catch (e) {
        toggleBtnLoading(btn, false, "Save Document");
    }
}

async function editDownload(id) {
    const items = await DB.getCollection('scout_downloads');
    const item = items.find(i => i.id === id);
    if (!item) return;

    document.getElementById('downloadModalTitle').innerText = "Edit Document";
    document.getElementById('down-id').value = item.id;
    document.getElementById('down-title').value = item.title;
    document.getElementById('down-category').value = item.category || '';
    document.getElementById('down-desc').value = item.description || '';
    
    const linkVal = item.link || '';
    document.getElementById('down-logo').value = linkVal;

    if (linkVal) {
        showGenericPreview('down', linkVal);
        document.getElementById('down-file-name').innerText = "Existing Document";
        if (!linkVal.startsWith('data:')) {
            switchGenericImgTab('down', 'url');
            document.getElementById('down-img-url-input').value = linkVal;
        }
    } else {
        resetGenericImgUI('down');
    }
    
    openModalBase('downloadModal');
}

// ============== ADMINS & LEADERS ==============
async function renderAdminsTable() {
    const container = document.getElementById('admins-table-container');
    container.innerHTML = '<p style="padding:20px; text-align:center; color:#aaa;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';

    const admins = await DB.getCollection('scout_admins');
    
    if (admins.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align:center; color: #888;">No admins or leaders found. Add some!</p>';
        return;
    }

    const rows = admins.map(a => `
        <tr>
            <td><strong>${a.name}</strong></td>
            <td><span style="background:var(--bg-light); padding:2px 8px; border-radius:10px; font-size:12px;">${a.role || 'N/A'}</span></td>
            <td>${a.school || '-'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editAdmin('${a.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn del-btn" onclick="deleteObj('scout_admins', '${a.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = createTableHTML(['Name', 'Role', 'School'], rows);
}

async function saveAdmin() {
    const id = document.getElementById('admin-id').value;
    const obj = {
        name: document.getElementById('admin-name').value,
        role: document.getElementById('admin-role').value,
        subRole: document.getElementById('admin-sub-role').value,
        school: document.getElementById('admin-school').value,
        phone: document.getElementById('admin-phone').value,
        image: document.getElementById('admin-image').value
    };
    if (id) obj.id = id;
    
    const btn = document.querySelector('#adminModal .btn-save');
    toggleBtnLoading(btn, true, "Saving...");

    try {
        await DB.saveObject('scout_admins', obj);
        closeAllModals();
        resetGenericImgUI('admin');
        renderAdminsTable();
    } catch (e) {
        toggleBtnLoading(btn, false, "Save Admin");
    }
}

async function editAdmin(id) {
    const items = await DB.getCollection('scout_admins');
    const item = items.find(i => i.id === id);
    if (!item) return;

    document.getElementById('adminModalTitle').innerText = "Edit Admin & Leader";
    document.getElementById('admin-id').value = item.id;
    document.getElementById('admin-name').value = item.name;
    document.getElementById('admin-role').value = item.role || 'Scout Leader';
    document.getElementById('admin-sub-role').value = item.subRole || '';
    document.getElementById('admin-school').value = item.school || '';
    document.getElementById('admin-phone').value = item.phone || '';
    
    checkAdminRole();
    
    const imgVal = item.image || '';
    document.getElementById('admin-image').value = imgVal;

    if (imgVal) {
        showGenericPreview('admin', imgVal);
        if (!imgVal.startsWith('data:')) {
            switchGenericImgTab('admin', 'url');
            document.getElementById('admin-img-url-input').value = imgVal;
        }
    } else {
        resetGenericImgUI('admin');
    }
    
    openModalBase('adminModal');
}

function checkAdminRole() {
    const role = document.getElementById('admin-role').value;
    if (role === 'Assistant District Commissioner') {
        document.getElementById('sub-role-container').style.display = 'block';
    } else {
        document.getElementById('sub-role-container').style.display = 'none';
        document.getElementById('admin-sub-role').value = '';
    }
}

// ============== SUBTOPICS LOGIC ==============
// Store current badge in memory to avoid refetching
let _currentBadge = null;

async function openSubtopicsModal(badgeId) {
    const badges = await DB.getCollection('scout_progress_badges');
    const badge = badges.find(b => b.id === badgeId);
    if (!badge) return;

    _currentBadge = badge;
    document.getElementById('subtopic-parent-id').value = badgeId;
    document.getElementById('subtopicsModalTitle').innerText = `Subtopics: ${badge.name}`;
    renderSubtopicsTable(badge);
    openModalBase('subtopicsModal');
}

function renderSubtopicsTable(badge) {
    const container = document.getElementById('subtopics-table-container');
    const subs = badge.subtopics || [];
    
    if (subs.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align:center; color: #888;">No subtopics found. Add some!</p>';
        return;
    }
    
    let html = `<table><thead><tr><th>Title</th><th style="width:100px;">Actions</th></tr></thead><tbody>`;
    subs.forEach(s => {
        html += `<tr>
            <td>${s.title}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editSubtopic('${badge.id}', '${s.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn del-btn" onclick="deleteSubtopic('${badge.id}', '${s.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function openSubtopicEditor() {
    document.getElementById('sub-id').value = '';
    document.getElementById('sub-title').value = '';
    document.getElementById('sub-desc').value = '';
    document.getElementById('sub-video').value = '';
    
    resetGenericImgUI('sub1');
    resetGenericImgUI('sub2');
    
    document.getElementById('subtopicEditorTitle').innerText = "Add New Subtopic";
    document.getElementById('subtopicEditorModal').style.display = 'block';
}

function closeSubtopicEditor() {
    document.getElementById('subtopicEditorModal').style.display = 'none';
}

 async function saveSubtopic() {
     const parentId = document.getElementById('subtopic-parent-id').value;
     const badges = await DB.getCollection('scout_progress_badges');
     const badge = badges.find(b => b.id === parentId);
     if (!badge) return;

     if (!badge.subtopics) badge.subtopics = [];
     
     const subId = document.getElementById('sub-id').value;
     
     // Combine 2 images
     const im1 = document.getElementById('sub1-val').value;
     const im2 = document.getElementById('sub2-val').value;
     const combinedImages = [im1, im2].filter(i => i && i.trim() !== '').join(',');

     const obj = {
         title: document.getElementById('sub-title').value,
         description: document.getElementById('sub-desc').value,
         images: combinedImages,
         videos: document.getElementById('sub-video').value
     };

     if (subId) {
         const idx = badge.subtopics.findIndex(s => s.id === subId);
         if (idx !== -1) {
             obj.id = subId;
             badge.subtopics[idx] = obj;
         }
     } else {
         obj.id = "sub-" + Date.now();
         badge.subtopics.push(obj);
     }

     const btn = document.querySelector('#subtopicEditorModal .btn-save');
     toggleBtnLoading(btn, true, "Saving...");

     try {
         await DB.saveObject('scout_progress_badges', badge);
         _currentBadge = badge;
         closeSubtopicEditor();
         renderSubtopicsTable(badge);
     } catch (e) {
         toggleBtnLoading(btn, false, "Save Subtopic");
     }
 }

async function editSubtopic(badgeId, subtopicId) {
    const badges = await DB.getCollection('scout_progress_badges');
    const badge = badges.find(b => b.id === badgeId);
    if (!badge || !badge.subtopics) return;
    
    const sub = badge.subtopics.find(s => s.id === subtopicId);
    if (!sub) return;

    document.getElementById('sub-id').value = sub.id;
    document.getElementById('sub-title').value = sub.title;
    document.getElementById('sub-desc').value = sub.description;
    document.getElementById('sub-video').value = Array.isArray(sub.videos) ? sub.videos.join(',') : (sub.videos || '');

    // Reset subtopic previews
    resetGenericImgUI('sub1');
    resetGenericImgUI('sub2');

    // Load up to 2 images
    if (sub.images) {
        const imgArray = sub.images.split(',').map(i => i.trim());
        if (imgArray[0]) {
            document.getElementById('sub1-val').value = imgArray[0];
            showGenericPreview('sub1', imgArray[0]);
            if (!imgArray[0].startsWith('data:')) {
                switchGenericImgTab('sub1', 'url');
                document.getElementById('sub1-img-url-input').value = imgArray[0];
            }
        }
        if (imgArray[1]) {
            document.getElementById('sub2-val').value = imgArray[1];
            showGenericPreview('sub2', imgArray[1]);
            if (!imgArray[1].startsWith('data:')) {
                switchGenericImgTab('sub2', 'url');
                document.getElementById('sub2-img-url-input').value = imgArray[1];
            }
        }
    }

    document.getElementById('subtopicEditorTitle').innerText = "Edit Subtopic";
    document.getElementById('subtopicEditorModal').style.display = 'block';
}

function deleteSubtopic(badgeId, subtopicId) {
    requestDelete(async () => {
        const badges = await DB.getCollection('scout_progress_badges');
        const badge = badges.find(b => b.id === badgeId);
        if (!badge || !badge.subtopics) return;
        
        badge.subtopics = badge.subtopics.filter(s => s.id !== subtopicId);
        await DB.saveObject('scout_progress_badges', badge);
        _currentBadge = badge;
        renderSubtopicsTable(badge);
    });
}

// ============== GENERIC DELETION AND MODALS ==============
let pendingDeleteAction = null;

function requestDelete(action) {
    pendingDeleteAction = action;
    document.getElementById('delete-password').value = '';
    document.getElementById('delete-error').style.display = 'none';
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
    pendingDeleteAction = null;
    document.getElementById('deleteModal').style.display = 'none';
    
    // Check if other modals are still open
    const openModals = Array.from(document.querySelectorAll('.modal')).filter(m => m.style.display === 'block');
    if (openModals.length === 0) {
        document.getElementById('overlay').style.display = 'none';
    }
}

function confirmDelete() {
    const pwd = document.getElementById('delete-password').value;
    if (pwd === 'admin123') {
        document.getElementById('delete-error').style.display = 'none';
        if (pendingDeleteAction) pendingDeleteAction();
        closeDeleteModal();
    } else {
        document.getElementById('delete-error').style.display = 'block';
    }
}

function deleteObj(collection, id) {
    requestDelete(async () => {
        await DB.deleteObject(collection, id);
        loadAllData();
    });
}


 
 
 function openModal(modalId) {
    document.getElementById(modalId).querySelectorAll('input, textarea, select').forEach(el => el.value = '');
    if (modalId === 'newsModal') {
        document.getElementById('newsModalTitle').innerText = "Publish New News";
        document.getElementById('news-link').value = "#";
        document.getElementById('news-date').value = new Date().toISOString().split('T')[0];
        resetGenericImgUI('news');
    } else if (modalId === 'profBadgeModal') {
        document.getElementById('profModalTitle').innerText = "Add Proficiency Badge";
        resetGenericImgUI('prof');
    } else if (modalId === 'progBadgeModal') {
        document.getElementById('progModalTitle').innerText = "Add Progress Badge";
        resetGenericImgUI('prog');
    } else if (modalId === 'downloadModal') {
        document.getElementById('downloadModalTitle').innerText = "Add New Document";
        resetGenericImgUI('down');
        document.getElementById('down-file-name').innerText = "";
    } else if (modalId === 'adminModal') {
        document.getElementById('adminModalTitle').innerText = "Add Admin & Leader";
        checkAdminRole();
        resetGenericImgUI('admin');
    }
    openModalBase(modalId);
}

function openModalBase(modalId) {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById(modalId).style.display = 'block';
}

 function closeAllModals() {
     document.getElementById('overlay').style.display = 'none';
     document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
 }

 function toggleBtnLoading(btn, isLoading, text) {
     if (!btn) return;
     btn.disabled = isLoading;
     btn.innerHTML = isLoading ? `<i class="fas fa-spinner fa-spin"></i> ${text}` : text;
 }

// ============== SIDEBAR NOTICE LOGIC ==============
async function renderSpecialNotice() {
    const notices = await DB.getCollection('scout_notices');
    const container = document.getElementById('notices-table-container');
    
    if (!notices || notices.length === 0) {
        container.innerHTML = '<p style="padding:20px; text-align:center; color:#666;">No notices added yet.</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Status</th>
                    <th>Content</th>
                    <th>Action Link</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    notices.forEach(n => {
        html += `
            <tr>
                <td><span class="status-badge ${n.enabled ? 'active' : ''}">${n.enabled ? 'Enabled' : 'Disabled'}</span></td>
                <td style="max-width:300px; font-size:13px;">${n.text}</td>
                <td style="font-size:12px; color:#666;">${n.link || 'None'}</td>
                <td class="actions">
                    <button class="btn-edit" onclick="editNotice('${n.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteNotice('${n.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

async function saveNotice() {
    const id = document.getElementById('notice-id').value;
    const obj = {
        enabled: document.getElementById('notice-enabled').checked,
        text: document.getElementById('notice-text').value,
        btnText: document.getElementById('notice-btn-text').value,
        link: document.getElementById('notice-link').value,
        date: new Date().toISOString()
    };

    if (!obj.text) {
        alert("Please enter notice content!");
        return;
    }

    try {
        if (id) obj.id = id;
        await DB.saveObject('scout_notices', obj);
        closeAllModals();
        renderSpecialNotice();
        // Clear inputs
        document.getElementById('notice-id').value = '';
        document.getElementById('notice-text').value = '';
        document.getElementById('notice-btn-text').value = '';
        document.getElementById('notice-link').value = '';
    } catch (e) {
        console.error(e);
        alert("Error saving notice");
    }
}

async function editNotice(id) {
    const notices = await DB.getCollection('scout_notices');
    const n = notices.find(item => item.id === id);
    if (!n) return;

    document.getElementById('notice-id').value = n.id;
    document.getElementById('notice-enabled').checked = n.enabled;
    document.getElementById('notice-text').value = n.text;
    document.getElementById('notice-btn-text').value = n.btnText || '';
    document.getElementById('notice-link').value = n.link || '';
    
    document.getElementById('noticeModalTitle').innerText = "Edit Notice";
    openModal('noticeModal');
}

async function deleteNotice(id) {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    try {
        await DB.deleteObject('scout_notices', id);
        renderSpecialNotice();
    } catch (e) {
        console.error(e);
        alert("Error deleting notice");
    }
}
