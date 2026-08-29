const demoUsers = [
  { name: 'Alex Morgan', email: 'alex@taskflow.app', password: 'password', role: 'Admin' },
  { name: 'Mia Chen', email: 'mia@taskflow.app', password: 'password', role: 'Member' },
  { name: 'Jordan Lee', email: 'jordan@taskflow.app', password: 'password', role: 'Manager' }
];

const starterTasks = [
  { id: 'TSK-1048', title: 'Finalize Q3 campaign brief', assignee: 'Alex Morgan', due: '2024-08-14', priority: 'High', status: 'In progress' },
  { id: 'TSK-1047', title: 'Review mobile onboarding flow', assignee: 'Mia Chen', due: '2024-08-15', priority: 'Medium', status: 'To do' },
  { id: 'TSK-1046', title: 'Prepare customer interview notes', assignee: 'Jordan Lee', due: '2024-08-16', priority: 'Low', status: 'Completed' },
  { id: 'TSK-1045', title: 'Update analytics dashboard', assignee: 'Alex Morgan', due: '2024-08-19', priority: 'Medium', status: 'To do' },
  { id: 'TSK-1044', title: 'Send partner launch assets', assignee: 'Mia Chen', due: '2024-08-20', priority: 'High', status: 'In progress' },
  { id: 'TSK-1043', title: 'Document design system tokens', assignee: 'Jordan Lee', due: '2024-08-22', priority: 'Low', status: 'Completed' }
];

let currentUser = JSON.parse(localStorage.getItem('taskflowCurrentUser'));
let tasks = JSON.parse(localStorage.getItem('taskflowTasks')) || starterTasks;
let activeFilter = 'all';
const taskModal = new bootstrap.Modal(document.getElementById('taskModal'));
const $ = (selector) => document.querySelector(selector);

function saveState() {
  localStorage.setItem('taskflowTasks', JSON.stringify(tasks));
  if (currentUser) localStorage.setItem('taskflowCurrentUser', JSON.stringify(currentUser));
}

function initials(name) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function showAuth(isRegister = false) {
  $('#authView').classList.remove('d-none');
  $('#appView').classList.add('d-none');
  $('#loginFormView').classList.toggle('d-none', isRegister);
  $('#registerFormView').classList.toggle('d-none', !isRegister);
}

function showApp() {
  $('#authView').classList.add('d-none');
  $('#appView').classList.remove('d-none');
  $('#navName').textContent = currentUser.name;
  $('#navRole').textContent = currentUser.role;
  $('#navAvatar').textContent = initials(currentUser.name);
  $('#greetingName').textContent = currentUser.name.split(' ')[0];
  const notice = $('#roleNotice');
  notice.classList.toggle('d-none', currentUser.role === 'Admin');
  if (currentUser.role !== 'Admin') notice.querySelector('span').textContent = `${currentUser.role} view: you can manage tasks assigned to you.`;
  $('#newTaskButton').classList.toggle('d-none', currentUser.role === 'Member');
  populateAssignees();
  renderTasks();
}

function populateAssignees() {
  const people = [...new Map(demoUsers.concat(currentUser).map((user) => [user.email, user])).values()];
  $('#taskAssignee').innerHTML = people.map((person) => `<option value="${person.name}">${person.name}</option>`).join('');
}

function visibleTasks() {
  const search = $('#searchInput').value.toLowerCase().trim();
  const priority = $('#priorityFilter').value;
  return tasks.filter((task) => {
    const permitted = currentUser.role === 'Admin' || task.assignee === currentUser.name;
    const filterMatch = activeFilter === 'all' || (activeFilter === 'active' && permitted && task.status !== 'Completed') || (activeFilter === 'completed' && task.status === 'Completed');
    return permitted && filterMatch && (priority === 'all' || task.priority === priority) && (!search || `${task.title} ${task.assignee}`.toLowerCase().includes(search));
  });
}

