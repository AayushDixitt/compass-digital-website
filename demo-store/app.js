/* Awadh Chikan Co. — Cart Logic */
/* Uses localStorage. Demo only — no real payment. */

const CART_KEY = 'awadh_chikan_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getCartCount() {
  const cart = getCart();
  return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal() {
  const cart = getCart();
  return Object.values(cart).reduce((sum, item) => sum + (item.qty * item.price), 0);
}

function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-count');
  const count = getCartCount();
  badges.forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });
}

function addToCart(id, name, price, qty = 1) {
  const cart = getCart();
  if (cart[id]) {
    cart[id].qty += qty;
  } else {
    cart[id] = { id, name, price, qty };
  }
  saveCart(cart);
  updateCartBadge();
  return cart[id].qty;
}

function updateQty(id, qty) {
  const cart = getCart();
  if (qty <= 0) {
    delete cart[id];
  } else if (cart[id]) {
    cart[id].qty = qty;
  }
  saveCart(cart);
  updateCartBadge();
}

function removeFromCart(id) {
  const cart = getCart();
  delete cart[id];
  saveCart(cart);
  updateCartBadge();
}

function formatINR(n) {
  return '₹' + n.toLocaleString('en-IN');
}

// Build WhatsApp order message from cart
function buildWhatsAppMessage() {
  const cart = getCart();
  const items = Object.values(cart);
  if (items.length === 0) return '';

  let msg = 'Hello Aayush, I tried your demo store. I want something like this for my own products, what would it cost?\n\nMy order:\n';
  items.forEach(item => {
    msg += `- ${item.name} x ${item.qty} = ${formatINR(item.price * item.qty)}\n`;
  });
  msg += `\nTotal: ${formatINR(getCartTotal())}\n\n(This is a demo order, no real payment)`;
  return msg;
}

function getWhatsAppOrderURL() {
  const msg = buildWhatsAppMessage();
  return 'https://wa.me/919696442435?text=' + encodeURIComponent(msg);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  updateCartBadge();
});
