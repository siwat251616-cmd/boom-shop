const STORAGE_KEY = 'perfume_shop_orders_db';
let allProducts = [];

async function fetchProducts() {
  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูลน้ำหอมได้');
    allProducts = await response.json();
    return allProducts;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

async function initProductPage() {
  const productListEl = document.getElementById('product-list');
  if (!productListEl) return;

  const products = await fetchProducts();
  renderProducts(products);

  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-category');
      const filtered = category === 'all'
        ? allProducts
        : allProducts.filter(p => p.category === category);
      renderProducts(filtered);
    });
  });
}

function renderProducts(products) {
  const productListEl = document.getElementById('product-list');
  if (products.length === 0) {
    productListEl.innerHTML = '<p>ไม่พบรายการน้ำหอมในหมวดหมู่นี้</p>';
    return;
  }

  productListEl.innerHTML = products.map(item => `
    <div class="product-card">
      <img src="${item.image}" alt="${item.name}" onerror="this.src='https://placehold.co/600x400/EFEAE2/2C221E?text=No+Image'">
      <div class="product-info">
        <span class="product-category">${item.categoryName}</span>
        <h3>${item.name}</h3>
        <p class="product-desc">${item.description}</p>
        <div class="product-footer">
          <span class="product-price">฿${item.price.toLocaleString()}</span>
          <a href="order.html?id=${item.id}" class="btn btn-primary">สั่งซื้อรายการนี้</a>
        </div>
      </div>
    </div>
  `).join('');
}

async function initOrderPage() {
  const orderForm = document.getElementById('order-form');
  if (!orderForm) return;

  const products = await fetchProducts();
  const selectEl = document.getElementById('product-select');
  const quantityEl = document.getElementById('quantity');
  const totalPriceEl = document.getElementById('total-price');

  selectEl.innerHTML = '<option value="">-- กรุณาเลือกรายการน้ำหอม --</option>' +
    products.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} (฿${p.price.toLocaleString()})</option>`).join('');

  const urlParams = new URLSearchParams(window.location.search);
  const selectedId = urlParams.get('id');
  if (selectedId) {
    selectEl.value = selectedId;
  }

  function updateTotal() {
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    const price = selectedOption ? Number(selectedOption.getAttribute('data-price') || 0) : 0;
    const qty = Number(quantityEl.value || 1);
    totalPriceEl.value = (price * qty).toLocaleString();
  }

  selectEl.addEventListener('change', updateTotal);
  quantityEl.addEventListener('input', updateTotal);
  updateTotal();

  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    const productName = selectedOption.text;
    const price = Number(selectedOption.getAttribute('data-price'));
    const quantity = Number(quantityEl.value);

    const newOrder = {
      orderId: 'PF-' + Date.now().toString().slice(-6),
      date: new Date().toLocaleString('th-TH'),
      productName: productName,
      quantity: quantity,
      totalPrice: price * quantity,
      customerName: document.getElementById('customer-name').value.trim(),
      phone: document.getElementById('customer-phone').