function renderTasks() {
  const allVisible = tasks.filter((task) => currentUser.role === 'Admin' || task.assignee === currentUser.name);
  const completed = allVisible.filter((task) => task.status === 'Completed').length;
  $('#totalCount').textContent = allVisible.length;
  $('#progressCount').textContent = allVisible.filter((task) => task.status === 'In progress').length;
  $('#completedCount').textContent = completed;
  $('#dueCount').textContent = allVisible.filter((task) => task.status !== 'Completed').length;
  $('#allTabCount').textContent = allVisible.length;
  const rows = visibleTasks();
  $('#taskTableBody').innerHTML = rows.map((task) => `<tr>
    <td><span class="task-title">${task.title}</span><span class="task-id">${task.id}</span></td>
    <td><span class="task-avatar">${initials(task.assignee)}</span>${task.assignee.split(' ')[0]}</td>
    <td>${formatDate(task.due)}</td>
    <td><span class="priority ${task.priority}">${task.priority}</span></td>
    <td><span class="status ${task.status.replace(' ', '-')}">${task.status}</span></td>
    <td class="text-end task-actions"><button class="btn btn-sm edit-task" data-id="${task.id}" title="Edit task"><i class="bi bi-pencil"></i></button><button class="btn btn-sm delete-task" data-id="${task.id}" title="Delete task"><i class="bi bi-trash3"></i></button></td>
  </tr>`).join('');
  $('#emptyState').classList.toggle('d-none', rows.length > 0);
}

function formatDate(value) { return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function showToast(message) { $('#toastMessage').textContent = message; bootstrap.Toast.getOrCreateInstance($('#appToast')).show(); }
function resetTaskForm() { $('#taskForm').reset(); $('#taskId').value = ''; $('#taskModalTitle').textContent = 'Create a new task'; $('#taskDue').value = '2024-08-23'; $('#taskAssignee').value = currentUser.name; }
function openEditTask(task) { $('#taskId').value = task.id; $('#taskTitle').value = task.title; $('#taskAssignee').value = task.assignee; $('#taskDue').value = task.due; $('#taskPriority').value = task.priority; $('#taskStatus').value = task.status; $('#taskModalTitle').textContent = 'Edit task'; taskModal.show(); }

$('#loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const email = $('#loginEmail').value.trim().toLowerCase();
  const password = $('#loginPassword').value;
  const user = demoUsers.find((candidate) => candidate.email === email && candidate.password === password);
  if (!user) { $('#loginError').textContent = 'That email or password did not match a demo account.'; $('#loginError').classList.remove('d-none'); return; }
  currentUser = user; saveState(); showApp();
});

$('#registerForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const user = { name: $('#registerName').value.trim(), email: $('#registerEmail').value.trim().toLowerCase(), password: $('#registerPassword').value, role: $('#registerRole').value };
  if (demoUsers.some((candidate) => candidate.email === user.email)) { $('#registerError').textContent = 'An account with that email already exists.'; $('#registerError').classList.remove('d-none'); return; }
  demoUsers.push(user); currentUser = user; saveState(); showApp(); showToast('Welcome to taskflow.');
});

$('#showRegister').addEventListener('click', () => showAuth(true));
$('#showLogin').addEventListener('click', () => showAuth(false));
$('#logoutButton').addEventListener('click', () => { currentUser = null; localStorage.removeItem('taskflowCurrentUser'); showAuth(); });
$('#newTaskButton').addEventListener('click', () => { resetTaskForm(); taskModal.show(); });
$('#searchInput').addEventListener('input', renderTasks);
$('#priorityFilter').addEventListener('change', renderTasks);

document.querySelectorAll('.view-tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.view-tab').forEach((item) => item.classList.remove('active'));
  tab.classList.add('active'); activeFilter = tab.dataset.filter; renderTasks();
}));

$('#taskTableBody').addEventListener('click', (event) => {
  const editButton = event.target.closest('.edit-task');
  const deleteButton = event.target.closest('.delete-task');
  if (editButton) openEditTask(tasks.find((task) => task.id === editButton.dataset.id));
  if (deleteButton && (currentUser.role === 'Admin' || tasks.find((task) => task.id === deleteButton.dataset.id)?.assignee === currentUser.name)) {
    tasks = tasks.filter((task) => task.id !== deleteButton.dataset.id); saveState(); renderTasks(); showToast('Task deleted.');
  }
});

$('#taskForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const id = $('#taskId').value;
  const taskData = { title: $('#taskTitle').value.trim(), assignee: $('#taskAssignee').value, due: $('#taskDue').value, priority: $('#taskPriority').value, status: $('#taskStatus').value };
  if (id) tasks = tasks.map((task) => task.id === id ? { ...task, ...taskData } : task);
  else tasks.unshift({ ...taskData, id: `TSK-${1050 + tasks.length}` });
  saveState(); taskModal.hide(); renderTasks(); showToast(id ? 'Task updated.' : 'Task created.');
});

if (currentUser) showApp(); else showAuth();
