// admin.js - Admin Portal Logic

const API_URL = '/api';
let token = localStorage.getItem('adminToken');

document.addEventListener('DOMContentLoaded', () => {
    // Check if logged in
    if (token) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-app').style.display = 'flex';
        loadAllData();
    }

    // Tab Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.id === 'logout-btn') return;
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(t => t.style.display = 'none');
            
            e.currentTarget.classList.add('active');
            const tabId = e.currentTarget.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).style.display = 'block';
        });
    });
});

// Auth Login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-pass').value;
    
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();
        
        if (data.success) {
            token = data.token;
            localStorage.setItem('adminToken', token);
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('admin-app').style.display = 'flex';
            loadAllData();
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    } catch (err) {
        console.error('Login error', err);
    }
});

// Logout
document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.reload();
});

// Form Toggler
function toggleForm(formId) {
    const form = document.getElementById(formId);
    form.classList.toggle('active');
    form.reset();
}

// Fetch helper
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Authorization': token }
    };
    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    const res = await fetch(`${API_URL}${endpoint}`, options);
    if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.reload();
    }
    return res.json();
}

async function loadAllData() {
    loadMembers();
    loadProjects();
    loadAchievements();
    loadMessages();
}

// ============== MEMBERS ==============
async function loadMembers() {
    const members = await apiCall('/members');
    const container = document.getElementById('members-list');
    container.innerHTML = '';
    members.forEach(m => {
        container.innerHTML += `
            <div class="bento-row">
                <div class="bento-cell"><strong style="color:var(--white); font-family:var(--font-head); font-size:1.05rem;">${m.name}</strong><br><span class="muted">${m.role}</span></div>
                <div class="bento-cell"><span class="tag tag-gold">${m.type}</span></div>
                <div class="bento-cell muted" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.skills || 'N/A'}</div>
                <div class="bento-cell" style="display:flex; justify-content:flex-end;">
                    <button class="action-btn" onclick="deleteItem('members', ${m.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
}

document.getElementById('member-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('m-name').value);
    formData.append('role', document.getElementById('m-role').value);
    formData.append('type', document.getElementById('m-type').value);
    formData.append('skills', document.getElementById('m-skills').value);
    formData.append('github', document.getElementById('m-github').value);
    formData.append('linkedin', document.getElementById('m-linkedin').value);

    const imageInput = document.getElementById('m-image');
    if (imageInput && imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        const res = await fetch(`${API_URL}/members`, {
            method: 'POST',
            headers: { 'Authorization': token },
            body: formData
        });
        if (res.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.reload();
            return;
        }
    } catch(err) {
        console.error('Error adding member:', err);
    }

    toggleForm('member-form');
    loadMembers();
});

// ============== PROJECTS ==============
async function loadProjects() {
    const projects = await apiCall('/projects');
    const container = document.getElementById('projects-list');
    container.innerHTML = '';
    projects.forEach(p => {
        container.innerHTML += `
            <div class="bento-row">
                <div class="bento-cell"><strong style="color:var(--white); font-family:var(--font-head); font-size:1.05rem;">${p.title}</strong></div>
                <div class="bento-cell"><span class="tag tag-gold">${p.category}</span></div>
                <div class="bento-cell muted" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.techstack || 'N/A'}</div>
                <div class="bento-cell" style="display:flex; justify-content:flex-end;">
                    <button class="action-btn" onclick="deleteItem('projects', ${p.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
}

document.getElementById('project-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', document.getElementById('p-title').value);
    formData.append('tag', document.getElementById('p-tag').value);
    formData.append('category', document.getElementById('p-category').value);
    formData.append('techstack', document.getElementById('p-tech').value);
    formData.append('link', document.getElementById('p-link').value);

    const imageInput = document.getElementById('p-image');
    if (imageInput && imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        const res = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 'Authorization': token },
            body: formData
        });
        if (res.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.reload();
            return;
        }
    } catch(err) {
        console.error('Error adding project:', err);
    }
    toggleForm('project-form');
    loadProjects();
});

// ============== ACHIEVEMENTS ==============
async function loadAchievements() {
    const ach = await apiCall('/achievements');
    const container = document.getElementById('achievements-list');
    container.innerHTML = '';
    ach.forEach(a => {
        container.innerHTML += `
            <div class="bento-row">
                <div class="bento-cell"><strong style="color:var(--white); font-family:var(--font-head); font-size:1.05rem;">${a.title}</strong><br><span class="muted" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 200px; display: inline-block;">${a.description || ''}</span></div>
                <div class="bento-cell"><span class="tag tag-gold">${a.type.replace('_', ' ')}</span></div>
                <div class="bento-cell muted">${a.date || 'N/A'}</div>
                <div class="bento-cell" style="display:flex; justify-content:flex-end;">
                    <button class="action-btn" onclick="deleteItem('achievements', ${a.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
}

document.getElementById('achievement-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('type', document.getElementById('a-type').value);
    formData.append('title', document.getElementById('a-title').value);
    formData.append('date', document.getElementById('a-date').value);
    formData.append('description', document.getElementById('a-desc').value);

    const imageInput = document.getElementById('a-image');
    if (imageInput && imageInput.files.length > 0) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        const res = await fetch(`${API_URL}/achievements`, {
            method: 'POST',
            headers: { 'Authorization': token },
            body: formData
        });
        if (res.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.reload();
            return;
        }
    } catch(err) {
        console.error('Error adding achievement:', err);
    }
    toggleForm('achievement-form');
    loadAchievements();
});

// ============== MESSAGES ==============
async function loadMessages() {
    const messages = await apiCall('/messages');
    const list = document.getElementById('messages-list');
    list.innerHTML = '';
    messages.forEach(msg => {
        const date = new Date(msg.created_at).toLocaleString();
        list.innerHTML += `
            <div class="msg-card">
                <div style="display:flex; justify-content:space-between; margin-bottom: 12px; border-bottom: 1px solid var(--glass-border); padding-bottom: 12px;">
                    <div><strong style="color:var(--gold); font-family:var(--font-head);"><i class="fas fa-user-circle"></i> ${msg.name}</strong><br><span style="color:var(--muted); font-size:0.8rem;">${msg.email}</span></div>
                    <div style="color:var(--muted); font-size:0.75rem; text-align:right;">${date}</div>
                </div>
                <h4 style="margin-bottom:8px; font-size:1.05rem;">${msg.subject}</h4>
                <p style="color:#d1d1d1; font-size:0.9rem; line-height: 1.6; margin:0;">${msg.message}</p>
            </div>
        `;
    });
}

// Generic Delete
async function deleteItem(type, id) {
    if (confirm('Are you sure you want to delete this item?')) {
        await apiCall(`/${type}/${id}`, 'DELETE');
        if (type === 'members') loadMembers();
        if (type === 'projects') loadProjects();
        if (type === 'achievements') loadAchievements();
    }
}
