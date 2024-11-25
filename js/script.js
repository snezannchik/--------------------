// Функция для авторизации
const authenticate = async () => {
    const usernameInput = document.querySelector('input[name="username"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const errorMessage = document.querySelector('.error-message');

    errorMessage.style.display = 'none'; 
    usernameInput.classList.remove('invalid'); 
    passwordInput.classList.remove('invalid'); 

    if (!username) {
        showError('Пожалуйста, введите логин.', usernameInput);
        return;
    }

    if (username.length < 5) {
        showError('Логин должен содержать не менее 5 символов.', usernameInput);
        return;
    }

    if (/[^a-zA-Z]/.test(username)) {
        showError('Логин может содержать только латинские буквы.', usernameInput);
        return;
    }

    if (!password) {
        showError('Пожалуйста, введите пароль.', passwordInput);
        return;
    }

    if (password.length < 3) {
        showError('Пароль должен содержать не менее 3 символов.', passwordInput);
        return;
    }

    try {
        const response = await fetch('/db/db.json');
        if (!response.ok) {
            throw new Error('Ошибка загрузки JSON файла');
        }

        const data = await response.json();
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
            showError('Неверный логин или пароль.', usernameInput, passwordInput); 
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showError('Произошла ошибка при авторизации. Пожалуйста, попробуйте позже.'); 
    }
};

const showError = (message, ...inputs) => {
    const errorMessage = document.querySelector('.error-message');
    errorMessage.textContent = message; 
    errorMessage.style.display = 'block';
    const errorM = document.querySelector('.login-form');
    errorM.style.paddingTop = '0px';
    
    inputs.forEach(input => {
        input.classList.add('invalid');
    });
};

document.getElementById('authForm').addEventListener('submit', function (event) {
    event.preventDefault(); 
    authenticate(); 
});

// Функция для установки активного элемента навигации
const setActive = (element) => {
    const items = document.querySelectorAll('#navigation li');
    items.forEach(item => item.classList.remove('active')); 

    element.classList.add('active');

    const rect = element.getBoundingClientRect();
    const underline = document.querySelector('.underline');
    underline.style.width = `${rect.width}px`; 
    underline.style.left = `${rect.left - document.getElementById('navigation').getBoundingClientRect().left}px`; 
};

// Функция для выхода из системы
const logout = () => {
    localStorage.removeItem('authenticated'); 

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

// Функция для показа секции по её ID
const showSection = (sectionId, element) => {
    const sections = document.querySelectorAll('.tab-content');
    sections.forEach(section => section.style.display = 'none'); 
    document.getElementById(sectionId).style.display = 'block';

    setActive(element); 
};

// Обработчик события загрузки страницы
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

function hideTimer() {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = ''; 
        timerElement.style.display = 'none'; 
    }
}
function showTimer() {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.style.display = 'block'; 
    }
}

// Функция сброса настроек скидок
function resetDiscountSettings() {
    document.getElementById('order-threshold').value = '';
    document.getElementById('discount-percentage').value = '';
    document.getElementById('discount-start').value = '';
    document.getElementById('discount-end').value = '';

    localStorage.removeItem('discountSettings');
    console.log('Настройки скидок сброшены.');

    hideTimer(); 

    fetch('/db/db.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузки JSON файла');
            }
            return response.json();
        })
        .then(data => {
            renderDiscountTable(data); 
            localStorage.setItem('discountTableData', JSON.stringify(data));
        })
        .catch(error => {
            console.error('Ошибка:', error);
        });
}

document.getElementById('resetDiscountSettings').addEventListener('click', resetDiscountSettings);

window.addEventListener('DOMContentLoaded', () => {
    const discountSettings = JSON.parse(localStorage.getItem('discountSettings'));

    if (discountSettings) {
        document.getElementById('order-threshold').value = discountSettings.orderThreshold || '';
        document.getElementById('discount-percentage').value = discountSettings.discountPercentage || '';
        document.getElementById('discount-start').value = discountSettings.startDate || '';
        document.getElementById('discount-end').value = discountSettings.endDate || '';
    }

    loadJSONData(); 
    checkDiscountExpiration(); 
});

// Функция для загрузки данных из JSON
function loadJSONData() {
    const storedDiscountTableData = localStorage.getItem('discountTableData');
    if (storedDiscountTableData) {
        let data = JSON.parse(storedDiscountTableData);

        if (!data.productActions) {
            fetch('/db/db.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Ошибка загрузки JSON файла');
                    }
                    return response.json();
                })
                .then(jsonData => {
                    data = { ...jsonData, ...data };

                    renderDiscountTable(data);
                    renderUserBehaviorTableWithPagination(data); 
                    localStorage.setItem('discountTableData', JSON.stringify(data)); 
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                });
        } else {
            renderDiscountTable(data);
            renderUserBehaviorTableWithPagination(data); 
        }
    } else {
        fetch('/db/db.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка загрузки JSON файла');
                }
                return response.json();
            })
            .then(data => {
                renderDiscountTable(data);
                renderUserBehaviorTableWithPagination(data); 

                localStorage.setItem('discountTableData', JSON.stringify(data)); 
            })
            .catch(error => {
                console.error('Ошибка:', error);
            });
    }
}

