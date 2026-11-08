import * as THREE from 'three';
import { createClient } from '@supabase/supabase-js';

// Public browser credentials. Never put a Supabase service_role/secret key here.
const SUPABASE_URL = 'https://bekmfbkuagqseophchcr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_qsvvR5O-HUCZqVkfXs1dig_F9hqE_fh';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
const authPanel = $('auth-panel');
const authForm = $('auth-form');
const authMessage = $('auth-message');
const gameHud = $('game-hud');
const chatPanel = $('chat-panel');
const chatMessages = $('chat-messages');
const chatStatus = $('chat-status');
const chatForm = $('chat-form');
const chatInput = $('chat-input');
const logoutButton = $('logout-btn');

let currentUser = null;
let currentChannel = null;
let playerName = 'Player';

// ----- Three.js city scene -----
const sceneHost = $('scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101c25);
scene.fog = new THREE.Fog(0x101c25, 28, 105);

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 180);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneHost.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xb9d7e8, 0x26313a, 2));
const sun = new THREE.DirectionalLight(0xffe4bd, 2.2);
sun.position.set(-15, 25, 12);
sun.castShadow = true;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(180, 180),
  new THREE.MeshStandardMaterial({ color: 0x29363d, roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 180),
  new THREE.MeshStandardMaterial({ color: 0x151d23, roughness: 1 })
);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.015;
scene.add(road);

const laneMaterial = new THREE.MeshBasicMaterial({ color: 0xb5b7a7 });
for (let z = -82; z < 90; z += 9) {
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 4), laneMaterial);
  mark.position.set(0, 0.04, z);
  scene.add(mark);
}

const buildingColors = [0x34434d, 0x40505a, 0x263a43, 0x4b5559, 0x303943];
for (let i = 0; i < 34; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  const z = -75 + Math.floor(i / 2) * 9;
  const width = 4 + Math.random() * 5;
  const height = 7 + Math.random() * 22;
  const depth = 5 + Math.random() * 5;
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: buildingColors[i % buildingColors.length], roughness: 0.88 })
  );
  building.position.set(side * (10 + width / 2), height / 2, z);
  building.castShadow = true;
  building.receiveShadow = true;
  scene.add(building);
  const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x9ab9b8 });
  for (let y = 2.2; y < height - 1; y += 3.2) {
    for (let x = -width / 2 + 0.9; x < width / 2 - 0.4; x += 1.7) {
      const windowMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.05), windowMaterial);
      windowMesh.position.set(building.position.x + x, y, z + depth / 2 + 0.012);
      scene.add(windowMesh);
    }
  }
}

const player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.42, 0.9, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0x59d5b1, roughness: 0.72 })
);
body.position.y = 1.05;
body.castShadow = true;
player.add(body);
const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.28, 12, 10),
  new THREE.MeshStandardMaterial({ color: 0xd2a98d, roughness: 0.8 })
);
head.position.y = 1.85;
head.castShadow = true;
player.add(head);
player.position.set(0, 0, 2);
scene.add(player);

const keys = new Set();
const touchDirections = new Set();
let verticalVelocity = 0;
let grounded = true;
addEventListener('keydown', (event) => {
  if (['KeyW','KeyA','KeyS','KeyD','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)) event.preventDefault();
  keys.add(event.code);
});
addEventListener('keyup', (event) => keys.delete(event.code));
document.querySelectorAll('[data-move]').forEach((button) => {
  const direction = button.dataset.move;
  const start = (event) => { event.preventDefault(); touchDirections.add(direction); };
  const stop = (event) => { event.preventDefault(); touchDirections.delete(direction); };
  button.addEventListener('pointerdown', start);
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointerleave', stop);
  button.addEventListener('pointercancel', stop);
});

function animate() {
  requestAnimationFrame(animate);
  const forward = keys.has('KeyW') || keys.has('ArrowUp') || touchDirections.has('forward');
  const back = keys.has('KeyS') || keys.has('ArrowDown') || touchDirections.has('back');
  const left = keys.has('KeyA') || keys.has('ArrowLeft') || touchDirections.has('left');
  const right = keys.has('KeyD') || keys.has('ArrowRight') || touchDirections.has('right');
  const movement = new THREE.Vector3((right ? 1 : 0) - (left ? 1 : 0), 0, (back ? 1 : 0) - (forward ? 1 : 0));
  if (movement.lengthSq() > 0) {
    movement.normalize();
    player.position.addScaledVector(movement, 0.105);
    player.rotation.y = Math.atan2(movement.x, movement.z);
  }
  if (keys.has('Space') && grounded) { verticalVelocity = 0.19; grounded = false; }
  verticalVelocity -= 0.009;
  player.position.y += verticalVelocity;
  if (player.position.y <= 0) { player.position.y = 0; verticalVelocity = 0; grounded = true; }

  const desiredCamera = new THREE.Vector3(player.position.x, player.position.y + 4.2, player.position.z + 8.5);
  camera.position.lerp(desiredCamera, 0.09);
  camera.lookAt(player.position.x, player.position.y + 1.1, player.position.z);
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setSize(innerWidth, innerHeight);
});

// ----- Authentication -----
function showSignedIn(user) {
  currentUser = user;
  playerName = (user.user_metadata?.nickname || user.email?.split('@')[0] || 'Player').trim().slice(0, 24);
  $('player-name').textContent = playerName;
  authPanel.classList.add('hidden');
  gameHud.classList.remove('hidden');
  chatPanel.classList.remove('hidden');
  logoutButton.classList.remove('hidden');
  loadChat();
  subscribeToChat();
}

function showSignedOut() {
  currentUser = null;
  authPanel.classList.remove('hidden');
  gameHud.classList.add('hidden');
  chatPanel.classList.add('hidden');
  logoutButton.classList.add('hidden');
  if (currentChannel) {
    supabase.removeChannel(currentChannel);
    currentChannel = null;
  }
}

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = $('email').value.trim();
  const password = $('password').value;
  const button = $('login-btn');
  button.disabled = true;
  authMessage.textContent = 'Sedang masuk...';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  authMessage.textContent = error ? error.message : 'Berhasil masuk.';
  button.disabled = false;
});

