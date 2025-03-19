const API_URL = 'http://127.0.0.1:5000';
let token = localStorage.getItem('token');
let refreshToken = localStorage.getItem('refreshToken');


// Обновление токена доступа 
async function refreshaccess_token() {
    if (!refreshToken) return;

    const res = await fetch(`${API_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: refreshToken })
    });

    const data = await res.json();
    if (data.access_token) {
        token = data.access_token;
        refreshToken = data.refresh_token;
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
    } else {
        logout();
    }
}

// Безопасный запрос с проверкой токена
async function secureFetch(url, options = {}) {
    if (!token) {
        window.location.href = 'login.html'; 
        return;
    }

    // Добавляем заголовок Authorization с токеном
    options.headers = { 
        ...options.headers, 
        Authorization: `Bearer ${token}` 
    };

    let response = await fetch(url, options);

    // Если токен устарел, обновляем его и повторяем запрос
    if (response.status === 401) {
        await refreshaccess_token();
        options.headers.Authorization = `Bearer ${token}`;
        response = await fetch(url, options);
    }

    return response;
}

// Регистрация нового пользователя
document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;

            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const res = await fetch(`${API_URL}/register`, { 
                method: 'POST',
                body: formData
            });

            const result = await res.json();
            alert(result.message || 'Регистрация успешна!');
        });
    }
});

// Авторизация пользователя
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const res = await fetch(`${API_URL}/login`, { 
                method: 'POST',
                body: formData
            });

            const result = await res.json();
            if (result.access_token && result.refresh_token) {
                localStorage.setItem('token', result.access_token);
                localStorage.setItem('refreshToken', result.refresh_token);
                window.location.href = 'content.html';
            } else {
                alert('Ошибка авторизации');
            }
        });
    }
});

// Выход пользователя
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = 'login.html';
}

// Получить список блогов
async function getBlogs(shift = 0, limit = 10) {
    if (!token) {
        alert('Необходимо авторизоваться!');
        return;
    }

    const response = await secureFetch(`${API_URL}/blogs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: token, shift, limit })
    });

    return response.json();
}

// Получить блог по ID
async function getBlog(blogId) {
    if (!token) {
        alert('Необходимо авторизоваться!');
        return;
    }

    const response = await secureFetch(`${API_URL}/get_blog`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: token, blog_id: blogId })
    });

    return response.json();
}

// Редактировать блог
async function editBlog(blogId, title, text) {
    if (!token) {
        alert('Необходимо авторизоваться!');
        return;
    }

    const response = await secureFetch(`${API_URL}/edit_blog`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: token, blog_id: blogId, title, text })
    });

    return response.json();
}

// Удалить блог
async function deleteBlog(blogId) {
    if (!token) {
        alert('Необходимо авторизоваться!');
        return;
    }

    const response = await secureFetch(`${API_URL}/delete_blog`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: token, blog_id: blogId }) 
    });

    return response.json();
}

// Добавить новый блог
async function addBlog(title, text) {
    if (!token) {
        alert('Необходимо авторизоваться!');
        return;
    }

    const response = await secureFetch(`${API_URL}/add_blog`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: token, title, text }) 
    });

    return response.json();
}

// Получить список сообщений для указанного блога
async function getMessages(blogId, shift = 0, limit = 10) {
    if (!token) {
        alert('Необходимо авторизоваться!');
        return;
    }

    const response = await secureFetch(`${API_URL}/get_messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: token, blog_id: blogId, shift, limit })
    });

    return response.json();
}

// Редактирование сообщения
async function editMessage(messageId, text) {
    return secureFetch(`${API_URL}/edit_message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            access_token: localStorage.getItem('token'),
            message_id: messageId,
            text: text
        })
    });
}

// Удаление сообщения
async function deleteMessage(messageId) {
    return secureFetch(`${API_URL}/delete_message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            access_token: localStorage.getItem('token'),
            message_id: messageId
        })
    });
}

// Добавление сообщения
async function addMessage(blogId, text) {
    return secureFetch(`${API_URL}/add_message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            access_token: localStorage.getItem('token'),
            blog_id: blogId,
            text: text
        })
    });
}

// Перенаправление на страницы
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('register-page')?.addEventListener('click', () => window.location.href = 'register.html');
    document.getElementById('login-page')?.addEventListener('click', () => window.location.href = 'login.html');
    document.getElementById('content-page')?.addEventListener('click', () => {
        const access_token = localStorage.getItem('token'); // Получаем токен из localStorage
        if (access_token) {
            window.location.href = 'content.html';
        } else {
            alert('Сначала войдите в систему!');
        }
    });
});

// Выход из аккаунта
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('logout-btn').addEventListener('click', logout);
});