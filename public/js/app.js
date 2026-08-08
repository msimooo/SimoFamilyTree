'use strict';

/* ══════════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════════ */
const state = {
  user: null,
  people: [],
  users: [],
};

let zoomBehavior = null;
let currentTreeNodes = [];
let currentTreeLinks = [];

/* ══════════════════════════════════════════════════════════
   API HELPER
═══════════════════════════════════════════════════════════ */
async function api(path, options) {
  const opts = Object.assign({ credentials: 'same-origin' }, options || {});
  const res = await fetch('/api' + path, opts);
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  if (!res.ok) {
    const err = new Error((data && (data.message || data.error)) || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
function apiJSON(path, method, body) {
  return api(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
}
function apiForm(path, method, formData) {
  return api(path, { method, body: formData });
}

/* ══════════════════════════════════════════════════════════
   UTIL
═══════════════════════════════════════════════════════════ */
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function initialsOf(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}
function $(id) { return document.getElementById(id); }

function toast(msg, kind) {
  const el = document.createElement('div');
  el.className = 'toast-item' + (kind ? ' ' + kind : '');
  el.textContent = msg;
  $('toastContainer').appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 260); }, 3200);
}

/* generic confirm dialog, promise based */
function confirmDialog(title, message, okLabel) {
  return new Promise((resolve) => {
    $('confirmTitle').textContent = title;
    $('confirmMessage').textContent = message;
    $('confirmOkBtn').textContent = okLabel || 'Confirm';
    showOverlay('confirmOverlay', 'confirmModal');
    const cleanup = (result) => {
      hideOverlay('confirmOverlay', 'confirmModal');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(result);
    };
    const okBtn = $('confirmOkBtn');
    const cancelBtn = $('confirmCancelBtn');
    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  });
}

function showOverlay(overlayId, boxId) {
  $(overlayId).classList.add('open');
  $(boxId).classList.add('open');
}
function hideOverlay(overlayId, boxId) {
  $(overlayId).classList.remove('open');
  $(boxId).classList.remove('open');
}

/* ══════════════════════════════════════════════════════════
   AUTH FLOW
═══════════════════════════════════════════════════════════ */
async function checkSession() {
  const data = await api('/auth/me');
  if (data.user) {
    state.user = data.user;
    enterApp();
  } else {
    showLogin();
  }
}
function showLogin() {
  $('loginScreen').classList.remove('hidden');
  $('app').classList.add('hidden');
}
async function enterApp() {
  $('loginScreen').classList.add('hidden');
  $('app').classList.remove('hidden');
  $('userChipName').textContent = state.user.display_name;
  $('userChipRole').textContent = state.user.role;
  $('userAvatar').textContent = initialsOf(state.user.display_name);
  $('manageUsersBtn').classList.toggle('hidden', state.user.role !== 'admin');
  $('importJsonBtn').classList.toggle('hidden', state.user.role !== 'admin');
  initTreeSvgIfNeeded();
  await fetchPeople();
}

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('loginError').classList.add('hidden');
  const username = $('loginUsername').value.trim();
  const password = $('loginPassword').value;
  try {
    const data = await apiJSON('/auth/login', 'POST', { username, password });
    state.user = data.user;
    $('loginPassword').value = '';
    await enterApp();
  } catch (err) {
    $('loginError').textContent = err.message || 'Invalid username or password';
    $('loginError').classList.remove('hidden');
  }
});

$('logoutBtn').addEventListener('click', async () => {
  await api('/auth/logout', { method: 'POST' });
  state.user = null;
  hideOverlay('accountOverlay', 'accountModal');
  showLogin();
});

$('userChip').addEventListener('click', () => {
  $('accountSub').textContent = state.user.display_name + ' · ' + state.user.role;
  $('curPasswordInput').value = '';
  $('newPasswordInput').value = '';
  showOverlay('accountOverlay', 'accountModal');
});
$('accountOverlay').addEventListener('click', () => hideOverlay('accountOverlay', 'accountModal'));

$('changePasswordBtn').addEventListener('click', async () => {
  const currentPassword = $('curPasswordInput').value;
  const newPassword = $('newPasswordInput').value;
  if (!currentPassword || !newPassword) { toast('Fill in both password fields', 'danger'); return; }
  try {
    await apiJSON('/auth/password', 'PUT', { currentPassword, newPassword });
    toast('Password updated', 'success');
    hideOverlay('accountOverlay', 'accountModal');
  } catch (err) {
    toast(err.message, 'danger');
  }
});