window.addEventListener('DOMContentLoaded', loadJSONData);

const recordsPerPage = 5;
let currentPage = 1;
let totalRecords = 0; 
// Функция для рендеринга таблицы с учетом пагинации
function renderDiscountTable(data) {
    const tableBody = document.querySelector('.discount-table tbody');
    tableBody.innerHTML = ''; 

    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;

    data.customers.slice(start, end).forEach(customer => {
        const discount = data.discounts.find(d => d.discountId === customer.discountId);
        const discountPercentage = discount ? `${discount.percentage}%` : '0%';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="customer-name">${customer.lastName} ${customer.firstName} ${customer.middleName}</td>
            <td>${customer.order_count || 0}</td>
            <td>${discountPercentage}</td>
        `;

        row.addEventListener('click', () => {
            showPersonalizedOffers(customer.customerId, data); 
        });

        tableBody.appendChild(row); 
    });

    totalRecords = data.customers.length;
    updatePaginationIcons();
}

// Функция для обновления иконок пагинации
function updatePaginationIcons() {
    const prevIcon = document.querySelector('.pagination .pagination-icon[alt="Назад"]');
    const nextIcon = document.querySelector('.pagination .pagination-icon[alt="Вперед"]');

    prevIcon.style.visibility = currentPage > 1 ? 'visible' : 'hidden';
    nextIcon.style.visibility = currentPage < Math.ceil(totalRecords / recordsPerPage) ? 'visible' : 'hidden';
}

document.querySelector('.pagination .pagination-icon[alt="Назад"]').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadJSONData(); 
    }
});

document.querySelector('.pagination .pagination-icon[alt="Вперед"]').addEventListener('click', () => {
    if (currentPage < Math.ceil(totalRecords / recordsPerPage)) {
        currentPage++;
        loadJSONData(); 
    }
});

window.addEventListener('DOMContentLoaded', loadJSONData);

// Функция для показа персонализированных предложений для клиента
function showPersonalizedOffers(customerId, data) {
    const customer = data.customers.find(c => c.customerId === customerId);
    if (!customer) {
        console.error("Клиент не найден");
        return;
    }

    const productActions = data.productActions.filter(action => action.customerId === customerId);
    const viewedProductIds = productActions.map(action => action.productId);
    const viewedProducts = data.products.filter(product => viewedProductIds.includes(product.productId));
    
    const categoryIds = [...new Set(viewedProducts.map(product => product.categoryId))]; 

    const personalizedProducts = data.products.filter(product => 
        categoryIds.includes(product.categoryId) && !viewedProductIds.includes(product.productId)
    );

    const persName = document.querySelector('.pers_name p:last-child');
    persName.textContent = `${customer.lastName} ${customer.firstName} ${customer.middleName}`;

    const persCardsContainer = document.querySelector('.pers_cards');
    persCardsContainer.innerHTML = ''; 

    personalizedProducts.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('third-section__cards-item', 'item');
        card.innerHTML = `
            <img class="item__im" src="${product.image}" alt="">
            <p class="item__txt txt">${product.productName}</p>
            <div class="item__price price">
                <p>${product.price} ₽</p>
            </div>
        `;
        persCardsContainer.appendChild(card);
    });

    document.getElementById('perspred').style.display = 'block'; 
    document.getElementById('perspred').scrollIntoView({ behavior: 'smooth' });
}

// Функция для сортировки таблицы
function sortTable(columnIndex) {
    const table = document.querySelector('#behavior .discount-table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    const isAscending = tbody.getAttribute('data-sort-order') === 'asc'; 
    tbody.setAttribute('data-sort-order', isAscending ? 'desc' : 'asc'); 

    rows.sort((rowA, rowB) => {
        const cellA = rowA.cells[columnIndex].innerText;
        const cellB = rowB.cells[columnIndex].innerText;

        if (columnIndex === 3) { 
            return isAscending ? new Date(cellA) - new Date(cellB) : new Date(cellB) - new Date(cellA);
        }

        return isAscending ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
    });

    tbody.innerHTML = ''; 
    rows.forEach(row => tbody.appendChild(row)); 
}

// Функция для фильтрации таблицы
function filterTable() {
    const filterValue = document.getElementById('actionTypeFilter').value;
    const table = document.querySelector('#behavior .discount-table');
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        const actionType = row.cells[1].innerText;
        row.style.display = (filterValue === "" || actionType === filterValue) ? "" : "none"; 
    });

    tbody.setAttribute('data-sort-order', 'asc'); 
}

const behaviorRecordsPerPage = 5;
let currentBehaviorPage = 1;
let totalBehaviorRecords = 0; 

// Функция для рендеринга таблицы поведения пользователей с учетом пагинации
function renderUserBehaviorTableWithPagination(data) {
    const tableBody = document.querySelector('#behavior .discount-table tbody');
    tableBody.innerHTML = ''; 

    const start = (currentBehaviorPage - 1) * behaviorRecordsPerPage;
    const end = start + behaviorRecordsPerPage;

    data.productActions.slice(start, end).forEach(action => {
        const product = data.products.find(p => p.productId === action.productId);
        const customer = data.customers.find(c => c.customerId === action.customerId);

        if (product && customer) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="customer-name-pov">${customer.lastName} ${customer.firstName} ${customer.middleName}</td>
                <td>${action.actionType === 'view' ? 'Просмотр' : action.actionType === 'add_to_cart' ? 'Добавлено в корзину' : 'Заказ'}</td>
                <td class="customer-tovar">
                    <span class="product-name" data-product-id="${product.productId}">${product.productName}</span>
                </td>
                <td>${new Date(action.actionDate).toLocaleDateString()}</td>
            `;
            tableBody.appendChild(row);
        }
    });

    totalBehaviorRecords = data.productActions.length;
    updateBehaviorPaginationIcons();

    // Добавляем обработчики событий для открытия окна
    document.querySelectorAll('.product-name').forEach(productName => {
        productName.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            openProductWindow(productId, data);
        });
    });
}

