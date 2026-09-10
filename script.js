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

    addItem(name, price, slug) {
        let image;
        if (slug && Array.isArray(window.products)) {
            const product = window.products.find((p) => p.slug === slug);
            image = product ? product.image : 'images/basket.webp';
        } else if (Array.isArray(window.products)) {
            const product = window.products.find((p) => p.name === name);
            image = (product && product.image) || 'images/basket.webp';
        } else {
            image = 'images/basket.webp';
        }

        const existingItem = this.items.find((item) => item.name === name);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: Date.now(),
                name,
                price,
                image,
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
            const onProductPage = window.location.pathname.includes('/products/');
            const imgPrefix = onProductPage ? '../' : '';

            this.cartItems.innerHTML = this.items.map((item) => `
                <div class="cart-item">
                    <img class="cart-item-thumb" src="${imgPrefix}${item.image || 'images/basket.webp'}" alt="${item.name}">
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
        const existing = document.querySelector('.toast');

        if (existing) {
            existing.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';

        const icon = document.createElement('i');
        icon.className = 'fas fa-check-circle';
        toast.appendChild(icon);

        const text = document.createElement('span');
        text.textContent = message;
        toast.appendChild(text);

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2800);
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
        this.sortBy = 'price-asc';
        this.priceFilter = 'all';
        this.productsGrid = document.getElementById('productsGrid');
        this.searchInput = document.getElementById('searchInput');
        this.categoryButtons = document.querySelectorAll('.category-btn');
        this.sortSelect = document.getElementById('sortSelect');
        this.priceFilterSelect = document.getElementById('priceFilter');
        this.limit = this.productsGrid?.dataset.limit ? Number(this.productsGrid.dataset.limit) : null;
        this.pageSize = this.productsGrid?.dataset.paginate ? Number(this.productsGrid.dataset.paginate) : null;
        this.currentPage = 1;
        this.paginationContainer = document.getElementById('pagination');
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
                this.currentPage = 1;
                this.renderProducts();
            });
        }

        this.categoryButtons.forEach((button) => {
            button.addEventListener('click', () => {
                this.categoryFilter = button.dataset.category || 'All Products';
                this.categoryButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
                this.currentPage = 1;
                this.renderProducts();
            });
        });

        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', (event) => {
                this.sortBy = event.target.value;
                this.currentPage = 1;
                this.renderProducts();
            });
        }

        if (this.priceFilterSelect) {
            this.priceFilterSelect.addEventListener('change', (event) => {
                this.priceFilter = event.target.value;
                this.currentPage = 1;
                this.renderProducts();
            });
        }
    }

    matchesPriceFilter(price) {
        switch (this.priceFilter) {
            case '0-2000':
                return price < 2000;
            case '2000-5000':
                return price >= 2000 && price <= 5000;
            case '5000-10000':
                return price >= 5000 && price <= 10000;
            case '10000-above':
                return price > 10000;
            default:
                return true;
        }
    }

    filteredProducts() {
        return this.products.filter((product) => {
            const category = product.category || 'Other Products';
            const matchesCategory = this.categoryFilter === 'All Products' || category === this.categoryFilter;
            const searchText = `${product.name} ${product.description || ''}`.toLowerCase();
            const matchesSearch = !this.searchQuery || searchText.includes(this.searchQuery);
            const matchesPrice = this.matchesPriceFilter(Number(product.price) || 0);
            return matchesCategory && matchesSearch && matchesPrice;
        });
    }

    sortProducts(products) {
        const sorted = products.slice();

        sorted.sort((a, b) => {
            const aLatest = a.isLatest ? 1 : 0;
            const bLatest = b.isLatest ? 1 : 0;
            if (aLatest !== bLatest) {
                return bLatest - aLatest;
            }

            switch (this.sortBy) {
                case 'price-desc':
                    return (Number(b.price) || 0) - (Number(a.price) || 0);
                case 'name-asc':
                    return `${a.name}`.localeCompare(`${b.name}`);
                case 'price-asc':
                default:
                    return (Number(a.price) || 0) - (Number(b.price) || 0);
            }
        });

        return sorted;
    }

    getProductsToShow() {
        const filteredProducts = this.sortProducts(this.filteredProducts());

        if (this.pageSize) {
            const start = (this.currentPage - 1) * this.pageSize;
            return filteredProducts.slice(start, start + this.pageSize);
        }

        return this.limit ? filteredProducts.slice(0, this.limit) : filteredProducts;
    }

    getTotalPages() {
        if (!this.pageSize) {
            return 1;
        }
        return Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize));
    }

    goToPage(page) {
        const totalPages = this.getTotalPages();
        this.currentPage = Math.max(1, Math.min(page, totalPages));
        this.renderProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderPagination() {
        if (!this.paginationContainer || !this.pageSize) {
            return;
        }

        const totalPages = this.getTotalPages();

        if (totalPages <= 1) {
            this.paginationContainer.innerHTML = '';
            return;
        }

        const createButton = (label, page, isActive = false, isDisabled = false) => {
            if (isDisabled) {
                return `<button class="page-btn disabled" disabled>${label}</button>`;
            }
            return `<button class="page-btn ${isActive ? 'active' : ''}" data-page="${page}">${label}</button>`;
        };

        let html = '';

        html += createButton('← Previous', this.currentPage - 1, false, this.currentPage === 1);

        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            html += createButton('1', 1);
            if (startPage > 2) {
                html += `<span class="page-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += createButton(i, i, i === this.currentPage);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="page-ellipsis">...</span>`;
            }
            html += createButton(totalPages, totalPages);
        }

        html += createButton('Next →', this.currentPage + 1, false, this.currentPage === totalPages);

        this.paginationContainer.innerHTML = html;

        this.paginationContainer.querySelectorAll('.page-btn:not(.disabled)').forEach((btn) => {
            btn.addEventListener('click', () => {
                const page = Number(btn.dataset.page);
                if (!Number.isNaN(page)) {
                    this.goToPage(page);
                }
            });
        });
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
            this.renderPagination();
            return;
        }

        this.productsGrid.innerHTML = productsToShow.map((product) => this.createProductCard(product)).join('');
        this.renderPagination();
    }

    createProductCard(product) {
        const slug = product.slug || `${product.name.toLowerCase().replace(/\s+/g, '-')}`;
        const image = product.image || 'images/basket.webp';
        const href = `products/${slug}.html`;

        return `
            <a class="product-card-link" href="${href}">
                <div class="product-card">
                    <div class="product-image">
                        <img src="${image}" alt="${product.name}" loading="lazy" onerror="this.src='images/basket.webp'">
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <div class="product-price">NPR ${product.price.toLocaleString()}</div>
                    </div>
                    <div class="product-footer">
                        <button class="btn-add-cart" onclick="event.preventDefault(); addToCart('${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.slug}')">
                            <i class="fas fa-cart-plus"></i>
                            Add to Cart
                        </button>
                    </div>
                </div>
            </a>
        `;
    }
}