/* ══════════════════════════════════════════════════════════
   PEOPLE DATA
═══════════════════════════════════════════════════════════ */
async function fetchPeople() {
  const data = await api('/people');
  state.people = data.people;
  renderTree();
}
function findPerson(id) {
  return state.people.find((p) => p.id === Number(id));
}
function childrenOf(id) {
  return state.people.filter((p) => p.father_id === Number(id));
}

/* ══════════════════════════════════════════════════════════
   TREE RENDERING (D3)
═══════════════════════════════════════════════════════════ */
const NODE_W = 150, NODE_H = 128;

function initTreeSvgIfNeeded() {
  if (zoomBehavior) return;
  zoomBehavior = d3.zoom()
    .scaleExtent([0.3, 2.2])
    .on('start', () => $('treeSvg').classList.add('panning'))
    .on('zoom', (event) => d3.select('#treeRoot').attr('transform', event.transform))
    .on('end', () => $('treeSvg').classList.remove('panning'));
  d3.select('#treeSvg').call(zoomBehavior);

  $('zoomInBtn').addEventListener('click', () => d3.select('#treeSvg').transition().duration(150).call(zoomBehavior.scaleBy, 1.25));
  $('zoomOutBtn').addEventListener('click', () => d3.select('#treeSvg').transition().duration(150).call(zoomBehavior.scaleBy, 0.8));
  $('zoomResetBtn').addEventListener('click', () => centerTree(currentTreeNodes));

  window.addEventListener('resize', () => centerTree(currentTreeNodes));
}

function buildForest(people) {
  const byId = new Map();
  people.forEach((p) => byId.set(p.id, Object.assign({}, p, { children: [] })));
  const virtualRoot = { id: '__virtual__', children: [] };
  people.forEach((p) => {
    const node = byId.get(p.id);
    if (p.father_id && byId.has(p.father_id)) {
      byId.get(p.father_id).children.push(node);
    } else {
      virtualRoot.children.push(node);
    }
  });
  return virtualRoot;
}

function personNodeHTML(p) {
  const photo = p.photo_path
    ? '<img src="' + escapeHtml(p.photo_path) + '" alt="">'
    : '<span class="person-initial">' + escapeHtml(initialsOf(p.first_name)) + '</span>';
  return (
    '<div class="person-photo-wrap">' + photo + '</div>' +
    '<div class="person-name">' + escapeHtml(p.first_name) + '</div>' +
    '<div class="person-gender-tag">' + escapeHtml(p.gender) + '</div>'
  );
}

function renderTree() {
  const people = state.people;
  $('emptyTree').classList.toggle('hidden', people.length > 0);

  const g = d3.select('#treeRoot');
  g.selectAll('*').remove();

  if (!people.length) { currentTreeNodes = []; currentTreeLinks = []; return; }

  const hierarchyData = d3.hierarchy(buildForest(people), (d) => d.children);
  const layout = d3.tree().nodeSize([NODE_W, NODE_H]);
  layout(hierarchyData);

  const nodes = hierarchyData.descendants().filter((d) => d.data.id !== '__virtual__');
  const links = hierarchyData.links().filter((l) => l.source.data.id !== '__virtual__');
  currentTreeNodes = nodes;
  currentTreeLinks = links;

  const linkGen = d3.linkVertical().x((d) => d.x).y((d) => d.y);
  g.selectAll('path.tree-link')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'tree-link')
    .attr('d', linkGen);

  const nodeSel = g.selectAll('g.tree-node')
    .data(nodes, (d) => d.data.id)
    .enter()
    .append('g')
    .attr('class', 'tree-node')
    .attr('transform', (d) => 'translate(' + (d.x - NODE_W / 2) + ',' + (d.y - 8) + ')');

  nodeSel.append('foreignObject')
    .attr('width', NODE_W)
    .attr('height', NODE_H)
    .append('xhtml:div')
    .attr('class', (d) => 'person-node ' + d.data.gender)
    .html((d) => personNodeHTML(d.data))
    .on('click', (event, d) => openPersonPanel(d.data.id));

  centerTree(nodes);
}

