const API_URL = 'https://api.example.com';
let token = localStorage.getItem('token');
let refreshToken = localStorage.getItem('refreshToken');

document.addEventListener('DOMContentLoaded', () => {
    const registerPageBtn = document.getElementById('register-page');
    const loginPageBtn = document.getElementById('login-page');
    const contentPageBtn = document.getElementById('content-page');

    if (registerPageBtn) {
        registerPageBtn.addEventListener('click', () => {
            window.location.href = 'register.html';
        });
    }

    if (loginPageBtn) {
        loginPageBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    if (contentPageBtn) {
        contentPageBtn.addEventListener('click', () => {
            const token = localStorage.getItem('token');
            if (token) {
                window.location.href = 'content.html';
            } else {
                alert('Сначала войдите в систему!');
            }
        });
    }
});

// === Функция обновления токена ===
async function refreshAccessToken() {
    if (!refreshToken) return;

    const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
    });

    const data = await res.json();
    if (data.token) {
        token = data.token;
        localStorage.setItem('token', token);
    } else {
        logout();
    }
}


// === Проверка и обновление токена перед запросами ===
async function secureFetch(url, options = {}) {
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Добавляем заголовок Authorization
    options.headers = { 
        ...options.headers, 
        Authorization: `Bearer ${token}` 
    };

    let response = await fetch(url, options);

    // Если токен устарел, пробуем обновить и повторить запрос
    if (response.status === 401) {
        await refreshAccessToken();
        options.headers.Authorization = `Bearer ${token}`;
        response = await fetch(url, options);
    }

    return response;
}

// === Регистрация ===
document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;

            const res = await fetch(`${API_URL}/auth/register`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await res.json();
            alert(result.message || 'Регистрация успешна!');
        });
    }
});

// === Авторизация ===
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            const res = await fetch(`${API_URL}/auth/login`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await res.json();
            if (result.token && result.refresh_token) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('refreshToken', result.refresh_token);
                window.location.href = 'content.html';
            } else {
                alert('Ошибка авторизации');
            }
        });
    }
});

// === Выход ===
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = 'login.html';
}

// === Загрузка контента ===
document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname.includes('content.html')) {
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const dataList = document.getElementById('data-list');
        const imagesContainer = document.getElementById('images-container');

        // Загрузка данных
        const resData = await secureFetch(`${API_URL}/items`);
        const data = await resData.json();

        dataList.innerHTML = '';
        data.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.name;
            dataList.appendChild(li);
        });

        // Загрузка изображений
        const resImages = await secureFetch(`${API_URL}/images`);
        const images = await resImages.json();

        imagesContainer.innerHTML = '';
        images.forEach(img => {
            const imgElement = document.createElement('img');
            imgElement.src = img.url; 
            imgElement.alt = img.description || 'Image';
            imgElement.classList.add('image');
            imagesContainer.appendChild(imgElement);
        });
    }
});
