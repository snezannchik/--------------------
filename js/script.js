// Функция для авторизации
const authenticate = async () => {
    const username = document.querySelector('input[name="username"]').value.trim();
    const password = document.querySelector('input[name="password"]').value.trim();
    const errorMessage = document.querySelector('.error-message');

    // Скрываем предыдущее сообщение об ошибке
    errorMessage.style.display = 'none';
    
    // Валидация полей ввода
    if (!username) {
        showError('Пожалуйста, введите логин.');
        return;
    }

    // Валидация логина
    if (username.length < 5) {
        showError('Логин должен содержать не менее 5 символов.');
        document.querySelector('input[name="username"]').classList.add('invalid');
        return;
    }

    // Проверка на наличие цифр и пробелов в логине
    if (/[^a-zA-Z]/.test(username)) {
        showError('Логин может содержать только буквы.');
        document.querySelector('input[name="username"]').classList.add('invalid');
        return;
    }

    if (!password) {
        showError('Пожалуйста, введите пароль.');
        return;
    }

    if (password.length < 3) {
        showError('Пароль должен содержать не менее 3 символов.');
        return;
    }

    try {
        // Запрос на сервер для проверки логина и пароля
        const response = await fetch('/db/db.json');
        if (!response.ok) {
            throw new Error('Ошибка загрузки JSON файла');
        }

        const data = await response.json();
        
        // Находим пользователя по логину и паролю
        const adminUser = data.users.find(user => user.login === username && user.password === password);
        
        if (adminUser) {
            localStorage.setItem('authenticated', 'true');

            document.querySelector('.main').style.display = 'none';
            document.getElementById('admin-content').style.display = 'block';

            const firstItem = document.querySelector('#navigation li');
            if (firstItem) {
                setActive(firstItem); 
            }
        } else {
            showError('Неверный логин или пароль.');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showError('Произошла ошибка при авторизации. Пожалуйста, попробуйте позже.');
    }
};

// Функция для отображения сообщений об ошибках
const showError = (message) => {
    const errorMessage = document.querySelector('.error-message');
    errorMessage.textContent = message;
    const errorM = document.querySelector('.login-form');
    errorM.style.paddingTop = '0px';
    errorMessage.style.display = 'block';
};

// Привязка события к форме авторизации
document.getElementById('authForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Отменяем стандартное поведение формы
    authenticate(); // Вызываем функцию авторизации
});

// устанавливает активный элемент навигации и позиционирует линию под ним
const setActive = (element) => {
    const items = document.querySelectorAll('#navigation li');
    items.forEach(item => item.classList.remove('active'));

    element.classList.add('active');

    const rect = element.getBoundingClientRect();
    const underline = document.querySelector('.underline');
    underline.style.width = `${rect.width}px`;
    underline.style.left = `${rect.left - document.getElementById('navigation').getBoundingClientRect().left}px`; // Позиционируем линию
};

// сбрасывает данные авторизации и переключает видимость админского контента
const logout = () => {
    // Удаляем данные авторизации из localStorage
    localStorage.removeItem('authenticated');

    // Показываем форму входа и скрываем админский контент
    document.querySelector('.main').style.display = 'block';
    document.getElementById('admin-content').style.display = 'none';

    const usernameInput = document.querySelector('input[name="username"]');
    const passwordInput = document.querySelector('input[name="password"]');

    if (usernameInput) {
        usernameInput.value = ''; 
    }

    if (passwordInput) {
        passwordInput.value = '';
    }

    const items = document.querySelectorAll('#navigation li');
    items.forEach(item => item.classList.remove('active'));

    const underline = document.querySelector('.underline');
    underline.style.width = '0';
    underline.style.left = '0';
};

