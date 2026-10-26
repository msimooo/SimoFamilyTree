'use strict';

/* ══════════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════════ */
const state = {
  user: null,
  people: [],
  users: [],
};

const arabicTranslations = {
  'Sign in to view and manage your family tree': 'سجّل الدخول لعرض شجرة عائلتك وإدارتها',
  'Username': 'اسم المستخدم',
  'Password': 'كلمة المرور',
  'Sign In': 'تسجيل الدخول',
  'First time here? Default administrator login:': 'أول مرة هنا؟ بيانات دخول المسؤول الافتراضية:',
  'please change this after signing in.': 'يرجى تغييرها بعد تسجيل الدخول.',
  'Export ▾': 'تصدير ▾',
  'Share & print': 'المشاركة والطباعة',
  '📄 Export as PDF': '📄 تصدير بصيغة PDF',
  '🖼️ Export as JPG': '🖼️ تصدير بصيغة JPG',
  'Backup & transfer': 'النسخ الاحتياطي والنقل',
  '💾 Save Tree to File': '💾 حفظ الشجرة في ملف',
  '📥 Import Tree from File': '📥 استيراد شجرة من ملف',
  'Manage Users': 'إدارة المستخدمين',
  'Zoom in': 'تكبير',
  'Zoom out': 'تصغير',
  'Reset view': 'إعادة ضبط العرض',
  'Add Ancestor': 'إضافة أحد الأجداد',
  'Your tree is empty': 'شجرتك فارغة',
  'Every family tree starts with its first ancestor. Add one to begin — you can branch out sons, daughters, and further generations from there.': 'تبدأ كل شجرة عائلة بأحد الأجداد. أضف أول شخص للبدء، ثم أضف الأبناء والأجيال التالية.',
  'Add First Ancestor': 'إضافة أول الأجداد',
  'Person': 'الشخص',
  'Add Person': 'إضافة شخص',
  'Change Photo': 'تغيير الصورة',
  'Remove Photo': 'إزالة الصورة',
  'First Name': 'الاسم الأول',
  'Gender': 'الجنس',
  'Male': 'ذكر',
  'Female': 'أنثى',
  'Add a relative': 'إضافة قريب',
  'Add Son': 'إضافة ابن',
  'Add Daughter': 'إضافة ابنة',
  'Add Father': 'إضافة الأب',
  'Add Father (extend upward)': 'إضافة الأب (للتوسع للأعلى)',
  'Delete': 'حذف',
  'Save Changes': 'حفظ التغييرات',
  'Fill in their details below.': 'أدخل تفاصيله أدناه.',
  'e.g. Elena': 'مثال: ليلى',
  'Photo (optional)': 'الصورة (اختياري)',
  'Click to upload a photo': 'انقر لرفع صورة',
  'PNG, JPG, or WEBP — up to 5MB': 'PNG أو JPG أو WEBP — حتى 5 ميغابايت',
  'Cancel': 'إلغاء',
  'Save': 'حفظ',
  'Team': 'الفريق',
  'Name': 'الاسم',
  'Role': 'الدور',
  'Add a user': 'إضافة مستخدم',
  'Display Name': 'الاسم المعروض',
  'e.g. Maria Gomez': 'مثال: سارة أحمد',
  'e.g. mgomez': 'مثال: sahmed',
  'At least 6 characters': '6 أحرف على الأقل',
  'Assistant': 'مساعد',
  'Administrator': 'مسؤول',
  'Create User': 'إنشاء مستخدم',
  'Your Account': 'حسابك',
  'Change password': 'تغيير كلمة المرور',
  'Current Password': 'كلمة المرور الحالية',
  'New Password': 'كلمة المرور الجديدة',
  'Update Password': 'تحديث كلمة المرور',
  'Log Out': 'تسجيل الخروج',
  'Are you sure?': 'هل أنت متأكد؟',
  'Confirm': 'تأكيد',
  'Request failed': 'تعذر إكمال الطلب',
  'Invalid username or password': 'اسم المستخدم أو كلمة المرور غير صحيحين',
  'Username and password are required': 'اسم المستخدم وكلمة المرور مطلوبان',
  'Current and new password are required': 'كلمتا المرور الحالية والجديدة مطلوبتان',
  'New password must be at least 6 characters': 'يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف',
  'Current password is incorrect': 'كلمة المرور الحالية غير صحيحة',
  'Username, password, and display name are required': 'اسم المستخدم وكلمة المرور والاسم المعروض مطلوبة',
  'Password must be at least 6 characters': 'يجب ألا تقل كلمة المرور عن 6 أحرف',
  "Role must be 'admin' or 'assistant'": 'يجب أن يكون الدور مسؤولًا أو مساعدًا',
  'That username is already taken': 'اسم المستخدم مستخدم بالفعل',
  'User not found': 'لم يتم العثور على المستخدم',
  'Cannot demote the last remaining administrator': 'لا يمكن تخفيض صلاحية آخر مسؤول متبقٍ',
  "You can't delete your own account while logged in": 'لا يمكنك حذف حسابك أثناء تسجيل الدخول',
  'Cannot delete the last remaining administrator': 'لا يمكن حذف آخر مسؤول متبقٍ',
  'This file is not a valid Rootline backup': 'هذا الملف ليس نسخة احتياطية صالحة من Rootline',
  'Backup file contains invalid person records': 'تحتوي النسخة الاحتياطية على بيانات أشخاص غير صالحة',
  'First name is required': 'الاسم الأول مطلوب',
  'Gender must be male or female': 'يجب تحديد الجنس ذكرًا أو أنثى',
  'Lineage must be root, father, son, or daughter': 'يجب أن تكون صلة القرابة أصلًا أو أبًا أو ابنًا أو ابنة',
  'Relative not found': 'لم يتم العثور على القريب',
  'This person already has a father recorded in the tree': 'تم تسجيل أب لهذا الشخص بالفعل في الشجرة',
  'Person not found': 'لم يتم العثور على الشخص',
  'Fill in both password fields': 'يرجى إدخال كلمتي المرور',
  'Password updated': 'تم تحديث كلمة المرور',
  'Saved': 'تم الحفظ',
  'Photo updated': 'تم تحديث الصورة',
  'Photo removed': 'تمت إزالة الصورة',
  'Person deleted': 'تم حذف الشخص',
  'Branch deleted': 'تم حذف الفرع',
  'Role updated': 'تم تحديث الدور',
  'User removed': 'تمت إزالة المستخدم',
  'Fill in all fields': 'يرجى ملء جميع الحقول',
  'User created': 'تم إنشاء المستخدم',
  'Add at least one person before exporting': 'أضف شخصًا واحدًا على الأقل قبل التصدير',
  'Preparing image…': 'جارٍ تجهيز الصورة…',
  'Downloaded family-tree.jpg': 'تم تنزيل family-tree.jpg',
  'Export failed': 'فشل التصدير',
  'Preparing PDF…': 'جارٍ تجهيز ملف PDF…',
  'Downloaded family-tree.pdf': 'تم تنزيل family-tree.pdf',
  'Add at least one person before saving a backup': 'أضف شخصًا واحدًا على الأقل قبل حفظ نسخة احتياطية',
  'Preparing backup file…': 'جارٍ تجهيز ملف النسخة الاحتياطية…',
  'Downloaded family-tree-backup.json': 'تم تنزيل family-tree-backup.json',
  'Could not create the backup file': 'تعذر إنشاء ملف النسخة الاحتياطية',
  'photo fetch failed': 'تعذر تحميل الصورة',
  'Your browser blocked rendering the tree image (canvas security restriction)': 'منع المتصفح إنشاء صورة الشجرة بسبب قيود الأمان',
  'Could not render the tree image': 'تعذر إنشاء صورة الشجرة',
  'Only an administrator can import a backup': 'يمكن للمسؤول فقط استيراد نسخة احتياطية',
  'That file is not valid JSON': 'الملف ليس بتنسيق JSON صالح',
  'Tree imported successfully': 'تم استيراد الشجرة بنجاح',
  'This cannot be undone.': 'لا يمكن التراجع عن هذا الإجراء.',
  'Delete Branch': 'حذف الفرع',
  'Delete entire branch?': 'هل تريد حذف الفرع بالكامل؟',
  ' Deleting the branch will permanently remove all of them.': ' سيؤدي حذف الفرع إلى إزالة جميع أفراده نهائيًا.',
  'Replace your current tree?': 'هل تريد استبدال شجرتك الحالية؟',
  'Remove this user?': 'هل تريد إزالة هذا المستخدم؟',
  'They will lose access immediately.': 'سيفقد المستخدم إمكانية الوصول فورًا.',
  'Remove': 'إزالة',
  'Importing this backup will permanently replace everyone currently in your tree with the people in this file. This cannot be undone.': 'سيؤدي استيراد هذه النسخة الاحتياطية إلى استبدال جميع الأشخاص في شجرتك نهائيًا بالأشخاص الموجودين في هذا الملف. لا يمكن التراجع عن ذلك.',
  'Import & Replace': 'استيراد واستبدال',
  'Add a First Ancestor': 'إضافة أول الأجداد',
  'They will become the root of a new family line.': 'سيصبح هذا الشخص أصل فرع عائلي جديد.',
  'This will extend the tree upward from the selected person.': 'سيضيف هذا الشخص جيلًا أعلى من الشخص المحدد.',
  'This will add a new child under the selected person.': 'سيضيف هذا طفلًا جديدًا للشخص المحدد.',
  'Father:': 'الأب:',
  'No father recorded — this person is a first ancestor.': 'لم يتم تسجيل الأب — هذا الشخص هو أحد الأجداد.',
  'Children:': 'الأبناء:',
  'No children recorded yet.': 'لم يتم تسجيل أبناء بعد.',
  'This person already has a father recorded': 'تم تسجيل أب لهذا الشخص بالفعل',
  'you': 'أنت',
  'Make Assistant': 'تعيين كمساعد',
  'Make Admin': 'تعيين كمسؤول',
  'Family Tree': 'شجرة العائلة',
  'Generated': 'تاريخ الإنشاء',
  'added to the tree': 'تمت إضافته إلى الشجرة',
};