function centerTree(nodes) {
  if (!zoomBehavior || !nodes || !nodes.length) return;
  const svgEl = $('treeSvg');
  const w = svgEl.clientWidth || 800;
  const h = svgEl.clientHeight || 600;
  const xs = nodes.map((d) => d.x);
  const ys = nodes.map((d) => d.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const treeWidth = Math.max(maxX - minX, 1);
  const scale = Math.min(1, Math.max(0.35, (w - 140) / (treeWidth + NODE_W)));
  const tx = w / 2 - ((minX + maxX) / 2) * scale;
  const ty = 80 - minY * scale;
  d3.select('#treeSvg').transition().duration(200)
    .call(zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
}

/* ══════════════════════════════════════════════════════════
   PERSON DETAIL PANEL
═══════════════════════════════════════════════════════════ */
let currentPersonId = null;
let detailGender = 'male';

function setPillActive(btn, group, activeClassBase) {
  group.forEach((b) => b.classList.remove('active-male', 'active-female'));
  btn.classList.add(activeClassBase === 'male' ? 'active-male' : 'active-female');
}

function openPersonPanel(id) {
  const p = findPerson(id);
  if (!p) return;
  currentPersonId = p.id;
  detailGender = p.gender;

  $('detailName').value = p.first_name;
  updateDetailPhoto(p);
  updateDetailGenderPills();

  const father = p.father_id ? findPerson(p.father_id) : null;
  $('detailFatherLine').innerHTML = father
    ? 'Father: <b>' + escapeHtml(father.first_name) + '</b>'
    : 'No father recorded — this person is a first ancestor.';
  const kids = childrenOf(p.id);
  $('detailChildrenLine').innerHTML = kids.length
    ? 'Children: <b>' + kids.map((k) => escapeHtml(k.first_name)).join(', ') + '</b>'
    : 'No children recorded yet.';

  $('addFatherBtn').disabled = !!p.father_id;
  $('addFatherBtn').title = p.father_id ? 'This person already has a father recorded' : '';

  $('personPanel').querySelector('h2').textContent = p.first_name;
  showOverlay('personPanelOverlay', 'personPanel');
  $('personPanel').classList.add('open');
}
function closePersonPanel() {
  hideOverlay('personPanelOverlay', 'personPanel');
  currentPersonId = null;
}
$('personPanelClose').addEventListener('click', closePersonPanel);
$('personPanelOverlay').addEventListener('click', closePersonPanel);

function updateDetailPhoto(p) {
  const wrap = $('detailPhotoWrap');
  wrap.className = 'detail-photo' + (p.gender === 'female' ? ' female' : '');
  wrap.innerHTML = p.photo_path
    ? '<img src="' + escapeHtml(p.photo_path) + '" alt="">'
    : '<span class="person-initial">' + escapeHtml(initialsOf(p.first_name)) + '</span>';
}
function updateDetailGenderPills() {
  const maleBtn = $('detailGenderMale'), femaleBtn = $('detailGenderFemale');
  maleBtn.classList.toggle('active-male', detailGender === 'male');
  femaleBtn.classList.toggle('active-female', detailGender === 'female');
}
$('detailGenderMale').addEventListener('click', () => { detailGender = 'male'; updateDetailGenderPills(); });
$('detailGenderFemale').addEventListener('click', () => { detailGender = 'female'; updateDetailGenderPills(); });

$('detailSaveBtn').addEventListener('click', async () => {
  if (!currentPersonId) return;
  const first_name = $('detailName').value.trim();
  if (!first_name) { toast('First name is required', 'danger'); return; }
  try {
    await apiJSON('/people/' + currentPersonId, 'PUT', { first_name, gender: detailGender });
    toast('Saved', 'success');
    await fetchPeople();
    const p = findPerson(currentPersonId);
    if (p) { $('personPanel').querySelector('h2').textContent = p.first_name; updateDetailPhoto(p); }
  } catch (err) {
    toast(err.message, 'danger');
  }
});

$('detailPhotoInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file || !currentPersonId) return;
  const fd = new FormData();
  fd.append('photo', file);
  try {
    const data = await apiForm('/people/' + currentPersonId, 'PUT', fd);
    toast('Photo updated', 'success');
    await fetchPeople();
    updateDetailPhoto(data.person);
  } catch (err) {
    toast(err.message, 'danger');
  }
  e.target.value = '';
});

$('detailRemovePhotoBtn').addEventListener('click', async () => {
  if (!currentPersonId) return;
  try {
    await api('/people/' + currentPersonId + '/photo', { method: 'DELETE' });
    toast('Photo removed', 'success');
    await fetchPeople();
    const p = findPerson(currentPersonId);
    if (p) updateDetailPhoto(p);
  } catch (err) {
    toast(err.message, 'danger');
  }
});

$('detailDeleteBtn').addEventListener('click', async () => {
  if (!currentPersonId) return;
  const p = findPerson(currentPersonId);
  const ok = await confirmDialog('Delete ' + p.first_name + '?', 'This cannot be undone.', 'Delete');
  if (!ok) return;
  try {
    await api('/people/' + currentPersonId, { method: 'DELETE' });
    toast('Person deleted', 'success');
    closePersonPanel();
    await fetchPeople();
  } catch (err) {
    if (err.status === 409 && err.data && err.data.error === 'has_children') {
      const cascade = await confirmDialog(
        'Delete entire branch?',
        err.data.message + ' Deleting the branch will permanently remove all of them.',
        'Delete Branch'
      );
      if (!cascade) return;
      try {
        await api('/people/' + currentPersonId + '?cascade=true', { method: 'DELETE' });
        toast('Branch deleted', 'success');
        closePersonPanel();
        await fetchPeople();
      } catch (err2) {
        toast(err2.message, 'danger');
      }
    } else {
      toast(err.message, 'danger');
    }
  }
});

/* ══════════════════════════════════════════════════════════
   ADD RELATIVE / ANCESTOR MODAL
═══════════════════════════════════════════════════════════ */
let relFormRelation = null; // 'root' | 'father' | 'son' | 'daughter'
let relFormRelativeId = null;
let relFormGender = 'male';
let relFormPhotoFile = null;

function openRelForm(relation, relativeId) {
  relFormRelation = relation;
  relFormRelativeId = relativeId || null;
  relFormGender = relation === 'daughter' ? 'female' : 'male';
  relFormPhotoFile = null;

  $('relFormName').value = '';
  $('relPhotoPreview').classList.add('hidden');
  $('relPhotoIcon').classList.remove('hidden');
  $('relPhotoInput').value = '';

  const titles = {
    root: ['Add a First Ancestor', 'They will become the root of a new family line.'],
    father: ['Add Father', 'This will extend the tree upward from the selected person.'],
    son: ['Add Son', 'This will add a new child under the selected person.'],
    daughter: ['Add Daughter', 'This will add a new child under the selected person.'],
  };
  $('relFormTitle').textContent = titles[relation][0];
  $('relFormSub').textContent = titles[relation][1];

  updateRelGenderPills();
  showOverlay('relFormOverlay', 'relFormModal');
  setTimeout(() => $('relFormName').focus(), 120);
}
function closeRelForm() {
  hideOverlay('relFormOverlay', 'relFormModal');
}
$('relFormCancel').addEventListener('click', closeRelForm);
$('relFormOverlay').addEventListener('click', closeRelForm);

function updateRelGenderPills() {
  $('relGenderMale').classList.toggle('active-male', relFormGender === 'male');
  $('relGenderFemale').classList.toggle('active-female', relFormGender === 'female');
}
$('relGenderMale').addEventListener('click', () => { relFormGender = 'male'; updateRelGenderPills(); });
$('relGenderFemale').addEventListener('click', () => { relFormGender = 'female'; updateRelGenderPills(); });

$('relPhotoInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  relFormPhotoFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    $('relPhotoPreview').src = ev.target.result;
    $('relPhotoPreview').classList.remove('hidden');
    $('relPhotoIcon').classList.add('hidden');
  };
  reader.readAsDataURL(file);
});

