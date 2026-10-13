(() => {
    "use strict";

    const KEYS = {
        products: "blueSkyMarket.products.v1",
        cart: "blueSkyMarket.cart.v1",
        orders: "blueSkyMarket.orders.v1"
    };
    const STATUSES = ["Placed", "Preparing", "Shipped", "Out for delivery", "Delivered", "Cancelled"];
    const SEED_PRODUCTS = [
        { id: "p-bluebuds", name: "Sky Blue Earbuds", category: "Electronics", price: 799, stock: 12, description: "Lightweight wireless earbuds for music, calls, and everyday listening.", icon: "🎧" },
        { id: "p-tumbler", name: "Cloud Blue Tumbler", category: "Home", price: 349, stock: 18, description: "A reusable tumbler with a clean, simple design for your daily drinks.", icon: "🥤" },
        { id: "p-tote", name: "Everyday Canvas Tote", category: "Accessories", price: 259, stock: 20, description: "A roomy canvas bag for school, errands, and weekend trips.", icon: "👜" },
        { id: "p-lamp", name: "Soft Glow Desk Lamp", category: "Home", price: 685, stock: 8, description: "A compact desk lamp for reading and working at night.", icon: "💡" },
        { id: "p-stand", name: "Adjustable Phone Stand", category: "Electronics", price: 189, stock: 25, description: "A foldable stand that keeps your phone upright on a desk.", icon: "📱" },
        { id: "p-notebook", name: "Blue Sky Notebook Set", category: "Stationery", price: 145, stock: 30, description: "Three lined notebooks for notes, lists, and ideas.", icon: "📘" }
    ];

    function read(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    let products = read(KEYS.products, null);
    if (!Array.isArray(products)) {
        products = SEED_PRODUCTS;
        write(KEYS.products, products);
    }
    let cart = read(KEYS.cart, {});
    let orders = read(KEYS.orders, []);
    if (!cart || typeof cart !== "object" || Array.isArray(cart)) cart = {};
    if (!Array.isArray(orders)) orders = [];

    const money = value => new Intl.NumberFormat("en-PH", {
        style: "currency", currency: "PHP", minimumFractionDigits: 2
    }).format(Number(value) || 0);

    function makeId(prefix) {
        return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function saveProducts() { write(KEYS.products, products); }
    function saveCart() { write(KEYS.cart, cart); }
    function saveOrders() { write(KEYS.orders, orders); }

    if (document.body.dataset.page === "shop") initShop();
    if (document.body.dataset.page === "seller") initSeller();

    function initShop() {
        const grid = document.getElementById("productGrid");
        const search = document.getElementById("productSearch");
        const category = document.getElementById("categoryFilter");
        const dialog = document.getElementById("productDialog");
        const dialogContent = document.getElementById("dialogContent");
        const checkoutForm = document.getElementById("checkoutForm");

        function renderCategories() {
            const selected = category.value || "all";
            const categories = [...new Set(products.map(item => item.category).filter(Boolean))].sort();
            category.replaceChildren();
            const all = element("option", "", "All categories");
            all.value = "all";
            category.append(all);
            categories.forEach(name => {
                const option = element("option", "", name);
                option.value = name;
                category.append(option);
            });
            category.value = categories.includes(selected) ? selected : "all";
        }

        function renderProducts() {
            const term = search.value.trim().toLowerCase();
            const chosenCategory = category.value;
            const matching = products.filter(product => {
                const matchesText = `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(term);
                return matchesText && (chosenCategory === "all" || product.category === chosenCategory);
            });
            grid.replaceChildren();
            document.getElementById("emptyProducts").hidden = matching.length > 0;

            matching.forEach(product => {
                const card = element("article", "product-card glass-panel");
                const art = element("div", "product-art", product.icon || "✦");
                art.setAttribute("aria-hidden", "true");
                const info = element("div", "product-info");
                info.append(element("span", "product-category", product.category));
                info.append(element("h3", "", product.name));
                info.append(element("p", "product-description", product.description));
                const bottom = element("div", "product-bottom");
                bottom.append(element("strong", "product-price", money(product.price)));
                const actions = element("div", "product-actions");
                const details = element("button", "secondary-button", "Details");
                details.type = "button";
                details.dataset.details = product.id;
                const add = element("button", "primary-button", product.stock > 0 ? "Add to cart" : "Sold out");
                add.type = "button";
                add.dataset.add = product.id;
                add.disabled = Number(product.stock) <= 0;
                actions.append(details, add);
                bottom.append(actions);
                info.append(bottom);
                card.append(art, info);
                grid.append(card);
            });
        }

        function renderCart() {
            const list = document.getElementById("cartItems");
            list.replaceChildren();
            const entries = Object.entries(cart).filter(([id, quantity]) =>
                products.some(product => product.id === id) && Number(quantity) > 0
            );
            let total = 0;
            let count = 0;
            if (!entries.length) list.append(element("p", "empty-message", "Your cart is empty."));

            entries.forEach(([id, quantity]) => {
                const product = products.find(item => item.id === id);
                const amount = Number(quantity);
                total += Number(product.price) * amount;
                count += amount;
                const row = element("div", "cart-row");
                const details = element("div", "cart-row-info");
                details.append(element("strong", "", product.name));
                details.append(element("span", "", `${money(product.price)} each`));
                const controls = element("div", "quantity-controls");
                const minus = element("button", "quantity-button", "−");
                minus.type = "button";
                minus.dataset.quantity = "-1";
                minus.dataset.id = id;
                minus.setAttribute("aria-label", `Remove one ${product.name}`);
                const quantityText = element("span", "", String(amount));
                const plus = element("button", "quantity-button", "+");
                plus.type = "button";
                plus.dataset.quantity = "1";
                plus.dataset.id = id;
                plus.setAttribute("aria-label", `Add one ${product.name}`);
                controls.append(minus, quantityText, plus);
                row.append(details, controls);
                list.append(row);
            });
            document.getElementById("cartTotal").textContent = money(total);
            document.getElementById("cartCount").textContent = String(count);
        }

        function renderCustomerOrders() {
            const list = document.getElementById("customerOrders");
            list.replaceChildren();
            if (!orders.length) {
                list.append(element("p", "empty-message", "Your placed orders will appear here."));
                return;
            }
            [...orders].reverse().forEach(order => {
                const card = element("article", "order-card");
                const heading = element("div", "order-heading");
                heading.append(element("strong", "", order.id));
                heading.append(element("span", `status-pill status-${statusSlug(order.status)}`, order.status));
                card.append(heading);
                card.append(element("p", "order-date", `Placed ${formatDate(order.createdAt)}`));
                const itemNames = order.items.map(item => `${item.name} × ${item.quantity}`).join(", ");
                card.append(element("p", "order-item-summary", itemNames));
                card.append(element("strong", "", `Total ${money(order.total)}`));
                const progress = element("div", "order-progress");
                const current = STATUSES.indexOf(order.status);
                const end = order.status === "Cancelled" ? -1 : current;
                STATUSES.slice(0, 5).forEach((status, index) => {
                    const step = element("span", `progress-step${index <= end ? " complete" : ""}`, status);
                    progress.append(step);
                });
                card.append(progress);
                list.append(card);
            });
        }

        function addProductToCart(id) {
            const product = products.find(item => item.id === id);
            const quantity = Number(cart[id] || 0);
            if (!product || quantity >= Number(product.stock)) return;
            cart[id] = quantity + 1;
            saveCart();
            renderCart();
        }

        grid.addEventListener("click", event => {
            const addId = event.target.dataset.add;
            const detailId = event.target.dataset.details;
            if (addId) addProductToCart(addId);
            if (detailId) {
                const product = products.find(item => item.id === detailId);
                if (!product) return;
                dialogContent.replaceChildren();
                dialogContent.append(element("div", "dialog-art", product.icon || "✦"));
                dialogContent.append(element("span", "product-category", product.category));
                dialogContent.append(element("h2", "", product.name));
                dialogContent.append(element("p", "", product.description));
                dialogContent.append(element("strong", "product-price", money(product.price)));
                dialogContent.append(element("p", "", `Available: ${product.stock}`));
                const add = element("button", "primary-button", "Add to cart");
                add.type = "button";
                add.disabled = Number(product.stock) <= 0;
                add.addEventListener("click", () => {
                    addProductToCart(product.id);
                    dialog.close();
                });
                dialogContent.append(add);
                dialog.showModal();
            }
        });

        document.getElementById("closeDialog").addEventListener("click", () => dialog.close());
        search.addEventListener("input", renderProducts);
        category.addEventListener("change", renderProducts);
        document.getElementById("cartItems").addEventListener("click", event => {
            const button = event.target.closest("button[data-quantity]");
            if (!button) return;
            const id = button.dataset.id;
            const next = Number(cart[id] || 0) + Number(button.dataset.quantity);
            if (next <= 0) delete cart[id];
            else cart[id] = Math.min(next, Number(products.find(product => product.id === id)?.stock || next));
            saveCart();
            renderCart();
        });

        checkoutForm.addEventListener("submit", event => {
            event.preventDefault();
            const entries = Object.entries(cart).filter(([id, quantity]) =>
                products.some(product => product.id === id) && Number(quantity) > 0
            );
            const message = document.getElementById("checkoutMessage");
            if (!entries.length) {
                message.textContent = "Add a product to your cart before placing an order.";
                return;
            }
            const items = [];
            for (const [id, quantity] of entries) {
                const product = products.find(item => item.id === id);
                if (!product || Number(product.stock) < Number(quantity)) {
                    message.textContent = `There is not enough stock for ${product ? product.name : "one item"}.`;
                    return;
                }
                items.push({ id, name: product.name, price: Number(product.price), quantity: Number(quantity) });
            }
            const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const order = {
                id: "BSM-" + Date.now().toString().slice(-8),
                customer: document.getElementById("customerName").value.trim(),
                email: document.getElementById("customerEmail").value.trim(),
                address: document.getElementById("customerAddress").value.trim(),
                items,
                total,
                status: "Placed",
                createdAt: new Date().toISOString()
            };
            items.forEach(item => {
                const product = products.find(entry => entry.id === item.id);
                product.stock = Number(product.stock) - item.quantity;
            });
            orders.push(order);
            cart = {};
            saveProducts();
            saveCart();
            saveOrders();
            checkoutForm.reset();
            message.textContent = `Order ${order.id} placed. Track its status below.`;
            renderCategories();
            renderProducts();
            renderCart();
            renderCustomerOrders();
        });

        renderCategories();
        renderProducts();
        renderCart();
        renderCustomerOrders();
    }

    function initSeller() {
        const productForm = document.getElementById("productForm");
        const sellerMessage = document.getElementById("sellerMessage");
        let editingProductId = "";

        function renderSeller() {
            const body = document.getElementById("sellerProducts");
            body.replaceChildren();
            document.getElementById("statProducts").textContent = String(products.length);
            document.getElementById("statPending").textContent = String(orders.filter(order => !["Delivered", "Cancelled"].includes(order.status)).length);
            const sales = orders.filter(order => order.status !== "Cancelled").reduce((sum, order) => sum + Number(order.total), 0);
            document.getElementById("statSales").textContent = money(sales);

            products.forEach(product => {
                const row = document.createElement("tr");
                [product.name, product.category, money(product.price), String(product.stock)].forEach(value => row.append(element("td", "", value)));
                const actions = element("td", "table-actions");
                const edit = element("button", "small-button", "Edit");
                edit.type = "button";
                edit.dataset.editProduct = product.id;
                const remove = element("button", "small-button danger-button", "Delete");
                remove.type = "button";
                remove.dataset.deleteProduct = product.id;
                actions.append(edit, remove);
                row.append(actions);
                body.append(row);
            });
            if (!products.length) {
                const row = document.createElement("tr");
                const cell = element("td", "empty-message", "No products yet. Add your first item above.");
                cell.colSpan = 5;
                row.append(cell);
                body.append(row);
            }

            const orderBody = document.getElementById("sellerOrders");
            orderBody.replaceChildren();
            document.getElementById("emptySellerOrders").hidden = orders.length > 0;
            [...orders].reverse().forEach(order => {
                const row = document.createElement("tr");
                const summary = order.items.map(item => `${item.name} × ${item.quantity}`).join(", ");
                [order.id, order.customer, summary, money(order.total), formatDate(order.createdAt)].forEach(value => row.append(element("td", "", value)));
                const statusCell = element("td", "");
                const select = document.createElement("select");
                select.className = "status-select";
                select.dataset.orderStatus = order.id;
                STATUSES.forEach(status => {
                    const option = element("option", "", status);
                    option.value = status;
                    select.append(option);
                });
                select.value = order.status;
                statusCell.append(select);
                row.append(statusCell);
                orderBody.append(row);
            });
        }

        function clearProductForm() {
            productForm.reset();
            editingProductId = "";
            document.getElementById("productId").value = "";
            document.getElementById("productFormHeading").textContent = "Add a product";
            document.getElementById("saveProductButton").textContent = "Add product";
            document.getElementById("cancelEditButton").hidden = true;
        }

        productForm.addEventListener("submit", event => {
            event.preventDefault();
            const product = {
                name: document.getElementById("productName").value.trim(),
                category: document.getElementById("productCategory").value.trim(),
                price: Number(document.getElementById("productPrice").value),
                stock: Number(document.getElementById("productStock").value),
                description: document.getElementById("productDescription").value.trim(),
                icon: "🛍️"
            };
            if (!product.name || !product.category || !Number.isFinite(product.price) || product.price <= 0 || !Number.isInteger(product.stock) || product.stock < 0) {
                sellerMessage.textContent = "Enter a name, category, valid price, and stock amount.";
                return;
            }
            if (editingProductId) {
                const existing = products.find(item => item.id === editingProductId);
                if (existing) Object.assign(existing, product);
                sellerMessage.textContent = "Product updated.";
            } else {
                products.push({ id: makeId("p-"), ...product });
                sellerMessage.textContent = "Product added to the store.";
            }
            saveProducts();
            clearProductForm();
            renderSeller();
        });

        document.getElementById("cancelEditButton").addEventListener("click", clearProductForm);

        document.getElementById("sellerProducts").addEventListener("click", event => {
            const editId = event.target.dataset.editProduct;
            const deleteId = event.target.dataset.deleteProduct;
            if (editId) {
                const product = products.find(item => item.id === editId);
                if (!product) return;
                editingProductId = editId;
                document.getElementById("productId").value = editId;
                document.getElementById("productName").value = product.name;
                document.getElementById("productCategory").value = product.category;
                document.getElementById("productPrice").value = product.price;
                document.getElementById("productStock").value = product.stock;
                document.getElementById("productDescription").value = product.description;
                document.getElementById("productFormHeading").textContent = "Edit product";
                document.getElementById("saveProductButton").textContent = "Save changes";
                document.getElementById("cancelEditButton").hidden = false;
                productForm.scrollIntoView({ behavior: "smooth", block: "start" });
            }
            if (deleteId) {
                products = products.filter(item => item.id !== deleteId);
                delete cart[deleteId];
                saveProducts();
                saveCart();
                sellerMessage.textContent = "Product removed from the store.";
                renderSeller();
            }
        });

        document.getElementById("sellerOrders").addEventListener("change", event => {
            const orderId = event.target.dataset.orderStatus;
            if (!orderId) return;
            const order = orders.find(item => item.id === orderId);
            if (!order) return;
            order.status = event.target.value;
            saveOrders();
            sellerMessage.textContent = `Order ${order.id} status updated to ${order.status}.`;
            renderSeller();
        });

        renderSeller();
    }

    function statusSlug(status) {
        return String(status || "placed").toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
    }

    function formatDate(dateValue) {
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return "Date unavailable";
        return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(date);
    }
})();