let cart;
let themeManager;
let productManager;

function addToCart(name, price, slug) {
    if (!cart) {
        return;
    }

    if (!slug) {
        const current = getCurrentProduct();
        if (current && current.name === name) {
            slug = current.slug;
        }
    }

    cart.addItem(name, price, slug);
}

function orderViaWhatsApp(customerDetails, orderItems) {
    const phoneNumber = '+9779847244773';
    const itemsList = orderItems.map((item) => `🛍️ ${item.name} x${item.quantity} - NPR ${item.price * item.quantity}`).join('\n');
    const message = `🛒 *NEW ORDER - Shree Krishna Traders*\n\n👤 *Customer Details:*\nName: ${customerDetails.name}\nPhone: ${customerDetails.phone}\nAddress: ${customerDetails.address}\n\n📦 *Order Details:*\n${itemsList}\n\n💰 *Total Amount:* NPR ${cart.getTotal()}\n\n📍 *Delivery Address:* ${customerDetails.address}\n\n📞 *Contact:* ${customerDetails.phone}\n\nThank you for your order! 🎉`;
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
            const fromProductPage = window.location.pathname.includes('/products/');
            window.location.href = fromProductPage ? '../checkout.html' : 'checkout.html';
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

function showToast(message) {
    if (cart) {
        cart.showNotification(message);
    }
}

function wrapButtonLabels() {
    document.querySelectorAll('.btn-add-cart, .btn-buy-now').forEach((button) => {
        if (button.querySelector('.btn-label')) {
            return;
        }

        const icon = button.querySelector('i');
        const label = document.createElement('span');
        label.className = 'btn-label';

        let node = icon ? icon.nextSibling : button.firstChild;

        while (node) {
            const next = node.nextSibling;

            if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'I')) {
                button.removeChild(node);
                label.appendChild(node);
            }

            node = next;
        }

        button.appendChild(label);
    });
}

