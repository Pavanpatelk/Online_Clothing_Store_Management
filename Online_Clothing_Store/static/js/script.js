
document.addEventListener('DOMContentLoaded', function () {
    // Update cart count on all pages
    updateCartCount();

    // Initialize tooltips
    initTooltips();

    // Initialize form validation
    initFormValidation();

    // Initialize quantity controls
    initQuantityControls();

    // Initialize search functionality
    initSearch();
});

// Update cart count from server
function updateCartCount() {
    if (document.getElementById('cartCount')) {
        fetch('/api/cart_count')
            .then(response => response.json())
            .then(data => {
                const cartCount = document.getElementById('cartCount');
                if (cartCount) {
                    cartCount.textContent = data.count;

                    // Add animation if count changes
                    if (parseInt(cartCount.textContent) > 0) {
                        cartCount.classList.add('animate__animated', 'animate__bounce');
                        setTimeout(() => {
                            cartCount.classList.remove('animate__animated', 'animate__bounce');
                        }, 1000);
                    }
                }
            })
            .catch(error => console.error('Error fetching cart count:', error));
    }
}

// Initialize Bootstrap tooltips
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Form validation
function initFormValidation() {
    // Example: Custom validation for registration form
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function (e) {
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirm_password');

            if (password.value !== confirmPassword.value) {
                e.preventDefault();
                alert('Passwords do not match!');
                confirmPassword.focus();
                confirmPassword.classList.add('is-invalid');
            }
        });
    }
}

// Quantity controls for cart items
function initQuantityControls() {
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', function () {
            const min = parseInt(this.getAttribute('min'));
            const max = parseInt(this.getAttribute('max'));
            let value = parseInt(this.value);

            if (isNaN(value) || value < min) {
                this.value = min;
            } else if (value > max) {
                this.value = max;
            }

            // Update total if on cart page
            if (this.closest('.cart-item')) {
                updateItemTotal(this);
            }
        });
    });
}

// Update individual item total in cart
function updateItemTotal(inputElement) {
    const row = inputElement.closest('.row');
    const price = parseFloat(row.querySelector('.item-price').textContent.replace('rs ', ''));
    const quantity = parseInt(inputElement.value);
    const totalElement = row.querySelector('.item-total');

    if (totalElement) {
        const total = price * quantity;
        totalElement.textContent = `rs ${total.toFixed(2)}`;
        updateCartTotal();
    }
}

// Update cart total
function updateCartTotal() {
    let total = 0;
    document.querySelectorAll('.item-total').forEach(element => {
        total += parseFloat(element.textContent.replace('rs ', ''));
    });

    const totalElement = document.querySelector('.cart-total');
    if (totalElement) {
        totalElement.textContent = `rs ${total.toFixed(2)}`;
    }
}