$('relFormSave').addEventListener('click', async () => {
  const first_name = $('relFormName').value.trim();
  if (!first_name) { toast('First name is required', 'danger'); return; }

  const fd = new FormData();
  fd.append('first_name', first_name);
  fd.append('gender', relFormGender);
  fd.append('relation', relFormRelation);
  if (relFormRelativeId) fd.append('relative_id', relFormRelativeId);
  if (relFormPhotoFile) fd.append('photo', relFormPhotoFile);

  try {
    await apiForm('/people', 'POST', fd);
    toast(first_name + ' added', 'success');
    closeRelForm();
    await fetchPeople();
    if (relFormRelation !== 'root' && relFormRelativeId) {
      // keep the side panel in sync if it's open on the same relative
      if (currentPersonId === Number(relFormRelativeId)) openPersonPanel(relFormRelativeId);
    }
  } catch (err) {
    toast(err.message, 'danger');
  }
});

$('addSonBtn').addEventListener('click', () => openRelForm('son', currentPersonId));
$('addDaughterBtn').addEventListener('click', () => openRelForm('daughter', currentPersonId));
$('addFatherBtn').addEventListener('click', () => openRelForm('father', currentPersonId));
$('addAncestorBtn').addEventListener('click', () => openRelForm('root', null));
$('emptyAddAncestorBtn').addEventListener('click', () => openRelForm('root', null));

