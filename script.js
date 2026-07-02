class ShoppingCart {
    constructor() {
        this.items = this.loadItems();
        this.cartCount = document.getElementById('cartCount');
        this.cartItems = document.getElementById('cartItems');
        this.totalPrice = document.getElementById('totalPrice');
        this.cartSidebar = document.getElementById('cartSidebar');
        this.overlay = document.getElementById('overlay');
        this.updateCartUI();
    }

    loadItems() {
        try {
            const savedItems = JSON.parse(localStorage.getItem('cart') || '[]');
            return Array.isArray(savedItems) ? savedItems : [];
        } catch (error) {
            console.warn('Could not load cart:', error);
            return [];
        }
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    addItem(name, price) {
        const existingItem = this.items.find((item) => item.name === name);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: Date.now(),
                name,
                price,
                quantity: 1
            });
        }

        this.saveCart();
        this.updateCartUI();
        this.showNotification(`${name} added to cart!`);
    }

    removeItem(id) {
        this.items = this.items.filter((item) => item.id !== id);
        this.saveCart();
        this.updateCartUI();
    }

    updateQuantity(id, quantity) {
        const item = this.items.find((cartItem) => cartItem.id === id);

        if (!item) {
            return;
        }

        item.quantity = parseInt(quantity, 10);

        if (item.quantity <= 0) {
            this.removeItem(id);
        } else {
            this.saveCart();
            this.updateCartUI();
        }
    }

    getTotal() {
        return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
    }

    updateCartUI() {
        if (!this.cartCount || !this.cartItems || !this.totalPrice) {
            return;
        }

        const totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
        this.cartCount.textContent = totalItems;

        if (this.items.length === 0) {
            this.cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
        } else {
            this.cartItems.innerHTML = this.items.map((item) => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">NPR ${item.price.toLocaleString()}</div>
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="quantity-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <button class="remove-item" onclick="cart.removeItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }

        this.totalPrice.textContent = `NPR ${this.getTotal().toLocaleString()}`;
    }

    openCart() {
        if (!this.cartSidebar || !this.overlay) {
            return;
        }

        this.cartSidebar.classList.add('open');
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeCart() {
        if (!this.cartSidebar || !this.overlay) {
            return;
        }

        this.cartSidebar.classList.remove('open');
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');
        this.body = document.body;
        this.init();
    }

    init() {
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme === 'light') {
            this.body.classList.add('light-mode');
            if (this.themeIcon) {
                this.themeIcon.className = 'fas fa-sun';
            }
        } else {
            this.body.classList.remove('light-mode');
            if (this.themeIcon) {
                this.themeIcon.className = 'fas fa-moon';
            }
            localStorage.setItem('theme', 'dark');
        }

        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        const isLightMode = this.body.classList.toggle('light-mode');

        if (isLightMode) {
            if (this.themeIcon) {
                this.themeIcon.className = 'fas fa-sun';
            }
            localStorage.setItem('theme', 'light');
        } else {
            if (this.themeIcon) {
                this.themeIcon.className = 'fas fa-moon';
            }
            localStorage.setItem('theme', 'dark');
        }
    }
}

class ProductManager {
    constructor() {
        this.products = Array.isArray(window.products) ? window.products : [];
        this.searchQuery = '';
        this.categoryFilter = 'All Products';
        this.productsGrid = document.getElementById('productsGrid');
        this.searchInput = document.getElementById('searchInput');
        this.categoryButtons = document.querySelectorAll('.category-btn');
        this.limit = this.productsGrid?.dataset.limit ? Number(this.productsGrid.dataset.limit) : null;
        this.init();
    }

    init() {
        if (!this.productsGrid) {
            return;
        }

        this.renderProducts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (event) => {
                this.searchQuery = event.target.value.toLowerCase().trim();
                this.renderProducts();
            });
        }

        this.categoryButtons.forEach((button) => {
            button.addEventListener('click', () => {
                this.categoryFilter = button.dataset.category || 'All Products';
                this.categoryButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
                this.renderProducts();
            });
        });
    }

    filteredProducts() {
        return this.products.filter((product) => {
            const category = product.category || 'Other Products';
            const matchesCategory = this.categoryFilter === 'All Products' || category === this.categoryFilter;
            const searchText = `${product.name} ${product.description || ''}`.toLowerCase();
            const matchesSearch = !this.searchQuery || searchText.includes(this.searchQuery);
            return matchesCategory && matchesSearch;
        });
    }

    getProductsToShow() {
        const filteredProducts = this.filteredProducts();
        return this.limit ? filteredProducts.slice(0, this.limit) : filteredProducts;
    }

    renderProducts() {
        const productsToShow = this.getProductsToShow();

        if (!productsToShow.length) {
            this.productsGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <p>No products match your search yet.</p>
                </div>
            `;
            return;
        }

        this.productsGrid.innerHTML = productsToShow.map((product) => this.createProductCard(product)).join('');
    }

    createProductCard(product) {
        const image = product.image || 'images/basket.webp';

        return `
            <div class="product-card">
                <div class="product-image">
                    <img src="${image}" alt="${product.name}" loading="lazy" onerror="this.src='images/basket.webp'">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-price">NPR ${product.price.toLocaleString()}</div>
                </div>
                <div class="product-footer">
                    <button class="btn-add-cart" onclick="addToCart('${product.name}', ${product.price})">
                        <i class="fas fa-cart-plus"></i>
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    }
}

let cart;
let themeManager;
let productManager;

function addToCart(name, price) {
    if (!cart) {
        return;
    }

    cart.addItem(name, price);
}

function orderViaWhatsApp(customerDetails, orderItems) {
    const phoneNumber = '+9779847244773';
    const itemsList = orderItems.map((item) => `🛍️ ${item.name} x${item.quantity} - NPR ${item.price * item.quantity}`).join('\n');
    const message = `🛒 *NEW ORDER - Tools Nepal*\n\n👤 *Customer Details:*\nName: ${customerDetails.name}\nPhone: ${customerDetails.phone}\nAddress: ${customerDetails.address}\n\n📦 *Order Details:*\n${itemsList}\n\n💰 *Total Amount:* NPR ${cart.getTotal()}\n\n📍 *Delivery Address:* ${customerDetails.address}\n\n📞 *Contact:* ${customerDetails.phone}\n\nThank you for your order! 🎉`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

function setupPageInteractions() {
    const cartIcon = document.getElementById('cartIcon');
    const closeCart = document.getElementById('closeCart');
    const overlay = document.getElementById('overlay');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (cartIcon) {
        cartIcon.addEventListener('click', () => cart.openCart());
    }

    if (closeCart) {
        closeCart.addEventListener('click', () => cart.closeCart());
    }

    if (overlay) {
        overlay.addEventListener('click', () => cart.closeCart());
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            window.location.href = 'checkout.html';
        });
    }

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        navLinks.forEach((link) => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cart = new ShoppingCart();
    themeManager = new ThemeManager();
    productManager = new ProductManager();
    setupPageInteractions();
    window.cart = cart;
    window.addToCart = addToCart;
    window.orderViaWhatsApp = orderViaWhatsApp;
});