// Search functionality
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            const productCards = document.querySelectorAll('.product-card');

            productCards.forEach(card => {
                const title = card.querySelector('.card-title').textContent.toLowerCase();
                const description = card.querySelector('.card-text').textContent.toLowerCase();

                if (title.includes(searchTerm) || description.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

// Add to cart with AJAX
function addToCart(productId, quantity = 1) {
    const formData = new FormData();
    formData.append('product_id', productId);
    formData.append('quantity', quantity);

    fetch('/add_to_cart', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateCartCount();
                showToast('Product added to cart!', 'success');
            } else {
                showToast(data.message || 'Error adding to cart', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Network error occurred', 'error');
        });
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    // Add to container
    const container = document.getElementById('toastContainer') || createToastContainer();
    container.appendChild(toast);

    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Remove toast after it hides
    toast.addEventListener('hidden.bs.toast', function () {
        toast.remove();
    });
}

// Create toast container if it doesn't exist
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
}

// Filter products by category
function filterProducts(category) {
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        if (category === 'all' || product.dataset.category === category) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

// Sort products
function sortProducts(sortBy) {
    const container = document.querySelector('.products-grid');
    const products = Array.from(container.querySelectorAll('.product-card'));

    products.sort((a, b) => {
        const priceA = parseFloat(a.querySelector('.product-price').textContent.replace('rs ', ''));
        const priceB = parseFloat(b.querySelector('.product-price').textContent.replace('rs ', ''));

        switch (sortBy) {
            case 'price-low':
                return priceA - priceB;
            case 'price-high':
                return priceB - priceA;
            case 'name':
                const nameA = a.querySelector('.product-name').textContent.toLowerCase();
                const nameB = b.querySelector('.product-name').textContent.toLowerCase();
                return nameA.localeCompare(nameB);
            default:
                return 0;
        }
    });

    // Re-append sorted products
    products.forEach(product => container.appendChild(product));
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Calculate discounted price
function calculateDiscountedPrice(price, discount) {
    if (discount > 0) {
        return price * (1 - discount / 100);
    }
    return price;
}

// Update stock status
function updateStockStatus(stock) {
    if (stock > 10) {
        return { text: 'In Stock', class: 'text-success' };
    } else if (stock > 0) {
        return { text: 'Low Stock', class: 'text-warning' };
    } else {
        return { text: 'Out of Stock', class: 'text-danger' };
    }
}

// Smooth scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add scroll to top button
function addScrollToTopButton() {
    const button = document.createElement('button');
    button.id = 'scrollToTop';
    button.className = 'btn btn-primary rounded-circle';
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '1000';
    button.style.display = 'none';

    button.addEventListener('click', scrollToTop);
    document.body.appendChild(button);

    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 300) {
            button.style.display = 'block';
        } else {
            button.style.display = 'none';
        }
    });
}

// Initialize scroll to top button
addScrollToTopButton();

// Product image lazy loading
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}
function validateExpiryDate() {
    const expiryInput = document.getElementById("expiry_date");
    const error = document.getElementById("expiryError");
    const value = expiryInput.value.trim();

    // Format check MM/YY
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regex.test(value)) {
        error.textContent = "Invalid format. Use MM/YY";
        return false;
    }

    const [month, year] = value.split("/").map(Number);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear() % 100; // last 2 digits

    // Expired card check
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        error.textContent = "Card has expired";
        return false;
    }

    error.textContent = "";
    return true;
}


// Add these functions to script.js

// Payment system initialization
function initPaymentSystem() {
    const paymentMethods = document.querySelectorAll('.payment-method');
    const processPaymentBtn = document.getElementById('process-payment-btn');

    if (paymentMethods.length > 0 && processPaymentBtn) {
        // Show/hide payment input fields based on method
        paymentMethods.forEach(method => {
            method.addEventListener('change', function () {
                const paymentType = this.dataset.type;
                showPaymentInputs(paymentType);
            });
        });

        // Card number formatting
        const cardNumberInput = document.getElementById('card_number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', formatCardNumber);
        }

        // Expiry date formatting
        const expiryInput = document.getElementById('expiry_date');
        if (expiryInput) {
            expiryInput.addEventListener('input', formatExpiryDate);
        }

        // Process payment button
        processPaymentBtn.addEventListener('click', processPayment);

        // Continue after payment success
        const continueBtn = document.getElementById('continue-after-payment');
        if (continueBtn) {
            continueBtn.addEventListener('click', submitOrderForm);
        }
    }
}

// Show appropriate payment inputs
function showPaymentInputs(paymentType) {
    // Hide all payment input sections
    document.querySelectorAll('.payment-inputs').forEach(section => {
        section.style.display = 'none';
    });

    // Show only the relevant section
    switch (paymentType) {
        case 'card':
            document.getElementById('card-details').style.display = 'block';
            // Make card fields optional
            document.querySelectorAll('.card-input').forEach(input => {
                input.required = true;
            });
            document.querySelectorAll('.upi-input').forEach(input => {
                input.required = false;
            });
            break;
        case 'upi':
            document.getElementById('upi-details').style.display = 'block';
            // Make UPI field optional
            document.querySelectorAll('.upi-input').forEach(input => {
                input.required = true;
            });
            document.querySelectorAll('.card-input').forEach(input => {
                input.required = false;
            });
            break;
        case 'netbanking':
            document.getElementById('netbanking-details').style.display = 'block';
            // Make bank field optional
            document.querySelectorAll('.card-input').forEach(input => {
                input.required = false;
            });
            document.querySelectorAll('.upi-input').forEach(input => {
                input.required = false;
            });
            break;
        case 'cod':
            // No inputs needed for COD
            document.querySelectorAll('.card-input, .upi-input').forEach(input => {
                input.required = false;
            });
            break;
    }
}

