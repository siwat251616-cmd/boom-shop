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
      phone: document.getElementById('customer-phone').value.trim(),
      address: document.getElementById('customer-address').value.trim(),
      status: 'รอดำเนินการ'
    };

    const existingOrders = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existingOrders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingOrders));
    localStorage.setItem('last_perfume_order', JSON.stringify(newOrder));

    window.location.href = 'thankyou.html';
  });
}

function initThankYouPage() {
  const summaryEl = document.getElementById('last-order-summary');
  if (!summaryEl) return;

  const lastOrder = JSON.parse(localStorage.getItem('last_perfume_order'));
  if (!lastOrder) {
    summaryEl.innerHTML = '<p>ไม่พบข้อมูลคำสั่งซื้อล่าสุด</p>';
    return;
  }

  summaryEl.innerHTML = `
    <p><strong>รหัสคำสั่งซื้อ:</strong> ${lastOrder.orderId}</p>
    <p><strong>รายการ:</strong> ${lastOrder.productName} x ${lastOrder.quantity}</p>
    <p><strong>ยอดชำระรวม:</strong> ฿${lastOrder.totalPrice.toLocaleString()}</p>
    <p><strong>ผู้รับ:</strong> ${lastOrder.customerName} (${lastOrder.phone})</p>
    <p><strong>ที่อยู่/หมายเหตุ:</strong> ${lastOrder.address}</p>
  `;
}

function initAdminPage() {
  const orderListEl = document.getElementById('admin-order-list');
  if (!orderListEl) return;

  function renderOrders() {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (orders.length === 0) {
      orderListEl.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 30px;">ยังไม่มีรายการคำสั่งซื้อน้ำหอมในระบบ</td></tr>';
      return;
    }

    orderListEl.innerHTML = orders.map((order, index) => `
      <tr>
        <td><strong>${order.orderId}</strong></td>
        <td>${order.date}</td>
        <td>
          ${order.customerName}<br>
          <small style="color: var(--text-muted);">${order.phone}</small><br>
          <small style="color: var(--text-muted);">${order.address}</small>
        </td>
        <td>${order.productName}</td>
        <td>${order.quantity}</td>
        <td>฿${order.totalPrice.toLocaleString()}</td>
        <td>
          <span class="status-badge ${order.status === 'จัดส่งแล้ว' ? 'status-completed' : 'status-pending'}">
            ${order.status}
          </span>
        </td>
        <td>
          <button class="action-btn" onclick="toggleOrderStatus(${index})">สลับสถานะ</button>
          <button class="action-btn" style="color: var(--danger-color);" onclick="deleteOrder(${index})">ลบ</button>
        </td>
      </tr>
    `).join('');
  }

  window.toggleOrderStatus = (index) => {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    orders[index].status = orders[index].status === 'รอดำเนินการ' ? 'จัดส่งแล้ว' : 'รอดำเนินการ';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    renderOrders();
  };

  window.deleteOrder = (index) => {
    if (!confirm('ต้องการลบรายการสั่งซื้อนี้ใช่หรือไม่?')) return;
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    orders.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    renderOrders();
  };

  const clearBtn = document.getElementById('clear-orders-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('ยืนยันการล้างข้อมูลคำสั่งซื้อทั้งหมด?')) return;
      localStorage.removeItem(STORAGE_KEY);
      renderOrders();
    });
  }

  renderOrders();
}

document.addEventListener('DOMContentLoaded', () => {
  initProductPage();
  initOrderPage();
  initThankYouPage();
  initAdminPage();
});