let currentLanguage = localStorage.getItem('rootline-language') === 'ar' ? 'ar' : 'en';

function t(text) {
  return currentLanguage === 'ar' ? (arabicTranslations[text] || text) : text;
}

function applyLanguage() {
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
  document.title = currentLanguage === 'ar' ? 'Rootline — شجرة العائلة' : 'Rootline — Family Tree';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
  if (!$('loginError').classList.contains('hidden') && $('loginError').dataset.message) {
    $('loginError').textContent = translateMessage($('loginError').dataset.message);
  }
  const toggleLabel = currentLanguage === 'ar' ? 'English' : 'العربية';
  ['languageBtn', 'loginLanguageBtn'].forEach((id) => {
    if ($(id)) {
      $(id).textContent = toggleLabel;
      $(id).setAttribute('aria-label', currentLanguage === 'ar' ? 'تغيير اللغة' : 'Change language');
    }
  });
  if (state.user) {
    $('userChipRole').textContent = roleLabel(state.user.role);
    if ($('accountModal').classList.contains('open')) {
      $('accountSub').textContent = state.user.display_name + ' · ' + roleLabel(state.user.role);
    }
  }
  if (currentPersonId) {
    const person = findPerson(currentPersonId);
    updatePersonMetadata(person);
    if (person) $('personPanel').querySelector('h2').textContent = person.first_name;
  }
  if (relFormRelation) updateRelFormLabels();
  if (state.user && state.user.role === 'admin') renderUsersTable();
}