// Format card number with spaces
function formatCardNumber(e) {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formatted = '';

    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formatted += ' ';
        }
        formatted += value[i];
    }

    e.target.value = formatted.substring(0, 19);
}

// Format expiry date
function formatExpiryDate(e) {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');

    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }

    e.target.value = value.substring(0, 5);
}

// Process payment with fake/demo logic
function processPayment() {
    // Get selected payment method

    const addressField = document.getElementById('shipping_address');
    if (!addressField || addressField.value.trim() === "") {
        showToast('Please enter shipping address before payment', 'error');
        return;
    }

    const selectedMethod = document.querySelector('.payment-method:checked');
    if (!selectedMethod) {
        showToast('Please select a payment method', 'error');
        return;
    }

    const paymentType = selectedMethod.dataset.type;
    const paymentMethod = selectedMethod.value;

    // Validate inputs based on payment method
    if (!validatePaymentInputs(paymentType)) {
        return;
    }

    // Show processing modal
    const processingModal = new bootstrap.Modal(document.getElementById('paymentProcessingModal'));
    processingModal.show();

    // Simulate payment processing with 3-second delay
    simulatePaymentProcessing(paymentMethod);
}

// Validate payment inputs
function validatePaymentInputs(paymentType) {
    switch (paymentType) {
        case 'card':
            const cardNumber = document.getElementById('card_number').value.replace(/\s+/g, '');
            const expiryDate = document.getElementById('expiry_date').value;
            const cvv = document.getElementById('cvv').value;

            if (!cardNumber || cardNumber.length !== 16) {
                showToast('Please enter a valid 16-digit card number', 'error');
                return false;
            }

            if (!expiryDate || expiryDate.length !== 5) {
                showToast('Please enter a valid expiry date (MM/YY)', 'error');
                return false;
            }

            // Check if month is valid (01-12)
            const parts = expiryDate.split('/');
            const month = parseInt(parts[0], 10);
            if (month < 1 || month > 12) {
                showToast('mm not valid', 'error');
                return false;
            }

            // Check if year is valid (must be current year or future)
            const year = parseInt(parts[1], 10);
            const currentYear = new Date().getFullYear() % 100;
            
            if (year < currentYear) {
                showToast('year not valid', 'error');
                return false;
            }

            if (!cvv || cvv.length !== 3) {
                showToast('Please enter a valid 3-digit CVV', 'error');
                return false;
            }
            break;

        case 'upi':
            const upiId = document.getElementById('upi_id').value;
            if (!upiId || !upiId.includes('@')) {
                showToast('Please enter a valid UPI ID', 'error');
                return false;
            }
            break;

        case 'netbanking':
            const bankName = document.getElementById('bank_name').value;
            if (!bankName) {
                showToast('Please select a bank', 'error');
                return false;
            }
            break;
    }

    return true;
}

// Simulate payment processing
function simulatePaymentProcessing(paymentMethod) {
    const progressBar = document.querySelector('.progress-bar');
    const statusText = document.getElementById('payment-status');

    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressBar.style.width = progress + '%';

        // Update status messages
        if (progress < 30) {
            statusText.textContent = 'Connecting to payment gateway...';
        } else if (progress < 60) {
            statusText.textContent = 'Processing payment details...';
        } else if (progress < 90) {
            statusText.textContent = 'Verifying transaction...';
        } else {
            statusText.textContent = 'Completing transaction...';
        }

        if (progress >= 100) {
            clearInterval(interval);
            completePayment(paymentMethod);
        }
    }, 300); // 3 seconds total
}

