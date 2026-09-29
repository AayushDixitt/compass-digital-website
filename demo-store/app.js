/* ============================================================
   Awadh Chikan Co. — Store logic
   Cart (localStorage) + drawer + toast + WhatsApp ordering.
   Demo only — no real payment is taken anywhere.
   ============================================================ */

const CART_KEY = 'awadh_chikan_cart_v2';
const WA_NUMBER = '919696442435';

/* ---------- Cart core ---------- */

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
  catch (e) { return {}; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function cartKey(id, size) { return id + '__' + (size || 'OS'); }

function getCartCount() {
  return Object.values(getCart()).reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal() {
  return Object.values(getCart()).reduce((sum, item) => sum + item.qty * item.price, 0);
}

function updateCartBadge() {
  const count = getCartCount();
  document.querySelectorAll('.cart-count').forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });
}

/** Add item. size is a string like "M" or "One size". Returns new qty. */
function addToCart(id, name, price, image, size, qty) {
  qty = qty || 1;
  const cart = getCart();
  const key = cartKey(id, size);
  if (cart[key]) {
    cart[key].qty += qty;
  } else {
    cart[key] = { key, id, name, price, image, size: size || 'One size', qty };
  }
  saveCart(cart);
  updateCartBadge();
  renderDrawer();
  return cart[key].qty;
}

function updateQty(key, qty) {
  const cart = getCart();
  if (qty <= 0) delete cart[key];
  else if (cart[key]) cart[key].qty = qty;
  saveCart(cart);
  updateCartBadge();
  renderDrawer();
}

function removeFromCart(key) {
  const cart = getCart();
  delete cart[key];
  saveCart(cart);
  updateCartBadge();
  renderDrawer();
}

function clearCart() {
  saveCart({});
  updateCartBadge();
  renderDrawer();
}

function formatINR(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

/* ---------- WhatsApp ---------- */

function buildWhatsAppMessage(customer) {
  const items = Object.values(getCart());
  if (!items.length) return '';
  let msg = 'Hello Aayush, I tried your demo store (Awadh Chikan Co.). I want an online store like this for my own brand — what would it cost?\n';
  if (customer && customer.name) msg += '\nName: ' + customer.name;
  if (customer && customer.phone) msg += '\nPhone: ' + customer.phone;
  if (customer && customer.address) msg += '\nAddress: ' + customer.address;
  msg += '\n\nMy demo order:\n';
  items.forEach(item => {
    msg += '- ' + item.name + ' (' + item.size + ') x ' + item.qty + ' = ' + formatINR(item.price * item.qty) + '\n';
  });
  msg += '\nTotal: ' + formatINR(getCartTotal()) + '\n\n(This is a demo order — no real payment.)';
  return msg;
}

function getWhatsAppOrderURL(customer) {
  return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildWhatsAppMessage(customer));
}

/* ---------- Toast ---------- */

let toastTimer = null;
function showToast(html) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.innerHTML = html;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ---------- Cart drawer ---------- */

function ensureDrawer() {
  if (document.getElementById('cart-drawer')) return;
  const overlay = document.createElement('div');
  overlay.id = 'drawer-overlay';
  overlay.className = 'drawer-overlay';
  overlay.addEventListener('click', closeDrawer);

  const drawer = document.createElement('div');
  drawer.id = 'cart-drawer';
  drawer.className = 'drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-label', 'Shopping cart');
  drawer.innerHTML =
    '<div class="drawer-head"><h3>Your Cart</h3>' +
    '<button class="drawer-close" aria-label="Close cart" onclick="closeDrawer()">×</button></div>' +
    '<div class="drawer-items" id="drawer-items"></div>' +
    '<div class="drawer-foot" id="drawer-foot"></div>';

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
}

function openDrawer() {
  ensureDrawer();
  renderDrawer();
  document.getElementById('cart-drawer').classList.add('show');
  document.getElementById('drawer-overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  const d = document.getElementById('cart-drawer');
  const o = document.getElementById('drawer-overlay');
  if (d) d.classList.remove('show');
  if (o) o.classList.remove('show');
  document.body.style.overflow = '';
}

function renderDrawer() {
  const itemsEl = document.getElementById('drawer-items');
  const footEl = document.getElementById('drawer-foot');
  if (!itemsEl || !footEl) return;
  const items = Object.values(getCart());

  if (!items.length) {
    itemsEl.innerHTML = '<div class="drawer-empty">Your cart is empty.<br>Beautiful chikankari awaits.</div>';
    footEl.innerHTML = '<a href="shop.html" class="btn btn-block" onclick="closeDrawer()">Browse the Collection</a>';
    return;
  }

  itemsEl.innerHTML = items.map(item =>
    '<div class="drawer-item">' +
    '<img src="images/' + item.image + '" alt="' + escapeHtml(item.name) + '" loading="lazy">' +
    '<div class="di-info"><strong>' + escapeHtml(item.name) + '</strong>' +
    '<div class="di-meta">' + escapeHtml(item.size) + ' · ' + formatINR(item.price) + ' × ' + item.qty + '</div>' +
    '<div style="margin-top:6px;display:flex;gap:8px;align-items:center;">' +
    '<button class="fpill" style="padding:4px 12px" onclick="updateQty(\'' + item.key + '\',' + (item.qty - 1) + ');refreshCartPage()">−</button>' +
    '<span>' + item.qty + '</span>' +
    '<button class="fpill" style="padding:4px 12px" onclick="updateQty(\'' + item.key + '\',' + (item.qty + 1) + ');refreshCartPage()">+</button>' +
    '<button class="remove-btn" onclick="removeFromCart(\'' + item.key + '\');refreshCartPage()">Remove</button>' +
    '</div></div></div>'
  ).join('');

  footEl.innerHTML =
    '<div class="sum-row"><span>Subtotal</span><strong>' + formatINR(getCartTotal()) + '</strong></div>' +
    '<a href="cart.html" class="btn btn-block">View Cart & Checkout</a>' +
    '<a href="' + getWhatsAppOrderURL() + '" target="_blank" rel="noopener" class="btn btn-whatsapp btn-block">Order on WhatsApp</a>' +
    '<div style="font-size:12px;color:#7c7065;text-align:center;margin-top:8px;">Demo store — no real payment.</div>';
}

/** Called from drawer buttons when the full cart page is open behind it. */
function refreshCartPage() {
  if (typeof renderCartPage === 'function') renderCartPage();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ---------- Shared helpers for product pages ---------- */

/** Quick-add from cards (default size). */
function quickAdd(id, name, price, image, defaultSize) {
  addToCart(id, name, price, image, defaultSize || 'M', 1);
  showToast('Added to cart — <a href="cart.html">View cart</a>');
  openDrawer();
}

/* ---------- Init ---------- */

document.addEventListener('DOMContentLoaded', function () {
  updateCartBadge();
  ensureDrawer();

  // Accordions
  document.querySelectorAll('.accord-head').forEach(head => {
    head.addEventListener('click', () => head.parentElement.classList.toggle('open'));
  });

  // Escape closes drawer
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
});