/* ══════════════════════════════════════════════════════════
   ADMIN: MANAGE USERS
═══════════════════════════════════════════════════════════ */
let newUserRole = 'assistant';

$('manageUsersBtn').addEventListener('click', async () => {
  await fetchUsers();
  showOverlay('adminPanelOverlay', 'adminPanel');
  $('adminPanel').classList.add('open');
});
$('adminPanelClose').addEventListener('click', () => hideOverlay('adminPanelOverlay', 'adminPanel'));
$('adminPanelOverlay').addEventListener('click', () => hideOverlay('adminPanelOverlay', 'adminPanel'));

async function fetchUsers() {
  const data = await api('/users');
  state.users = data.users;
  renderUsersTable();
}
function renderUsersTable() {
  $('usersTableBody').innerHTML = state.users.map((u) => {
    const isSelf = state.user && u.id === state.user.id;
    return (
      '<tr>' +
        '<td>' + escapeHtml(u.display_name) + (isSelf ? ' <span style="color:var(--ink-3);font-size:11px">(you)</span>' : '') +
          '<div style="color:var(--ink-3);font-size:11px">@' + escapeHtml(u.username) + '</div></td>' +
        '<td><span class="role-badge ' + u.role + '">' + u.role + '</span></td>' +
        '<td style="text-align:right;white-space:nowrap">' +
          '<button class="btn btn-ghost btn-sm" onclick="toggleUserRole(' + u.id + ',\'' + u.role + '\')">' +
            (u.role === 'admin' ? 'Make Assistant' : 'Make Admin') +
          '</button> ' +
          (isSelf ? '' : '<button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteUser(' + u.id + ')">Delete</button>') +
        '</td>' +
      '</tr>'
    );
  }).join('');
}

async function toggleUserRole(id, currentRole) {
  const newRole = currentRole === 'admin' ? 'assistant' : 'admin';
  try {
    await apiJSON('/users/' + id, 'PUT', { role: newRole });
    toast('Role updated', 'success');
    await fetchUsers();
  } catch (err) {
    toast(err.message, 'danger');
  }
}
async function deleteUser(id) {
  const ok = await confirmDialog('Remove this user?', 'They will lose access immediately.', 'Remove');
  if (!ok) return;
  try {
    await api('/users/' + id, { method: 'DELETE' });
    toast('User removed', 'success');
    await fetchUsers();
  } catch (err) {
    toast(err.message, 'danger');
  }
}
window.toggleUserRole = toggleUserRole;
window.deleteUser = deleteUser;

$('roleAssistantBtn').addEventListener('click', () => { newUserRole = 'assistant'; updateNewUserRolePills(); });
$('roleAdminBtn').addEventListener('click', () => { newUserRole = 'admin'; updateNewUserRolePills(); });
function updateNewUserRolePills() {
  $('roleAssistantBtn').classList.toggle('active-male', newUserRole === 'assistant');
  $('roleAdminBtn').classList.toggle('active-female', newUserRole === 'admin');
}
updateNewUserRolePills();

$('createUserBtn').addEventListener('click', async () => {
  const display_name = $('newUserDisplayName').value.trim();
  const username = $('newUserUsername').value.trim();
  const password = $('newUserPassword').value;
  if (!display_name || !username || !password) { toast('Fill in all fields', 'danger'); return; }
  try {
    await apiJSON('/users', 'POST', { display_name, username, password, role: newUserRole });
    toast('User created', 'success');
    $('newUserDisplayName').value = '';
    $('newUserUsername').value = '';
    $('newUserPassword').value = '';
    await fetchUsers();
  } catch (err) {
    toast(err.message, 'danger');
  }
});

