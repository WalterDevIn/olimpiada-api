let currentToken = '';

async function testLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const resultDiv = document.getElementById('loginResult');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                username: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('authToken').value = 'Session Cookie (Active)';
            resultDiv.className = 'result success';
            resultDiv.textContent = `✅ Login successful!\nUser: ${data.name}\nEmail: ${data.email}\nSession: Active`;
        } else {
            resultDiv.className = 'result error';
            resultDiv.textContent = `❌ Login failed: ${data.message || 'Unknown error'}`;
        }
    } catch (error) {
        resultDiv.className = 'result error';
        resultDiv.textContent = `❌ Network error: ${error.message}`;
    }
}

async function testGetServices() {
    const resultDiv = document.getElementById('servicesResult');

    try {
        const response = await fetch('/api/services');
        const data = await response.json();

        if (response.ok) {
            resultDiv.className = 'result success';
            resultDiv.textContent = `✅ Services retrieved successfully:\n${JSON.stringify(data, null, 2)}`;
        } else {
            resultDiv.className = 'result error';
            resultDiv.textContent = `❌ Failed: ${data.message || 'Unknown error'}`;
        }
    } catch (error) {
        resultDiv.className = 'result error';
        resultDiv.textContent = `❌ Network error: ${error.message}`;
    }
}

async function testGetCart() {
    const resultDiv = document.getElementById('cartResult');

    try {
        // Use session-based authentication instead of Bearer token
        const response = await fetch('/api/cart', {
            credentials: 'include'  // Include session cookies
        });
        const data = await response.json();

        if (response.ok) {
            resultDiv.className = 'result success';
            resultDiv.textContent = `✅ Cart retrieved successfully:\n${JSON.stringify(data, null, 2)}`;
        } else {
            resultDiv.className = 'result error';
            resultDiv.textContent = `❌ Failed: ${data.message || 'Unknown error'}`;
        }
    } catch (error) {
        resultDiv.className = 'result error';
        resultDiv.textContent = `❌ Network error: ${error.message}`;
    }
}

async function testAddToCart() {
    const resultDiv = document.getElementById('addCartResult');
    const serviceId = document.getElementById('serviceId').value;
    const quantity = document.getElementById('quantity').value;

    try {
        // First ensure cart exists
        await fetch('/api/cart', {
            method: 'POST',
            credentials: 'include'
        });

        // Then add item
        const response = await fetch('/api/cart/item', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                serviceId: parseInt(serviceId),
                quantity: parseInt(quantity)
            })
        });
        const data = await response.json();

        if (response.ok) {
            resultDiv.className = 'result success';
            resultDiv.textContent = `✅ Item added to cart successfully:\n${JSON.stringify(data, null, 2)}`;
        } else {
            resultDiv.className = 'result error';
            resultDiv.textContent = `❌ Failed: ${data.message || 'Unknown error'}`;
        }
    } catch (error) {
        resultDiv.className = 'result error';
        resultDiv.textContent = `❌ Network error: ${error.message}`;
    }
}

async function testConfirmOrder() {
    const resultDiv = document.getElementById('orderResult');

    try {
        const response = await fetch('/api/cart/confirm', {
            method: 'POST',
            credentials: 'include'
        });
        const data = await response.json();

        if (response.ok) {
            resultDiv.className = 'result success';
            resultDiv.textContent = `✅ Order confirmed successfully:\n${JSON.stringify(data, null, 2)}`;
        } else {
            resultDiv.className = 'result error';
            resultDiv.textContent = `❌ Failed: ${data.message || 'Unknown error'}`;
        }
    } catch (error) {
        resultDiv.className = 'result error';
        resultDiv.textContent = `❌ Network error: ${error.message}`;
    }
}

document.querySelector("#loginButton").addEventListener("click", testLogin);
document.querySelector("#servicesButton").addEventListener("click", testGetServices);
document.querySelector("#cartButton").addEventListener("click", testGetCart);
document.querySelector("#addCartButton").addEventListener("click", testAddToCart);
document.querySelector("#orderButton").addEventListener("click", testConfirmOrder);