function createRipple(event) {
    const button = event.currentTarget;

    if (event.clientX === 0 && event.clientY === 0) {
        return;
    }

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

    button.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

function attachRipple(selector) {
    document.querySelectorAll(selector).forEach((button) => {
        button.addEventListener('click', createRipple);
    });
}

function initAddToCartButton() {
    const btn = document.getElementById('addToCartBtn');

    if (!btn) {
        return;
    }

    btn.addEventListener('click', () => {
        if (btn.classList.contains('is-loading')) {
            return;
        }

        btn.classList.add('is-loading');

        setTimeout(() => {
            btn.classList.remove('is-loading');
        }, 800);
    });
}

function initProductGallery() {
    const gallery = document.querySelector('.product-gallery');

    if (!gallery) {
        return;
    }

    const mainWrap = gallery.querySelector('.product-main-image');
    const mainImg = document.getElementById('mainProductImage');
    const thumbnails = gallery.querySelector('.product-thumbnails');

    if (!mainImg) {
        return;
    }

    gallery.addEventListener('mouseenter', () => gallery.classList.add('zoom'));
    gallery.addEventListener('mouseleave', () => gallery.classList.remove('zoom'));

    if (!thumbnails) {
        return;
    }

    const thumbs = thumbnails.querySelectorAll('img');

    if (!thumbs.length) {
        return;
    }

    thumbs.forEach((thumb) => {
        thumb.tabIndex = 0;

        const swap = () => {
            if (thumb.classList.contains('active')) {
                return;
            }

            mainWrap.classList.add('is-fading');

            const nextSrc = thumb.dataset.full || thumb.src;
            const loader = new Image();

            loader.onload = () => {
                mainImg.src = nextSrc;
                mainImg.alt = thumb.alt || mainImg.alt;
                mainWrap.classList.remove('is-fading');
            };

            loader.onerror = () => {
                mainWrap.classList.remove('is-fading');
            };

            loader.src = nextSrc;

            thumbs.forEach((t) => t.classList.remove('active'));
            thumb.classList.add('active');
        };

        thumb.addEventListener('click', swap);
        thumb.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                swap();
            }
        });
    });

    thumbs[0].classList.add('active');
}

function initCategoryFromQuery() {
    if (!productManager) {
        return;
    }

    const category = new URLSearchParams(window.location.search).get('category');

    if (!category) {
        return;
    }

    const target = Array.from(productManager.categoryButtons).find((button) => button.dataset.category === category);

    if (target) {
        target.click();
    } else {
        productManager.categoryFilter = category;
        productManager.renderProducts();
    }
}

function getProductSlugFromPath() {
    const match = window.location.pathname.match(/products\/([^/]+)\.html$/);
    return match ? match[1] : null;
}