/* ══════════════════════════════════════════════════════════
   EXPORT: PDF / JPG (visual snapshot, no login needed to view)
   Rendered with plain SVG primitives (no <foreignObject>/HTML) —
   foreignObject content taints the canvas on export in every
   browser, even for same-origin content, so it can't be used here.
═══════════════════════════════════════════════════════════ */
function imageUrlToDataURL(url) {
  return fetch(url, { credentials: 'same-origin' })
    .then((res) => { if (!res.ok) throw new Error('photo fetch failed'); return res.blob(); })
    .then((blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}

function truncateForExport(name, max) {
  const n = String(name || '');
  return n.length > max ? n.slice(0, max - 1).trim() + '…' : n;
}

function personNodeSVG(d, photoMap, x, y) {
  const p = d.data;
  const color = p.gender === 'female' ? '#B4657A' : '#4C6E91';
  const r = 32;
  const cx = x + NODE_W / 2;
  const cy = y + r;
  const src = p.photo_path ? photoMap[p.id] : null;
  const clipId = 'clip-' + p.id;

  let photoMarkup;
  if (src) {
    const innerR = r - 3;
    photoMarkup =
      '<clipPath id="' + clipId + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + innerR + '"/></clipPath>' +
      '<image href="' + src + '" x="' + (cx - innerR) + '" y="' + (cy - innerR) + '" width="' + (innerR * 2) + '" height="' + (innerR * 2) + '" ' +
        'preserveAspectRatio="xMidYMid slice" clip-path="url(#' + clipId + ')"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 1.5) + '" fill="none" stroke="' + color + '" stroke-width="3"/>';
  } else {
    photoMarkup =
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 1.5) + '" fill="#F7F1E6" stroke="' + color + '" stroke-width="3"/>' +
      '<text x="' + cx + '" y="' + (cy + 8) + '" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" font-size="24" font-weight="600" fill="' + color + '">' +
        escapeHtml(initialsOf(p.first_name)) + '</text>';
  }

  const nameY = cy + r + 20;
  const tagY = nameY + 15;
  return (
    photoMarkup +
    '<text x="' + cx + '" y="' + nameY + '" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="600" fill="#3A2E22">' +
      escapeHtml(truncateForExport(p.first_name, 16)) + '</text>' +
    '<text x="' + cx + '" y="' + tagY + '" text-anchor="middle" font-family="Arial, sans-serif" font-size="9.5" font-weight="700" letter-spacing="0.6" fill="' + color + '">' +
      escapeHtml(p.gender.toUpperCase()) + '</text>'
  );
}

async function buildExportSvgString() {
  const nodes = currentTreeNodes, links = currentTreeLinks;
  if (!nodes.length) return null;

  const photoMap = {};
  await Promise.all(nodes.filter((d) => d.data.photo_path).map(async (d) => {
    try { photoMap[d.data.id] = await imageUrlToDataURL(d.data.photo_path); }
    catch (e) { /* falls back to initials if a photo can't be fetched */ }
  }));

  const PAD = 60, TITLE_H = 74;
  const xs = nodes.map((d) => d.x), ys = nodes.map((d) => d.y);
  const minX = Math.min(...xs) - NODE_W / 2, maxX = Math.max(...xs) + NODE_W / 2;
  const minY = Math.min(...ys), maxY = Math.max(...ys) + NODE_H;
  const width = (maxX - minX) + PAD * 2;
  const height = (maxY - minY) + PAD * 2 + TITLE_H;
  const offsetX = PAD - minX, offsetY = PAD + TITLE_H - minY;

  const linkGen = d3.linkVertical().x((d) => d.x + offsetX).y((d) => d.y + offsetY);
  const linksSvg = links.map((l) =>
    '<path d="' + linkGen(l) + '" fill="none" stroke="#7C8F68" stroke-width="2" opacity="0.55"/>'
  ).join('');

  const nodesSvg = nodes.map((d) => {
    const x = d.x - NODE_W / 2 + offsetX, y = d.y - 8 + offsetY;
    return '<g>' + personNodeSVG(d, photoMap, x, y) + '</g>';
  }).join('');

  const generatedDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const svgString =
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">' +
      '<rect x="0" y="0" width="' + width + '" height="' + height + '" fill="#F7F1E6"/>' +
      '<text x="' + (width / 2) + '" y="34" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" font-size="22" font-weight="600" fill="#3A2E22">Family Tree</text>' +
      '<text x="' + (width / 2) + '" y="55" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#9A8A72">Generated ' + generatedDate + '</text>' +
      linksSvg + nodesSvg +
    '</svg>';

  return { svgString, width, height };
}

function svgStringToCanvas(svgString, width, height, scale) {
  scale = scale || 2;
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(width * scale);
      canvas.height = Math.ceil(height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#F7F1E6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      try {
        ctx.drawImage(img, 0, 0, width, height);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(new Error('Your browser blocked rendering the tree image (canvas security restriction)'));
        return;
      }
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not render the tree image'));
    };
    img.src = url;
  });
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function exportAsJPG() {
  try {
    const built = await buildExportSvgString();
    if (!built) { toast('Add at least one person before exporting', 'danger'); return; }
    toast('Preparing image…');
    const canvas = await svgStringToCanvas(built.svgString, built.width, built.height, 2);
    downloadDataUrl(canvas.toDataURL('image/jpeg', 0.93), 'family-tree.jpg');
    toast('Downloaded family-tree.jpg', 'success');
  } catch (err) {
    toast(err.message || 'Export failed', 'danger');
  }
}

