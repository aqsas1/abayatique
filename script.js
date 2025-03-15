let db;

window.onload = function() {
    let request = indexedDB.open("CartDB", 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains("cart")) {
            db.createObjectStore("cart", { keyPath: "id" });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        updateCartCount();
        loadCart();
    };

    request.onerror = function(event) {
        console.log("Error opening IndexedDB:", event.target.error);
    };
};


function addToCart(id, name, price) {
    let size = document.getElementById("size").value;
    let qty = parseInt(document.getElementById("qty").value);

    let transaction = db.transaction("cart", "readwrite");
    let store = transaction.objectStore("cart");

    let item = { id, name, price, size, qty };
    
    let request = store.put(item);
    request.onsuccess = function() {
        updateCartCount();
        alert("Added to Cart!");
    };
    request.onerror = function(event) {
        console.log("Error adding item:", event.target.error);
    };
}


function updateCartCount() {
    let transaction = db.transaction("cart", "readonly");
    let store = transaction.objectStore("cart");
    let countRequest = store.count();
    countRequest.onsuccess = function() {
        document.getElementById("cart-count").innerText = countRequest.result;
    };
}


document.addEventListener("DOMContentLoaded", function () {
    loadCart();
    updateCartCount();
});

function loadCart() {
    let transaction = db.transaction("cart", "readonly");
    let store = transaction.objectStore("cart");
    let request = store.getAll();

    request.onsuccess = function () {
        let cartItems = request.result;
        let cartTable = document.getElementById("cart-items");
        let totalAmount = 0;
        cartTable.innerHTML = ""; // Clear previous items

        cartItems.forEach((item) => {
            let subtotal = item.qty * item.price;
            totalAmount += subtotal;

            let row = document.createElement("tr");

            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.size}</td>
                <td>${item.qty}</td>
                <td>₹${item.price}</td>
                <td>₹${subtotal}</td>
                <td><button onclick="removeFromCart(${item.id})">Remove</button></td>
            `;

            cartTable.appendChild(row);
        });

        // Update total amount
        document.getElementById("total-amount").textContent = totalAmount;
    };
}

// Show checkout popup
function showCheckoutPopup() {
    document.getElementById("checkout-popup").classList.remove("hidden");
}

// Close checkout popup
function closeCheckoutPopup() {
    document.getElementById("checkout-popup").classList.add("hidden");
}

// Function to remove item from cart
function removeFromCart(id) {
    let transaction = db.transaction("cart", "readwrite");
    let store = transaction.objectStore("cart");
    store.delete(id);

    store.transaction.oncomplete = function () {
        loadCart(); // Reload cart after deletion
        updateCartCount();
    };
}

// Function to update cart count
function updateCartCount() {
    let transaction = db.transaction("cart", "readonly");
    let store = transaction.objectStore("cart");
    let request = store.getAll();

    request.onsuccess = function () {
        document.getElementById("cart-count").textContent = request.result.length;
    };
}

// Function to place order & clear cart
function placeOrder() {
    let name = document.getElementById("name").value;
    let phone = document.getElementById("phone").value;
    let address = document.getElementById("address").value;

    if (!name || !phone || !address) {
        alert("Please fill in all details!");
        return;
    }

    let transaction = db.transaction("cart", "readonly");
    let store = transaction.objectStore("cart");
    let request = store.getAll();

    request.onsuccess = function () {
        let cartItems = request.result;

        if (cartItems.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        let totalAmount = cartItems.reduce((sum, item) => sum + item.qty * item.price, 0);

        let message = `🛒 *Order Details*\n\n${cartItems
            .map(item => `📌 ${item.name} (Size: ${item.size}, Qty: ${item.qty}) - ₹${item.price * item.qty}`)
            .join("\n")}\n\n💰 *Total Amount:* ₹${totalAmount}\n\n👤 *Name:* ${name}\n📞 *Phone:* ${phone}\n🏠 *Address:* ${address}`;

        let whatsappLink = `https://wa.me/919561122963?text=${encodeURIComponent(message)}`;

        window.open(whatsappLink, "_blank");

        // Clear cart after order
        clearCart();
    };
}

// Function to clear the cart
function clearCart() {
    let transaction = db.transaction("cart", "readwrite");
    let store = transaction.objectStore("cart");
    let clearRequest = store.clear();

    clearRequest.onsuccess = function () {
        loadCart();
        updateCartCount();
        alert("Order placed! Your cart is now empty.");
        closeCheckoutPopup();
    };
}


function proceedToCheckout() {
    document.getElementById("checkout-popup").classList.remove("hidden");
}