// переключает видимые разделы контента
const showSection = (sectionId, element) => {
    // Переключаем видимые разделы
    const sections = document.querySelectorAll('.tab-content');
    sections.forEach(section => section.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';

    // Устанавливаем активный элемент и обновляем линию
    setActive(element);
};

// Проверка авторизации при загрузке страницы
window.addEventListener('load', () => {
    const isAuthenticated = localStorage.getItem('authenticated');
    
    if (isAuthenticated === 'true') {
        document.querySelector('.main').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
    } else {
        document.querySelector('.main').style.display = 'block';
        document.getElementById('admin-content').style.display = 'none';
    }

    const activeItem = document.querySelector('#navigation li.active');
    if (activeItem) {
        setActive(activeItem);
    }
});

// Загружаем данные для таблицы скидок и поведения пользователей
function loadJSONData() {
    const storedDiscountTableData = localStorage.getItem('discountTableData');
    if (storedDiscountTableData) {
        // Используем данные из LocalStorage
        let data = JSON.parse(storedDiscountTableData);

        // Проверяем, есть ли productActions в данных из LocalStorage
        if (!data.productActions) {
            // Если productActions отсутствует, загружаем данные из JSON для его добавления
            fetch('/db/db.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Ошибка загрузки JSON файла');
                    }
                    return response.json();
                })
                .then(jsonData => {
                    // Добавляем productActions и другие отсутствующие данные к data из LocalStorage
                    data = { ...jsonData, ...data };

                    // Рендерим таблицы с обновленными данными и сохраняем обратно в LocalStorage
                    renderDiscountTable(data);
                    renderUserBehaviorTable(data);
                    localStorage.setItem('discountTableData', JSON.stringify(data));
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                });
        } else {
            // Если productActions присутствует, рендерим обе таблицы
            renderDiscountTable(data);
            renderUserBehaviorTable(data);
        }
    } else {
        // Загружаем данные из JSON, если LocalStorage пустой
        fetch('/db/db.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка загрузки JSON файла');
                }
                return response.json();
            })
            .then(data => {
                renderDiscountTable(data); // Рендерим таблицу скидок
                renderUserBehaviorTable(data); // Рендерим таблицу поведения пользователей
                
                // Сохраняем данные в LocalStorage
                localStorage.setItem('discountTableData', JSON.stringify(data));
            })
            .catch(error => {
                console.error('Ошибка:', error);
            });
    }
}



// Функция рендеринга таблицы скидок
function renderDiscountTable(data) {
    const tableBody = document.querySelector('.discount-table tbody');
    tableBody.innerHTML = ''; 

    data.customers.forEach(customer => {
        const discount = data.discounts.find(d => d.discountId === customer.discountId);
        const discountPercentage = discount ? `${discount.percentage}%` : '0%';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.lastName} ${customer.firstName} ${customer.middleName}</td>
            <td>${customer.order_count || 0}</td>
            <td>${discountPercentage}</td>
        `;
        tableBody.appendChild(row);
    });
}
function renderUserBehaviorTable(data) {
    const tableBody = document.querySelector('#behavior .discount-table tbody');
    tableBody.innerHTML = ''; // Очистить перед добавлением

    data.productActions.forEach(action => {
        const product = data.products.find(p => p.productId === action.productId);
        const customer = data.customers.find(c => c.customerId === action.customerId);

        // Проверяем наличие необходимых данных
        if (product && customer) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.lastName} ${customer.firstName} ${customer.middleName}</td>
                <td>${action.actionType === 'view' ? 'Просмотр' : action.actionType === 'add_to_cart' ? 'Добавлено в корзину' : 'Заказ'}</td>
                <td>${product.productName}</td>
                <td>${new Date(action.actionDate).toLocaleDateString()}</td>
            `;
            tableBody.appendChild(row);
        }
    });
}

// сохраняем настройку скидки
function saveDiscountSettings() {
    const orderThreshold = parseInt(document.getElementById('order-threshold').value);
    const discountPercentage = parseInt(document.getElementById('discount-percentage').value);
    const discountStart = document.getElementById('discount-start').value;
    const discountEnd = document.getElementById('discount-end').value;

    // проверка на корректность
    if (isNaN(orderThreshold) || isNaN(discountPercentage) || !discountStart || !discountEnd) {
        console.error('Некорректные данные для сохранения.');
        return;
    }

    // сохраняем в локал
    const discountSettings = {
        orderThreshold: orderThreshold,
        discountPercentage: discountPercentage,
        discountStart: discountStart,
        discountEnd: discountEnd
    };
    localStorage.setItem('discountSettings', JSON.stringify(discountSettings));

    // Применяем скидки и обновляем таблицу
    fetch('/db/db.json')
        .then(response => response.json())
        .then(data => {
            const updatedCustomers = data.customers.map(customer => {
                const discount = data.discounts.find(d => d.discountId === customer.discountId);
                if (customer.order_count >= orderThreshold) {
                    if (discount) {
                        discount.percentage = discountPercentage;
                    }
                } else {
                    if (discount) {
                        discount.percentage = 0;
                    }
                }
                return customer;
            });

            const updatedData = { customers: updatedCustomers, discounts: data.discounts };
            renderDiscountTable(updatedData);

            // Сохраняем обновлённые данные таблицы в localStorage
            localStorage.setItem('discountTableData', JSON.stringify(updatedData));
        })
        .catch(error => console.error('Ошибка:', error));
}

// Загружаем наши настройки скидки
window.addEventListener('load', () => {
    const savedSettings = localStorage.getItem('discountSettings');
    if (savedSettings) {
        const discountSettings = JSON.parse(savedSettings);
        document.getElementById('order-threshold').value = discountSettings.orderThreshold;
        document.getElementById('discount-percentage').value = discountSettings.discountPercentage;
        document.getElementById('discount-start').value = discountSettings.discountStart;
        document.getElementById('discount-end').value = discountSettings.discountEnd;
        
        console.log('Загружено из localStorage:', discountSettings);
    }
});

document.addEventListener('DOMContentLoaded', loadJSONData);