function getCurrentProduct() {
    if (!Array.isArray(window.products)) {
        return null;
    }

    const slug = getProductSlugFromPath();

    if (!slug) {
        return null;
    }

    return window.products.find((product) => product.slug === slug) || null;
}

const RECENTLY_VIEWED_KEY = 'skt_recently_viewed';

function recordRecentlyViewed() {
    const product = getCurrentProduct();

    if (!product) {
        return;
    }

    let recent = [];

    try {
        recent = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
        if (!Array.isArray(recent)) {
            recent = [];
        }
    } catch (error) {
        recent = [];
    }

    recent = recent.filter((item) => item.slug !== product.slug);
    recent.unshift({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.image,
        category: product.category
    });
    recent = recent.slice(0, 8);

    try {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recent));
    } catch (error) {
        // ignore storage errors (private mode / quota)
    }
}

function shuffle(array) {
    const result = array.slice();

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function productCardHTML(product) {
    const image = product.image || 'images/basket.webp';
    const slug = product.slug || product.name.toLowerCase().replace(/\s+/g, '-');
    const onProductPage = Boolean(getProductSlugFromPath());
    const href = onProductPage ? `${slug}.html` : `products/${slug}.html`;
    const imgSrc = onProductPage ? `../${image}` : image;

    return `
        <a class="related-card" href="${href}">
            <img src="${imgSrc}" alt="${product.name}" loading="lazy" onerror="this.src='${onProductPage ? '../' : ''}images/basket.webp'">
            <h3>${product.name}</h3>
            <div class="price">NPR ${Number(product.price).toLocaleString()}</div>
        </a>`;
}

function renderGrid(containerId, products) {
    const container = document.getElementById(containerId);

    if (!container) {
        return;
    }

    if (!products.length) {
        container.innerHTML = '<p class="pp-empty">No products to show yet.</p>';
        return;
    }

    container.innerHTML = products.map(productCardHTML).join('');
}

function pickRelated(current, count) {
    if (!Array.isArray(window.products)) {
        return [];
    }

    const category = current.category || 'Other Products';
    const sameCategory = window.products.filter((product) => product.slug !== current.slug && (product.category || 'Other Products') === category);
    const source = sameCategory.length ? sameCategory : window.products.filter((product) => product.slug !== current.slug);

    return shuffle(source).slice(0, count);
}

function renderEngagementSections() {
    const current = getCurrentProduct();

    if (document.getElementById('relatedProductsGrid') && current) {
        renderGrid('relatedProductsGrid', pickRelated(current, 8));
    }

    if (document.getElementById('popularGrid')) {
        const pool = window.products || [];
        renderGrid('popularGrid', shuffle(pool.filter((product) => !current || product.slug !== current.slug)).slice(0, 8));
    }

    if (document.getElementById('featuredGrid')) {
        renderGrid('featuredGrid', (window.products || []).slice(0, 8));
    }

    if (document.getElementById('recentlyViewedGrid')) {
        let recent = [];

        try {
            recent = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
        } catch (error) {
            recent = [];
        }

        if (current) {
            recent = recent.filter((product) => product.slug !== current.slug);
        }

        renderGrid('recentlyViewedGrid', recent.slice(0, 8));
    }

    if (document.getElementById('categoryCards')) {
        renderCategoryCards();
    }
}

function renderCategoryCards() {
    const container = document.getElementById('categoryCards');

    if (!Array.isArray(window.products)) {
        return;
    }

    const counts = {};

    window.products.forEach((product) => {
        const category = product.category || 'Other Products';
        counts[category] = (counts[category] || 0) + 1;
    });

    const prefix = getProductSlugFromPath() ? '../' : '';

    container.innerHTML = Object.keys(counts).map((category) => `
        <a class="category-card" href="${prefix}products.html?category=${encodeURIComponent(category)}">
            <i class="fas fa-th-large cat-icon"></i>
            <span class="cat-name">${category}</span>
            <span class="cat-count">${counts[category]} items</span>
        </a>`).join('');
}

function renderLatestProducts(containerId) {
    const container = document.getElementById(containerId);

    if (!container || !Array.isArray(window.latestProductSlugs) || !Array.isArray(window.products)) {
        return;
    }

    const latestProducts = window.latestProductSlugs
        .map((slug) => window.products.find((p) => p.slug === slug))
        .filter(Boolean);

    if (!latestProducts.length) {
        return;
    }

    container.innerHTML = latestProducts.map((product) => {
        const slug = product.slug || `${product.name.toLowerCase().replace(/\s+/g, '-')}`;
        const image = product.image || 'images/basket.webp';
        const onProductPage = Boolean(getProductSlugFromPath());
        const href = onProductPage ? `${slug}.html` : `products/${slug}.html`;

        return `
            <a class="product-card-link" href="${href}">
                <div class="product-card">
                    <div class="product-image">
                        <img src="${image}" alt="${product.name}" loading="lazy" onerror="this.src='images/basket.webp'">
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <div class="product-price">NPR ${product.price.toLocaleString()}</div>
                    </div>
                    <div class="product-footer">
                        <button class="btn-add-cart" onclick="event.preventDefault(); addToCart('${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.slug}')">
                            <i class="fas fa-cart-plus"></i>
                            Add to Cart
                        </button>
                    </div>
                </div>
            </a>
        `;
    }).join('');
}

function initShareBar() {
    const bar = document.querySelector('.share-bar');

    if (!bar) {
        return;
    }

    const url = window.location.href;
    const copyBtn = bar.querySelector('[data-share="copy"]');
    const whatsappBtn = bar.querySelector('[data-share="whatsapp"]');
    const nativeBtn = bar.querySelector('[data-share="native"]');

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const done = () => showToast('Link copied to clipboard!');

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(done).catch(done);
            } else {
                done();
            }
        });
    }

    if (whatsappBtn) {
        whatsappBtn.href = `https://wa.me/?text=${encodeURIComponent('Check out this product: ' + url)}`;
    }

    if (nativeBtn && navigator.share) {
        nativeBtn.addEventListener('click', () => {
            navigator.share({ title: document.title, url }).catch(() => {});
        });
    }
}