// Complete payment and show success
function completePayment(paymentMethod) {
    // Hide processing modal
    const processingModal = bootstrap.Modal.getInstance(document.getElementById('paymentProcessingModal'));
    processingModal.hide();

    // Show success modal after a short delay
    setTimeout(() => {
        const successModal = new bootstrap.Modal(document.getElementById('paymentSuccessModal'));
        successModal.show();

        // Log fake payment details (for demo)
        console.log('Fake Payment Details:', {
            method: paymentMethod,
            amount: document.querySelector('.cart-total')?.textContent || 'rs 0.00',
            timestamp: new Date().toISOString(),
            transactionId: 'DEMO-' + Date.now(),
            status: 'SUCCESS'
        });
    }, 500);
}

// Submit order form after successful payment
function submitOrderForm() {
    // Hide success modal
    const successModal = bootstrap.Modal.getInstance(document.getElementById('paymentSuccessModal'));
    successModal.hide();

    // Submit the actual form
    document.querySelector('form').submit();
}

// Initialize payment system when DOM loads
document.addEventListener('DOMContentLoaded', function () {
    // ... existing code ...

    // Initialize payment system
    initPaymentSystem();

    // Initialize default payment inputs
    showPaymentInputs('card');
});

// Add demo payment helper
function fillDemoPayment() {
    const selectedMethod = document.querySelector('.payment-method:checked');
    if (selectedMethod && selectedMethod.dataset.type === 'card') {
        document.getElementById('card_number').value = '4111 1111 1111 1111';
        document.getElementById('expiry_date').value = '12/30';
        document.getElementById('cvv').value = '123';
    } else if (selectedMethod && selectedMethod.dataset.type === 'upi') {
        document.getElementById('upi_id').value = 'demo@upi';
    }
}

// Add demo payment button (optional)
function addDemoPaymentButton() {
    const paymentSection = document.querySelector('#payment-details');
    if (paymentSection) {
        const demoButton = document.createElement('button');
        demoButton.type = 'button';
        demoButton.className = 'btn btn-outline-secondary btn-sm mb-3';
        demoButton.innerHTML = '<i class="fas fa-magic"></i> Fill Demo Details';
        demoButton.onclick = fillDemoPayment;
        paymentSection.parentNode.insertBefore(demoButton, paymentSection);
    }
}

// Initialize lazy loading if needed
initLazyLoading();

// Image Zoom Initialization (Lightbox)
function initImageZoom() {
    const images = document.querySelectorAll('.zoomable-image');
    console.log(`Found ${images.length} zoomable images.`); // DEBUG
    
    images.forEach(img => {
        img.addEventListener('click', function(e) {
            console.log('Image clicked, opening zoom overlay...'); // DEBUG
            e.preventDefault(); // Prevent default if wrapped in link
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'image-zoom-overlay';
            // Use high-res image if available, otherwise current source
            overlay.innerHTML = `<img src="${this.src}" alt="${this.alt}">`;
            
            document.body.appendChild(overlay);
            
            // Animate in
            requestAnimationFrame(() => {
                overlay.classList.add('active');
            });
            
            // Disable scroll
            document.body.style.overflow = 'hidden';
            
            // Close logic
            overlay.addEventListener('click', function() {
                this.classList.remove('active');
                document.body.style.overflow = '';
                
                // Remove from DOM after animation matches CSS duration
                setTimeout(() => {
                    this.remove();
                }, 300);
            });
        });
    });
}

// Initialize zoom when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initImageZoom();
});

// Product Gallery
function changeMainImage(src) {
    const mainImage = document.querySelector('.zoomable-image');
    if (mainImage) {
        // Fade out
        mainImage.style.opacity = '0.5';
        
        setTimeout(() => {
            mainImage.src = src;
            // Fade in
            mainImage.style.opacity = '1';
        }, 200);
    }
}