function roleLabel(role) {
  return t(role === 'admin' ? 'Administrator' : 'Assistant');
}

function localizedError(err) {
  return err && err.message ? translateMessage(err.message) : t('Request failed');
}

function translateMessage(message) {
  if (currentLanguage !== 'ar') return message;
  const descendantMessage = /^(.+) has (\d+) direct descendant\(s\)\. Delete them first, or confirm a cascade delete of the whole branch\.$/.exec(message);
  if (descendantMessage) {
    return descendantMessage[1] + ' لديه ' + descendantMessage[2] + ' من الأبناء المباشرين. احذفهم أولًا، أو أكّد حذف الفرع بالكامل.';
  }
  return t(message);
}

function toggleLanguage() {
  currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
  localStorage.setItem('rootline-language', currentLanguage);
  applyLanguage();
}

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
  $('userChipRole').textContent = roleLabel(state.user.role);
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
    $('loginError').dataset.message = err.message || 'Invalid username or password';
    $('loginError').textContent = localizedError(err);
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
  $('accountSub').textContent = state.user.display_name + ' · ' + roleLabel(state.user.role);
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
    toast(localizedError(err), 'danger');
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
    '<div class="person-name">' + escapeHtml(p.first_name) + '</div>'
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

  updatePersonMetadata(p);

  $('personPanel').querySelector('h2').textContent = p.first_name;
  showOverlay('personPanelOverlay', 'personPanel');
  $('personPanel').classList.add('open');
}
function updatePersonMetadata(p) {
  if (!p) return;
  const father = p.father_id ? findPerson(p.father_id) : null;
  $('detailFatherLine').innerHTML = father
    ? t('Father:') + ' <b>' + escapeHtml(father.first_name) + '</b>'
    : t('No father recorded — this person is a first ancestor.');
  const kids = childrenOf(p.id);
  $('detailChildrenLine').innerHTML = kids.length
    ? t('Children:') + ' <b>' + kids.map((k) => escapeHtml(k.first_name)).join(', ') + '</b>'
    : t('No children recorded yet.');

  $('addFatherBtn').disabled = !!p.father_id;
  $('addFatherBtn').title = p.father_id ? t('This person already has a father recorded') : '';
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
    toast(localizedError(err), 'danger');
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
    toast(localizedError(err), 'danger');
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
    toast(localizedError(err), 'danger');
  }
});