$('signup-btn').addEventListener('click', async () => {
  const email = $('email').value.trim();
  const password = $('password').value;
  const nickname = $('nickname').value.trim().slice(0, 24);
  if (!email || password.length < 6 || nickname.length < 1) {
    authMessage.textContent = 'Isi nama karakter, email, dan password minimal 6 karakter.';
    return;
  }
  const button = $('signup-btn');
  button.disabled = true;
  authMessage.textContent = 'Membuat akun...';
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nickname } }
  });
  if (error) authMessage.textContent = error.message;
  else if (data.session) authMessage.textContent = 'Akun dibuat. Selamat datang!';
  else authMessage.textContent = 'Akun dibuat. Periksa email untuk konfirmasi, lalu masuk.';
  button.disabled = false;
});

logoutButton.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) showSignedIn(session.user);
  else showSignedOut();
});

const { data: sessionData } = await supabase.auth.getSession();
if (sessionData.session?.user) showSignedIn(sessionData.session.user);

// ----- Global chat (Postgres + Realtime) -----
function addChatMessage(row) {
  const empty = chatMessages.querySelector('.chat-empty');
  if (empty) empty.remove();
  if (chatMessages.querySelector('[data-message-id="' + CSS.escape(row.id) + '"]')) return;

  const item = document.createElement('article');
  item.className = 'message';
  item.dataset.messageId = row.id;

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  const name = document.createElement('span');
  name.className = 'message-name';
  name.textContent = row.username || 'Player';
  const time = document.createElement('span');
  time.className = 'message-time';
  time.textContent = new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const body = document.createElement('div');
  body.className = 'message-body';
  body.textContent = row.message;

  meta.append(name, time);
  item.append(meta, body);
  chatMessages.appendChild(item);
  while (chatMessages.children.length > 80) chatMessages.firstElementChild.remove();
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function loadChat() {
  if (!currentUser) return;
  chatMessages.replaceChildren();
  const { data, error } = await supabase
    .from('global_chat')
    .select('id, username, message, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    chatStatus.textContent = 'Chat belum bisa dimuat: ' + error.message;
    return;
  }
  (data || []).reverse().forEach(addChatMessage);
  if (!data?.length) {
    const empty = document.createElement('p');
    empty.className = 'chat-empty';
    empty.textContent = 'Belum ada pesan. Sapa pemain lain!';
    chatMessages.appendChild(empty);
  }
}

function subscribeToChat() {
  if (!currentUser) return;
  if (currentChannel) supabase.removeChannel(currentChannel);
  currentChannel = supabase
    .channel('hz-global-chat')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_chat' }, (payload) => {
      addChatMessage(payload.new);
    })
    .subscribe((status) => {
      $('chat-count').textContent = status === 'SUBSCRIBED' ? 'LIVE' : 'CONNECTING';
    });
}

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentUser) return;
  const message = chatInput.value.trim();
  if (!message) return;
  chatInput.disabled = true;
  chatStatus.textContent = 'Mengirim...';
  const { error } = await supabase.from('global_chat').insert({
    user_id: currentUser.id,
    username: playerName,
    message
  });
  if (error) chatStatus.textContent = 'Gagal mengirim: ' + error.message;
  else {
    chatInput.value = '';
    chatStatus.textContent = '';
  }
  chatInput.disabled = false;
  chatInput.focus();
});