// Функция для открытия окна с карточкой товара
function openProductWindow(productId, data) {
    const product = data.products.find(p => p.productId == productId);
    if (!product) {
        console.error("Продукт не найден");
        return;
    }

    const popup = window.open('', '', 'width=350,height=400'); 

    popup.document.write(`
        <html>
            <head>
                <title>${product.productName}</title>
                <style>
                    body { font-family: Montserrat; padding: 20px; background-color: #171923;}
                    .product-card { background-color: #FBF2FF; padding: 20px; width: 250px; padding-right: 1px; border-radius: 15px;}
                    .product-card img { max-width: 100%; height: auto; border-radius: 5px; }
                    .product-card .product-name { font-size: 1.2em; margin: 20px 0; }
                    .product-card .price { font-family: Montserrat; font-weight: 400; color: #3C2648; font-size: 18px;}
                </style>
            </head>
            <body>
                <div class="product-card">
                    <img src="${product.image}" alt="${product.productName}">
                    <p class="product-name">${product.productName}</p>
                    <p class="price">${product.price} ₽</p>
                </div>
            </body>
        </html>
    `);

    popup.document.close();
}

// Функция для обновления иконок пагинации таблицы "Поведение пользователей"
function updateBehaviorPaginationIcons() {
    const prevIcon = document.querySelector('#behavior .pagination .pagination-icon[alt="Назад"]');
    const nextIcon = document.querySelector('#behavior .pagination .pagination-icon[alt="Вперед"]');

    prevIcon.style.visibility = currentBehaviorPage > 1 ? 'visible' : 'hidden';
    nextIcon.style.visibility = currentBehaviorPage < Math.ceil(totalBehaviorRecords / behaviorRecordsPerPage) ? 'visible' : 'hidden';
}

document.querySelector('#behavior .pagination .pagination-icon[alt="Назад"]').addEventListener('click', () => {
    if (currentBehaviorPage > 1) {
        currentBehaviorPage--;
        loadJSONData(); 
    }
});

document.querySelector('#behavior .pagination .pagination-icon[alt="Вперед"]').addEventListener('click', () => {
    if (currentBehaviorPage < Math.ceil(totalBehaviorRecords / behaviorRecordsPerPage)) {
        currentBehaviorPage++;
        loadJSONData(); 
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0]; 
    const discountStartInput = document.getElementById('discount-start');
    discountStartInput.setAttribute('min', today); 
    discountStartInput.setAttribute('max', today); 
    document.getElementById('discount-end').setAttribute('min', today); 
});

function checkDiscountExpiration() {
    const discountSettings = JSON.parse(localStorage.getItem('discountSettings'));

    if (discountSettings && discountSettings.endDate) {
        const currentDate = new Date();
        const endDate = new Date(discountSettings.endDate);

        if (currentDate > endDate) {
            localStorage.removeItem('discountSettings');
            console.log('Срок действия скидки истёк. Настройки скидок удалены.');
            resetDiscountSettings(); 
        }
    }
}
setInterval(checkDiscountExpiration, 5000);