function initProductNav() {
    const nav = document.querySelector('.product-nav');

    if (!nav || !Array.isArray(window.products)) {
        return;
    }

    const current = getCurrentProduct();

    if (!current) {
        return;
    }

    const index = window.products.findIndex((product) => product.slug === current.slug);

    if (index === -1) {
        return;
    }

    const prev = window.products[index - 1];
    const next = window.products[index + 1];
    const prevEl = nav.querySelector('.nav-prev');
    const nextEl = nav.querySelector('.nav-next');

    if (prevEl) {
        if (prev) {
            prevEl.href = `${prev.slug}.html`;
            prevEl.classList.remove('disabled');
        } else {
            prevEl.classList.add('disabled');
        }
    }

    if (nextEl) {
        if (next) {
            nextEl.href = `${next.slug}.html`;
            nextEl.classList.remove('disabled');
        } else {
            nextEl.classList.add('disabled');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cart = new ShoppingCart();
    themeManager = new ThemeManager();
    productManager = new ProductManager();
    setupPageInteractions();

    wrapButtonLabels();
    attachRipple('.btn-add-cart, .btn-buy-now, .btn-primary, .btn-secondary, .checkout-btn');
    initAddToCartButton();
    initProductGallery();
    initCategoryFromQuery();
    recordRecentlyViewed();
    renderEngagementSections();
    renderLatestProducts('latestProductsGrid');
    initShareBar();
    initProductNav();

    window.cart = cart;
    window.addToCart = addToCart;
    window.orderViaWhatsApp = orderViaWhatsApp;
    window.showToast = showToast;
});
