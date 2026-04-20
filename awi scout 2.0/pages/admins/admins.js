document.addEventListener("DOMContentLoaded", async () => {
    await renderTeam();
    setupFilters();
});

let allAdmins = [];

async function renderTeam() {
    const container = document.getElementById('team-grid-container');
    
    if (typeof window.DB === 'undefined') {
        container.innerHTML = '<div class="empty-team">Database connection not found.</div>';
        return;
    }

    allAdmins = await window.DB.getCollection('scout_admins');
    
    if (allAdmins.length === 0) {
        container.innerHTML = '<div class="empty-team">No team members found.</div>';
        return;
    }
    
    // Sort array so that District Commissioner is on top
    allAdmins.sort((a, b) => {
        const order = {
            "District Commissioner": 1,
            "Assistant District Commissioner": 2,
            "Scout Leader": 3
        };
        const aRank = order[a.role] || 4;
        const bRank = order[b.role] || 4;
        return aRank - bRank;
    });

    displayTeam(allAdmins);
}

function displayTeam(members) {
    const container = document.getElementById('team-grid-container');
    container.innerHTML = '';
    
    if (members.length === 0) {
        container.innerHTML = '<div class="empty-team">No members match this filter.</div>';
        return;
    }

    let html = '';
    members.forEach(m => {
        // Prepare image
        const imgSrc = m.image && m.image.trim() !== '' ? m.image : 'https://via.placeholder.com/200x200/cccccc/333333?text=No+Image';
        
        let displayRole = m.role || 'Scout Member';
        if (m.role === 'Assistant District Commissioner' && m.subRole && m.subRole.trim() !== '') {
            displayRole = 'ADC - ' + m.subRole;
        }
        
        html += `
            <div class="team-member" onclick="openTeamModal('${m.id}')">
                <div class="member-img-wrapper">
                    <img src="${imgSrc}" alt="${m.name}" class="member-img">
                    <div class="member-badge"><i class="fas fa-handshake"></i></div>
                </div>
                <div class="member-info">
                    <h3>${m.name}</h3>
                    <p>${displayRole}</p>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active from all
            buttons.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            e.target.classList.add('active');
            
            const filter = e.target.getAttribute('data-filter');
            if (filter === 'All') {
                displayTeam(allAdmins);
            } else {
                const filtered = allAdmins.filter(a => a.role === filter);
                displayTeam(filtered);
            }
        });
    });
}

function openTeamModal(id) {
    const member = allAdmins.find(m => m.id === id);
    if (!member) return;

    document.getElementById('tm-name').innerText = member.name;
    let displayRole = member.role || 'Scout Member';
    if (member.role === 'Assistant District Commissioner' && member.subRole && member.subRole.trim() !== '') {
        displayRole = 'ADC - ' + member.subRole;
    }
    document.getElementById('tm-role').innerText = displayRole;
    
    document.getElementById('tm-school').innerText = member.school && member.school.trim() !== '' ? member.school : 'Not Updated';
    document.getElementById('tm-phone').innerText = member.phone && member.phone.trim() !== '' ? member.phone : 'Not Updated';
    
    document.getElementById('tm-pic').src = member.image && member.image.trim() !== '' ? member.image : 'https://via.placeholder.com/200x200/cccccc/333333?text=No+Image';

    const modal = document.getElementById('teamInfoModal');
    modal.style.display = 'flex';
}

function closeTeamModal() {
    document.getElementById('teamInfoModal').style.display = 'none';
}

// Close modal if clicked outside of content
window.onclick = function(event) {
    const modal = document.getElementById('teamInfoModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