async function exportAsPDF() {
  try {
    const built = await buildExportSvgString();
    if (!built) { toast('Add at least one person before exporting', 'danger'); return; }
    toast('Preparing PDF…');
    const canvas = await svgStringToCanvas(built.svgString, built.width, built.height, 2);
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const { jsPDF } = window.jspdf;
    const orientation = built.width >= built.height ? 'landscape' : 'portrait';
    const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth(), pageH = pdf.internal.pageSize.getHeight();
    const margin = 24;
    const ratio = Math.min((pageW - margin * 2) / built.width, (pageH - margin * 2) / built.height);
    const drawW = built.width * ratio, drawH = built.height * ratio;
    pdf.addImage(imgData, 'JPEG', (pageW - drawW) / 2, (pageH - drawH) / 2, drawW, drawH);
    pdf.save('family-tree.pdf');
    toast('Downloaded family-tree.pdf', 'success');
  } catch (err) {
    toast(err.message || 'Export failed', 'danger');
  }
}

/* ══════════════════════════════════════════════════════════
   BACKUP: save tree to a file / import it on another device
═══════════════════════════════════════════════════════════ */
async function exportDataJSON() {
  if (!state.people.length) { toast('Add at least one person before saving a backup', 'danger'); return; }
  try {
    toast('Preparing backup file…');
    const res = await fetch('/api/people/export', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('Could not create the backup file');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, 'family-tree-backup.json');
    URL.revokeObjectURL(url);
    toast('Downloaded family-tree-backup.json', 'success');
  } catch (err) {
    toast(err.message, 'danger');
  }
}

function triggerImportFile() {
  if (state.user.role !== 'admin') {
    toast('Only an administrator can import a backup', 'danger');
    return;
  }
  $('importFileInput').click();
}

$('importFileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;

  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch (err) {
    toast('That file is not valid JSON', 'danger');
    return;
  }

  const ok = await confirmDialog(
    'Replace your current tree?',
    'Importing this backup will permanently replace everyone currently in your tree with the people in this file. This cannot be undone.',
    'Import & Replace'
  );
  if (!ok) return;

  try {
    await apiJSON('/people/import', 'POST', parsed);
    toast('Tree imported successfully', 'success');
    closePersonPanel();
    await fetchPeople();
  } catch (err) {
    toast(err.message, 'danger');
  }
});

/* ══════════════════════════════════════════════════════════
   EXPORT MENU (dropdown)
═══════════════════════════════════════════════════════════ */
$('exportBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  $('exportMenu').classList.toggle('hidden');
});
$('exportMenu').addEventListener('click', (e) => e.stopPropagation());
document.addEventListener('click', () => $('exportMenu').classList.add('hidden'));

$('exportPdfBtn').addEventListener('click', () => { $('exportMenu').classList.add('hidden'); exportAsPDF(); });
$('exportJpgBtn').addEventListener('click', () => { $('exportMenu').classList.add('hidden'); exportAsJPG(); });
$('exportJsonBtn').addEventListener('click', () => { $('exportMenu').classList.add('hidden'); exportDataJSON(); });
$('importJsonBtn').addEventListener('click', () => { $('exportMenu').classList.add('hidden'); triggerImportFile(); });

/* ══════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════ */
checkSession();
