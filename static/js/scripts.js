const API_URL = 'https://example.com';
let accessToken = localStorage.getItem('access_token');
let refreshToken = localStorage.getItem('refresh_token');

// === Перенаправление на страницы ===
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('register-page')?.addEventListener('click', () => window.location.href = 'register.html');
    document.getElementById('login-page')?.addEventListener('click', () => window.location.href = 'login.html');
    document.getElementById('content-page')?.addEventListener('click', () => {
        if (accessToken) {
            window.location.href = 'content.html';
        } else {
            alert('Сначала войдите в систему!');
        }
    });
});

// === Функция авторизации ===
async function loginUser(username, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            body: new URLSearchParams({ username, password }) // Отправка как form-data
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            accessToken = data.access_token;
            refreshToken = data.refresh_token;
            window.location.href = 'content.html';
        } else {
            alert('Ошибка авторизации: ' + (data.message || 'Попробуйте снова'));
        }
    } catch (error) {
        console.error('Ошибка запроса:', error);
    }
}

// === Функция обновления токена ===
async function refreshAccessToken() {
    if (!refreshToken) {
        logout();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('access_token', data.access_token);
            accessToken = data.access_token;
            return accessToken;
        } else {
            logout();
        }
    } catch (error) {
        console.error('Ошибка обновления токена:', error);
    }
}

// === Функция безопасного запроса с токеном ===
async function secureFetch(url, options = {}) {
    if (!accessToken) {
        window.location.href = 'login.html';
        return;
    }

    options.headers = { 
        ...options.headers, 
        Authorization: `Bearer ${accessToken}` 
    };

    let response = await fetch(url, options);

    if (response.status === 401) { // Если токен истек
        await refreshAccessToken();
        options.headers.Authorization = `Bearer ${accessToken}`;
        response = await fetch(url, options);
    }

    return response;
}

// === Регистрация ===
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('register-btn')?.addEventListener('click', async () => {
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            alert(data.message || 'Регистрация успешна!');
        } catch (error) {
            console.error('Ошибка регистрации:', error);
        }
    });
});

// === Авторизация ===
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-btn')?.addEventListener('click', async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        await loginUser(username, password);
    });
});

// === Выход из системы ===
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    accessToken = null;
    refreshToken = null;
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('logout-btn')?.addEventListener('click', logout);
});

// === Загрузка контента ===
document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname.includes('content.html')) {
        if (!accessToken) {
            window.location.href = 'login.html';
            return;
        }

        const dataList = document.getElementById('data-list');
        const imagesContainer = document.getElementById('images-container');

        try {
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
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
        }
    }
});
