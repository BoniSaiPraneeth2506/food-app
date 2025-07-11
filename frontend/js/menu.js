// Menu management
class MenuManager {
    constructor() {
        this.menuItems = [];
        this.categories = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.isLoading = false;
        this.filters = {
            search: '',
            category: '',
            vegetarian: false,
            spicy: false
        };
        
        this.initializeEventListeners();
    }

    async loadMenuItems(page = 1, append = false) {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            
            if (!append) {
                showLoading('Loading menu...');
            }
            
            const params = {
                page,
                limit: CONFIG.MENU_ITEMS_PER_PAGE,
                ...this.filters
            };
            
            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === false) {
                    delete params[key];
                }
            });
            
            const response = await window.api.getMenuItems(params);
            
            if (response && response.success) {
                const { items, pagination } = response.data;
                
                if (append) {
                    this.menuItems = [...this.menuItems, ...items];
                } else {
                    this.menuItems = items;
                }
                
                this.currentPage = pagination.currentPage;
                this.totalPages = pagination.totalPages;
                
                this.renderMenuItems();
                this.updateLoadMoreButton();
            }
        } catch (error) {
            console.error('Failed to load menu items:', error);
            showToast('Failed to load menu items', 'error');
        } finally {
            this.isLoading = false;
            hideLoading();
        }
    }

    async loadCategories() {
        try {
            const response = await window.api.getCategories();
            if (response && response.success) {
                this.categories = response.data;
                this.renderCategoryFilter();
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    renderCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    renderMenuItems() {
        const menuGrid = document.getElementById('menuGrid');
        
        if (this.menuItems.length === 0) {
            menuGrid.innerHTML = `
                <div class="menu-empty">
                    <i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-500">No items found matching your criteria</p>
                </div>
            `;
            return;
        }
        
        menuGrid.innerHTML = this.menuItems.map(item => this.createMenuItemHTML(item)).join('');
    }

    createMenuItemHTML(item) {
        const isOutOfStock = item.stock === 0 || !item.isAvailable;
        const isLowStock = item.stock > 0 && item.stock <= 5;
        
        return `
            <div class="menu-item" data-id="${item._id}">
                <img src="${item.image}" alt="${item.name}" class="menu-item-image" loading="lazy">
                <div class="menu-item-content">
                    <div class="menu-item-header">
                        <h3 class="menu-item-title">${item.name}</h3>
                        <div class="menu-item-rating">
                            <i class="fas fa-star"></i>
                            <span>${item.rating?.average?.toFixed(1) || '0.0'}</span>
                        </div>
                    </div>
                    <p class="menu-item-description">${item.description}</p>
                    
                    <div class="menu-item-details">
                        <span class="menu-item-price">$${item.price.toFixed(2)}</span>
                        <div class="menu-item-tags">
                            ${item.tags?.isVegetarian ? '<span class="tag vegetarian">Veg</span>' : ''}
                            ${item.tags?.isVegan ? '<span class="tag vegan">Vegan</span>' : ''}
                            ${item.tags?.isSpicy ? '<span class="tag spicy">Spicy</span>' : ''}
                            ${item.tags?.isPopular ? '<span class="tag popular">Popular</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="menu-item-info">
                        <div class="prep-time">
                            <i class="fas fa-clock"></i>
                            <span>${item.prepTime} mins</span>
                        </div>
                        <div class="stock-info ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : ''}">
                            <i class="fas fa-box"></i>
                            <span>${isOutOfStock ? 'Out of stock' : isLowStock ? `Only ${item.stock} left` : `${item.stock} available`}</span>
                        </div>
                    </div>
                    
                    <button 
                        class="add-to-cart-btn" 
                        onclick="window.cartManager.addToCart('${item._id}')"
                        ${isOutOfStock ? 'disabled' : ''}
                    >
                        ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        `;
    }

    updateLoadMoreButton() {
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        if (this.currentPage >= this.totalPages) {
            loadMoreContainer.style.display = 'none';
        } else {
            loadMoreContainer.style.display = 'block';
            loadMoreBtn.disabled = this.isLoading;
            loadMoreBtn.textContent = this.isLoading ? 'Loading...' : 'Load More Items';
        }
    }

    applyFilters() {
        this.currentPage = 1;
        this.loadMenuItems(1, false);
    }

    initializeEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = e.target.value.trim();
                this.applyFilters();
            }, 300);
        });

        // Category filter
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.applyFilters();
        });

        // Filter tags
        document.querySelectorAll('.filter-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const filter = tag.dataset.filter;
                tag.classList.toggle('active');
                this.filters[filter] = tag.classList.contains('active');
                this.applyFilters();
            });
        });

        // Load more button
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMenuItems(this.currentPage + 1, true);
        });
    }

    async initialize() {
        await this.loadCategories();
        await this.loadMenuItems();
    }

    getMenuItem(id) {
        return this.menuItems.find(item => item._id === id);
    }

    updateMenuItemStock(itemId, newStock) {
        const item = this.menuItems.find(item => item._id === itemId);
        if (item) {
            item.stock = newStock;
            item.isAvailable = newStock > 0;
            this.renderMenuItems();
        }
    }
}

// Create global menu manager
window.menuManager = new MenuManager();