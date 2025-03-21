document.addEventListener('DOMContentLoaded', () => {
    let blogs = [];
    let selectedBlogId = null;
    let selectedBlogs = [];

    // Функция для обновления таблицы с блогами
    async function updateBlogTable(shift = 0, limit = 10) {
        const blogsData = await getBlogs(shift, limit); // Запрашиваем блоги
        blogs = blogsData.blogs; // Сохраняем данные блогов
        const tableBody = document.getElementById('blogsTableBody');
        tableBody.innerHTML = ''; // Очищаем таблицу перед добавлением новых данных

        blogs.forEach(blog => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="blog-checkbox" data-id="${blog.id}"></td>
                <td>${blog.title}</td>
                <td>${blog.text}</td>
                <td>
                    <button class="view-btn" data-id="${blog.id}">Посмотреть</button>
                    <button class="edit-btn" data-id="${blog.id}">Редактировать</button>
                    <button class="delete-btn" data-id="${blog.id}">Удалить</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Обработчики событий для кнопок редактирования, удаления и просмотра
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const blogId = button.getAttribute('data-id');
                selectedBlogId = blogId;  // Сохраняем выбранный блог
                await viewBlog(blogId);
            });
        });

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const blogId = button.getAttribute('data-id');
                selectedBlogId = blogId;  // Сохраняем выбранный блог
                await editBlogUI(blogId);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const blogId = button.getAttribute('data-id');
                await deleteBlog(blogId);
                updateBlogTable(); // Перезагружаем таблицу
            });
        });

        // Обработчик для выбора всех чекбоксов
        document.getElementById('selectAllBlogs').addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('.blog-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
                toggleSelectedBlog(checkbox, isChecked);
            });
        });

        // Обработчик для выбора отдельных чекбоксов
        document.querySelectorAll('.blog-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                toggleSelectedBlog(e.target);
            });
        });
    }

    // Функция для управления выбранными блогами
    function toggleSelectedBlog(checkbox, selectAll = false) {
        const blogId = checkbox.getAttribute('data-id');
        if (checkbox.checked) {
            selectedBlogs.push(blogId);
        } else {
            selectedBlogs = selectedBlogs.filter(id => id !== blogId);
        }

        // Включаем/выключаем кнопку удаления выбранных блогов
        document.getElementById('deleteBlogsBtn').disabled = selectedBlogs.length === 0;
        document.getElementById('getBlogBtn').disabled = selectedBlogs.length !== 1; // Включаем кнопку только для одного выбранного блога
        document.getElementById('editBlogBtn').disabled = selectedBlogs.length !== 1; // Включаем кнопку только для одного выбранного блога
    }

    // Обработчик для удаления выбранных блогов
    document.getElementById('deleteBlogsBtn').addEventListener('click', async () => {
        for (const blogId of selectedBlogs) {
            await deleteBlog(blogId);
        }
        selectedBlogs = []; // Очищаем список выбранных блогов
        updateBlogTable(); // Перезагружаем таблицу
    });


    // Обработчик для добавления нового блога
    document.getElementById('addBlogBtn').addEventListener('click', async () => {
        const title = prompt('Введите заголовок блога');
        const text = prompt('Введите текст блога');
        await addBlog(title, text);
        updateBlogTable(); // Перезагружаем таблицу
    });

    // Функция для отображения информации о блоге
    async function viewBlog(blogId) {
        const blog = await getBlog(blogId);
        document.getElementById('blogTitle').innerText = blog.title;
        document.getElementById('blogText').innerText = blog.text;

        document.getElementById('blogDetails').style.display = 'block';

        // Показать кнопки для работы с сообщениями
        document.getElementById('addMessageForm').classList.add('hidden');
        document.getElementById('editMessageForm').classList.add('hidden');
        document.getElementById('deleteMessageForm').classList.add('hidden');

        // Загружаем сообщения для выбранного блога
        loadMessages(blogId);
    }

    // Функция для редактирования блога
    async function editBlogUI(blogId) {
        // Получаем данные блога
        const blog = await getBlog(blogId);
        const title = prompt('Введите новый заголовок блога', blog.title);
        const text = prompt('Введите новый текст блога', blog.text);

        // Отправляем обновленные данные блога на сервер
        await editBlog(blogId, title, text);

        // Обновляем таблицу блога, без перезагрузки страницы
        updateBlogTable();
    }

    // Функция для отображения списка сообщений
    async function loadMessages(blogId) {
    const response = await getMessages(blogId); // Получаем данные от getMessages
    if (!response || response.message === 'Wrong blog_id!') {
        alert('Ошибка при получении сообщений: неверный ID блога');
        return;
    }

    const messages = response.messages; // Предполагаем, что сервер возвращает объект с массивом сообщений в поле 'messages'

    const messagesList = document.getElementById('messagesList');
    
    // Показать кнопки для добавления, редактирования и удаления
    document.getElementById('addMessageBtn').classList.remove('hidden');
    document.getElementById('editMessageBtn').classList.remove('hidden');
    document.getElementById('deleteMessageBtn').classList.remove('hidden');

    // Очищаем список сообщений
    messagesList.innerHTML = '';

    // Если сообщений нет, выводим соответствующее сообщение
    if (messages.length === 0) {
        messagesList.innerHTML = '<p>Сообщений нет.</p>';
        return;
    }

    // Создаём таблицу, если её нет
    let table = document.getElementById('messagesTable');
    if (!table) {
        table = document.createElement('table');
        table.id = 'messagesTable';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Выбрать</th>
                    <th>Сообщение</th>
                    <th>Пользователь</th>
                </tr>
            </thead>
            <tbody id="messagesTableBody"></tbody>
        `;
        messagesList.appendChild(table);
    }

    const messagesTableBody = document.getElementById('messagesTableBody');
    messagesTableBody.innerHTML = ''; // Очищаем старые данные

    // Заполняем таблицу данными
    messages.forEach(message => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="message-checkbox" data-id="${message.id}"></td>
            <td>${message.text}</td>
            <td>${message.username || 'Неизвестно'}</td>
        `;
        messagesTableBody.appendChild(row);
    });
}


    // Функция для добавления нового сообщения
    document.getElementById('addMessageBtn').addEventListener('click', async () => {
        // Скрыть формы редактирования и удаления
        document.getElementById('editMessageForm').classList.add('hidden');
        document.getElementById('deleteMessageForm').classList.add('hidden');
        
        // Показать форму добавления нового сообщения
        document.getElementById('addMessageForm').classList.remove('hidden');

        document.getElementById('addMessageBtn2').addEventListener('click', async () => {
        const text = document.getElementById('newMessageText').value; // Получаем текст из поля
        if (!text) {

            return;
        }
        
        // Отправить запрос на добавление сообщения
        await addMessage(selectedBlogId, text);
        
        // После добавления перезагружаем список сообщений
        loadMessages(selectedBlogId);
        });
    });

    // Функция для редактирования выбранного сообщения через чекбоксы
    document.getElementById('editMessageBtn').addEventListener('click', async () => {
        // Скрыть формы добавления и удаления
        document.getElementById('addMessageForm').classList.add('hidden');
        document.getElementById('deleteMessageForm').classList.add('hidden');
        
        // Показать форму редактирования
        document.getElementById('editMessageForm').classList.remove('hidden');
        
        // Собираем выбранные чекбоксы
        const selectedCheckboxes = Array.from(document.querySelectorAll('.message-checkbox:checked'));
        if (selectedCheckboxes.length !== 1) {
            // Если выбрано не одно сообщение, не продолжаем
            return;
        }

        const editBtn = document.getElementById('editMessageBtn2');
        const newEditBtn = editBtn.cloneNode(true);
        editBtn.parentNode.replaceChild(newEditBtn, editBtn);

        newEditBtn.addEventListener('click', async () => {
            // Получаем id выбранного сообщения
            const messageId = selectedCheckboxes[0].getAttribute('data-id');
            const newText = document.getElementById('editMessageText').value;
            
            if (!newText) {
                // Если текст пустой, не отправляем запрос
                return;
            }

            // Отправить запрос на редактирование сообщения
            await editMessage(messageId, newText);

            // Сбрасываем чекбоксы после редактирования
            document.querySelectorAll('.message-checkbox').forEach(cb => cb.checked = false);
            
            // Перезагружаем список сообщений после редактирования
            loadMessages(selectedBlogId);
        })
        
    });

    // Функция для удаления выбранного сообщения через чекбоксы
    document.getElementById('deleteMessageBtn').addEventListener('click', async () => {
        // Скрыть формы добавления и редактирования
        document.getElementById('addMessageForm').classList.add('hidden');
        document.getElementById('editMessageForm').classList.add('hidden');
        
        // Собираем выбранные чекбоксы
        const selectedCheckboxes = Array.from(document.querySelectorAll('.message-checkbox:checked'));
        
        if (selectedCheckboxes.length !== 1) {
            // Если выбрано не одно сообщение, не продолжаем
            return;
        }

        // Получаем id выбранного сообщения
        const messageId = selectedCheckboxes[0].getAttribute('data-id');
        
        // Отправить запрос на удаление сообщения
        await deleteMessage(messageId);
        
        // Перезагружаем список сообщений после удаления
        loadMessages(selectedBlogId);
    });

    // Загружаем начальные блоги
    updateBlogTable();
});