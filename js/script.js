// Функция для авторизации
const authenticate = async () => {
    const username = document.querySelector('input[name="username"]').value.trim();
    const password = document.querySelector('input[name="password"]').value.trim();
    const errorMessage = document.querySelector('.error-message');

    errorMessage.style.display = 'none';
    
    if (!username) {
        showError('Пожалуйста, введите логин.');
        return;
    }

    if (username.length < 5) {
        showError('Логин должен содержать не менее 5 символов.');
        document.querySelector('input[name="username"]').classList.add('invalid');
        return;
    }

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
            showError('Неверный логин или пароль.');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showError('Произошла ошибка при авторизации. Пожалуйста, попробуйте позже.');
    }
};

const showError = (message) => {
    const errorMessage = document.querySelector('.error-message');
    errorMessage.textContent = message;
    const errorM = document.querySelector('.login-form');
    errorM.style.paddingTop = '0px';
    errorMessage.style.display = 'block';
};

document.getElementById('authForm').addEventListener('submit', function (event) {
    event.preventDefault(); 
    authenticate();
});

const setActive = (element) => {
    const items = document.querySelectorAll('#navigation li');
    items.forEach(item => item.classList.remove('active'));

    element.classList.add('active');

    const rect = element.getBoundingClientRect();
    const underline = document.querySelector('.underline');
    underline.style.width = `${rect.width}px`;
    underline.style.left = `${rect.left - document.getElementById('navigation').getBoundingClientRect().left}px`;
};

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

const showSection = (sectionId, element) => {
    const sections = document.querySelectorAll('.tab-content');
    sections.forEach(section => section.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';

    setActive(element);
};

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

function resetDiscountSettings() {
    document.getElementById('order-threshold').value = '';
    document.getElementById('discount-percentage').value = '';
    document.getElementById('discount-start').value = '';
    document.getElementById('discount-end').value = '';

    localStorage.removeItem('discountSettings');

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
                    renderUserBehaviorTable(data);
                    localStorage.setItem('discountTableData', JSON.stringify(data));
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                });
        } else {
            renderDiscountTable(data);
            renderUserBehaviorTable(data);
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
                renderUserBehaviorTable(data); 
                
                localStorage.setItem('discountTableData', JSON.stringify(data));
            })
            .catch(error => {
                console.error('Ошибка:', error);
            });
    }
}

function renderDiscountTable(data) {
    const tableBody = document.querySelector('.discount-table tbody');
    tableBody.innerHTML = '';

    data.customers.forEach(customer => {
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
}

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
}

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

function renderUserBehaviorTable(data) {
    const tableBody = document.querySelector('#behavior .discount-table tbody');
    tableBody.innerHTML = ''; 
    tableBody.setAttribute('data-sort-order', 'asc');

    data.productActions.forEach(action => {
        const product = data.products.find(p => p.productId === action.productId);
        const customer = data.customers.find(c => c.customerId === action.customerId);

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

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0]; 
    document.getElementById('discount-start').setAttribute('min', today); 
    document.getElementById('discount-end').setAttribute('min', today); 
});

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
    });

    if (inputs.some(input => !input && input !== 0)) {
        inputElements.forEach(input => {
            if (!input.value) {
                input.classList.add('invalid');
            }
        });
        return;
    }

    if (discountPercentage >= 100) {
        document.querySelector('#text_inv_procent').style.display = 'block';
        document.getElementById('text_inv_procent').classList.add('set_text_invalid');
        document.getElementById('discount-percentage').classList.add('invalid');
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
document.getElementById('discount-percentage').addEventListener('input', function() {
    document.querySelector('#text_inv_procent').style.display = 'none'; 
    this.classList.remove('invalid'); 
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