$('detailDeleteBtn').addEventListener('click', async () => {
  if (!currentPersonId) return;
  const p = findPerson(currentPersonId);
  const ok = await confirmDialog(t('Delete') + ' ' + p.first_name + '?', t('This cannot be undone.'), t('Delete'));
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
        translateMessage(err.data.message) + t(' Deleting the branch will permanently remove all of them.'),
        t('Delete Branch')
      );
      if (!cascade) return;
      try {
        await api('/people/' + currentPersonId + '?cascade=true', { method: 'DELETE' });
        toast('Branch deleted', 'success');
        closePersonPanel();
        await fetchPeople();
      } catch (err2) {
        toast(localizedError(err2), 'danger');
      }
    } else {
      toast(localizedError(err), 'danger');
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

  updateRelFormLabels();

  updateRelGenderPills();
  showOverlay('relFormOverlay', 'relFormModal');
  setTimeout(() => $('relFormName').focus(), 120);
}
function updateRelFormLabels() {
  const titles = {
    root: ['Add a First Ancestor', 'They will become the root of a new family line.'],
    father: ['Add Father', 'This will extend the tree upward from the selected person.'],
    son: ['Add Son', 'This will add a new child under the selected person.'],
    daughter: ['Add Daughter', 'This will add a new child under the selected person.'],
  };
  if (!relFormRelation) return;
  $('relFormTitle').textContent = t(titles[relFormRelation][0]);
  $('relFormSub').textContent = t(titles[relFormRelation][1]);
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
    toast(first_name + ' ' + t('added to the tree'), 'success');
    closeRelForm();
    await fetchPeople();
    if (relFormRelation !== 'root' && relFormRelativeId) {
      // keep the side panel in sync if it's open on the same relative
      if (currentPersonId === Number(relFormRelativeId)) openPersonPanel(relFormRelativeId);
    }
  } catch (err) {
    toast(localizedError(err), 'danger');
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
        '<td>' + escapeHtml(u.display_name) + (isSelf ? ' <span style="color:var(--ink-3);font-size:11px">(' + t('you') + ')</span>' : '') +
          '<div style="color:var(--ink-3);font-size:11px">@' + escapeHtml(u.username) + '</div></td>' +
        '<td><span class="role-badge ' + u.role + '">' + roleLabel(u.role) + '</span></td>' +
        '<td style="text-align:right;white-space:nowrap">' +
          '<button class="btn btn-ghost btn-sm" onclick="toggleUserRole(' + u.id + ',\'' + u.role + '\')">' +
            t(u.role === 'admin' ? 'Make Assistant' : 'Make Admin') +
          '</button> ' +
          (isSelf ? '' : '<button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteUser(' + u.id + ')">' + t('Delete') + '</button>') +
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
    toast(localizedError(err), 'danger');
  }
}
async function deleteUser(id) {
  const ok = await confirmDialog(t('Remove this user?'), t('They will lose access immediately.'), t('Remove'));
  if (!ok) return;
  try {
    await api('/users/' + id, { method: 'DELETE' });
    toast('User removed', 'success');
    await fetchUsers();
  } catch (err) {
    toast(localizedError(err), 'danger');
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
    toast(localizedError(err), 'danger');
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
      '<text x="' + cx + '" y="' + (cy + 8) + '" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="24" font-weight="600" fill="' + color + '">' +
        escapeHtml(initialsOf(p.first_name)) + '</text>';
  }

  const nameY = cy + r + 20;
  const tagY = nameY + 15;
  return (
    photoMarkup +
    '<text x="' + cx + '" y="' + nameY + '" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="13" font-weight="600" fill="#3A2E22">' +
      escapeHtml(truncateForExport(p.first_name, 16)) + '</text>' +
    '<text x="' + cx + '" y="' + tagY + '" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="9.5" font-weight="700" letter-spacing="0.6" fill="' + color + '">' +
      escapeHtml(t(p.gender === 'male' ? 'Male' : 'Female')) + '</text>'
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

  const generatedDate = new Date().toLocaleDateString(currentLanguage === 'ar' ? 'ar' : 'en', { year: 'numeric', month: 'long', day: 'numeric' });

  const svgString =
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" direction="' + (currentLanguage === 'ar' ? 'rtl' : 'ltr') + '">' +
      '<rect x="0" y="0" width="' + width + '" height="' + height + '" fill="#F7F1E6"/>' +
      '<text x="' + (width / 2) + '" y="34" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="22" font-weight="600" fill="#3A2E22">' + escapeHtml(t('Family Tree')) + '</text>' +
      '<text x="' + (width / 2) + '" y="55" text-anchor="middle" font-family="Tahoma, Arial, sans-serif" font-size="11" fill="#9A8A72">' + escapeHtml(t('Generated')) + ' ' + generatedDate + '</text>' +
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
    toast(err.message ? localizedError(err) : t('Export failed'), 'danger');
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
    toast(err.message ? localizedError(err) : t('Export failed'), 'danger');
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
    toast(localizedError(err), 'danger');
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
    t('Replace your current tree?'),
    t('Importing this backup will permanently replace everyone currently in your tree with the people in this file. This cannot be undone.'),
    t('Import & Replace')
  );
  if (!ok) return;

  try {
    await apiJSON('/people/import', 'POST', parsed);
    toast('Tree imported successfully', 'success');
    closePersonPanel();
    await fetchPeople();
  } catch (err) {
    toast(localizedError(err), 'danger');
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
$('languageBtn').addEventListener('click', toggleLanguage);
$('loginLanguageBtn').addEventListener('click', toggleLanguage);

/* ══════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════ */
applyLanguage();
checkSession();