// поиск клиента
function performSearch() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const tableRows = document.querySelectorAll('.discount-table tbody tr'); 

    tableRows.forEach(row => {
        const customerNameCell = row.querySelector('.customer-name-pov'); 
        if (customerNameCell) {
            const customerName = customerNameCell.textContent.toLowerCase(); 
            row.style.display = customerName.includes(searchInput) ? '' : 'none'; 
        }
    });
}

// Функция для сохранения настроек скидок
function saveDiscountSettings() {
    const orderThreshold = parseInt(document.getElementById('order-threshold').value);
    const discountPercentage = parseInt(document.getElementById('discount-percentage').value);
    const discountStart = document.getElementById('discount-start').value;
    const discountEnd = document.getElementById('discount-end').value;

    const inputs = [orderThreshold, discountPercentage, discountStart, discountEnd];
    const inputElements = [
        document.getElementById('order-threshold'),
        document.getElementById('discount-percentage'),
        document.getElementById('discount-start'),
        document.getElementById('discount-end')
    ];

    inputElements.forEach(input => {
        input.classList.remove('invalid');
        const errorMessage = input.nextElementSibling;
        if (errorMessage && errorMessage.classList.contains('error')) {
            errorMessage.remove(); 
        }
    });

    if (inputs.some(input => !input && input !== 0)) {
        inputElements.forEach(input => {
            if (!input.value) {
                input.classList.add('invalid');
                const errorSpan = document.createElement('span');
                errorSpan.textContent = 'Это поле обязательно';
                errorSpan.classList.add('error');
                errorSpan.style.color = 'red';
                input.parentNode.insertBefore(errorSpan, input.nextSibling); 
            }
        });
        return;
    }
    if (orderThreshold <= 0) {
        document.getElementById('order-threshold').classList.add('invalid');
        const errorSpan = document.createElement('span');
        errorSpan.textContent = 'Количество покупок не может быть меньше 0';
        errorSpan.classList.add('error');
        errorSpan.style.color = 'red';
        document.getElementById('order-threshold').parentNode.insertBefore(errorSpan, document.getElementById('order-threshold').nextSibling);
        return;
    }
    if (discountPercentage >= 100 || discountPercentage <= 0) {
        document.getElementById('discount-percentage').classList.add('invalid');
        const errorSpan = document.createElement('span');
        errorSpan.textContent = 'Скидка не может быть меньше 0% или больше 99%';
        errorSpan.classList.add('error');
        errorSpan.style.color = 'red';
        document.getElementById('discount-percentage').parentNode.insertBefore(errorSpan, document.getElementById('discount-percentage').nextSibling);
        return;
    }
    const discountSettings = {
        orderThreshold: orderThreshold,
        discountPercentage: discountPercentage,
        discountStart: discountStart,
        discountEnd: discountEnd
    };
    localStorage.setItem('discountSettings', JSON.stringify(discountSettings)); 

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

            localStorage.setItem('discountTableData', JSON.stringify(updatedData)); 

            const successMessage = document.querySelector('.text_done');
            successMessage.style.display = 'flex'; 
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 8000); 
        })
        .catch(error => console.error('Ошибка:', error));
}
// Инициализация таймера
function initializeTimer() {
    const discountEndInput = document.getElementById('discount-end');
    const timerElement = document.getElementById('timer');

    if (!timerElement) {
        console.error('Элемент с id="timer" не найден.');
        return;
    }

    const deadline = discountEndInput.value;

    if (!deadline) {
        console.error('Дата окончания скидки не задана!');
        hideTimer();
        return;
    }

    showTimer();
    startTimer(deadline);
}

function startTimer(deadline) {
    const timerElement = document.getElementById('timer');

    function updateTimer() {
        const now = new Date().getTime();
        const end = new Date(deadline).getTime();
        const timeRemaining = end - now;

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerElement.textContent = 'Скидка завершена';
            setTimeout(hideTimer, 2000);
            return;
        }

        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        timerElement.textContent = `До конца скидки: ${days} д. ${hours} ч. ${minutes} мин. ${seconds} сек.`;
    }

    updateTimer(); 
    const timerInterval = setInterval(updateTimer, 1000);
}

document.getElementById('discount-end').addEventListener('change', initializeTimer);

window.addEventListener('load', () => {
    const savedSettings = localStorage.getItem('discountSettings');
    const timerElement = document.getElementById('timer');

    if (savedSettings) {
        const discountSettings = JSON.parse(savedSettings);
        document.getElementById('order-threshold').value = discountSettings.orderThreshold;
        document.getElementById('discount-percentage').value = discountSettings.discountPercentage;
        document.getElementById('discount-start').value = discountSettings.discountStart;
        document.getElementById('discount-end').value = discountSettings.discountEnd;

        console.log('Загружено из localStorage:', discountSettings);

        if (discountSettings.discountEnd) {
            initializeTimer(); 
        }
    } else {
        hideTimer(); 
    }
});
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