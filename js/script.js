// Функция для авторизации
const authenticate = () => {
    const username = document.querySelector('input[name="username"]').value.trim();
    const password = document.querySelector('input[name="password"]').value.trim();
    const errorMessage = document.querySelector('.error-message');
    const errorM = document.querySelector('.login-form');

    errorMessage.style.display = 'none';
    document.querySelector('input[name="username"]').classList.remove('invalid');
    document.querySelector('input[name="password"]').classList.remove('invalid');

    fetch('/db/db.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузкии JSON файла');
            }
            return response.json();
        })
        .then(data => {
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
                errorM.style.paddingTop = '0px';
                errorMessage.textContent = 'Неверный логин или пароль';
                errorMessage.style.display = 'block';

                document.querySelector('input[name="username"]').classList.add('invalid');
                document.querySelector('input[name="password"]').classList.add('invalid');
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
        });
};

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

// рендер табл скидки
function renderDiscountTable(data) {
    const tableBody = document.querySelector('.discount-table tbody');
    tableBody.innerHTML = ''; 

    data.customers.forEach(customer => {
        const discount = data.discounts.find(d => d.discountId === customer.discountId);
        const discountPercentage = discount ? `${discount.percentage}%` : '0%';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.lastName} ${customer.firstName} ${customer.middleName}</td>
            <td>${customer.order_count}</td>
            <td>${discountPercentage}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Функция для загрузки данных из JSON файла
function loadJSONData() {
    fetch('/db/db.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузки JSON файла');
            }
            return response.json();
        })
        .then(data => {
            renderDiscountTable(data);
        })
        .catch(error => {
            console.error('Ошибка:', error);
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

    // загружаем данные, обновляем табл скидкок
    fetch('/db/db.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузки JSON файла');
            }
            return response.json();
        })
        .then(data => {
            // Применяем скидки клиентам, основываясь на пороге покупок
            const updatedCustomers = data.customers.map(customer => {
                if (customer.order_count >= orderThreshold) {
                    // Применяем скидку, если количество покупок больше или равно порогу
                    const discount = data.discounts.find(d => d.discountId === customer.discountId);
                    if (discount) {
                        discount.percentage = discountPercentage;
                    }
                } else {
                    // Если порог не достигнут, скидка 0%
                    const discount = data.discounts.find(d => d.discountId === customer.discountId);
                    if (discount) {
                        discount.percentage = 0; 
                    }
                }
                return customer;
            });

            // привеняем новые данные
            renderDiscountTable({ customers: updatedCustomers, discounts: data.discounts });
            
        })
        .catch(error => {
            console.error('Ошибка:', error);
        });
//чтобы скидку применить таблицу не сбрасывать!!!!!
// const DiscountTablee = {
//     updatedCustomers: updatedCustomers,
//     discount: data
// }
// localStorage.setItem('DiscountTablee', JSON.stringify(DiscountTablee));
};

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

//чтобы скидку применить таблицу не сбрасывать!!!!!
// window.addEventListener('load', () => {
//     const savedDiscount = localStorage.getItem('savedDiscount');
//     if (savedDiscount) {
//         const DiscountTablee = JSON.parse(savedDiscount);
//         document.getElementById('order-threshold').value = discountSettings.updatedCustomers;
//         document.getElementById('discount-percentage').value = discountSettings.discount;
        
//         console.log('Загружено из localStorage:', DiscountTablee);
//     }
// });

//здесь внизу была функция renderDiscountTable

document.addEventListener('DOMContentLoaded', loadJSONData);

