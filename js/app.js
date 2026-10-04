let events = [
    {title: '"Deadbeat Tour" Tame Impala New show edition', category: 'Музика'},
    {title: 'Марія Примаченко "Слава Україні"', category: 'Мистецтво'},
    {title: 'Новорічна музична вистава "Три горішки для Попелюшки"', category: 'Театр'}]

const listContainer = document.querySelector('#events-list');

const URL = "https://date.nager.at/api/v3/PublicHolidays/2026/UA";


//Виводить в консолі всі події категорії "Музика"
for (let event of events) {
    if (event.category === "Музика") {
        console.log(event.title)
    }
}

//Скорочує назви подій до 25 символів та виводить їх у консоль
const shorten = (text, n) => text.length > n ? text.slice(0, n) + '...' : text
for (let event of events) {
    console.log(shorten(event.title, 25))
}

const allEvents = document.querySelectorAll('.card')
for (let card of allEvents) {
    card.remove()
}


//Функція рендеру яка генерує картки подій, що містять назву та категорію. У майбутньому можна додати іншу інформацію про подію та фото банеру
function renderCard(events) {
    listContainer.innerHTML = '';
    events.forEach(event => {
        const eachCard = document.createElement('article');
        const cardTitle = document.createElement('h3');
        const cardCategory = document.createElement('p');
        cardTitle.textContent = event.title;
        cardCategory.textContent = event.category;
        eachCard.append(cardTitle, cardCategory);
        eachCard.dataset.category = event.category;
        eachCard.classList.add('card');
        if (event.category === "Музика") {
            eachCard.classList.add('music');
        } else if (event.category === "Театр") {
            eachCard.classList.add('theatre');
        } else if (event.category === "Мистецтво") {
            eachCard.classList.add('art');
        } else {
            eachCard.classList.add('holiday');
        }

        listContainer.append(eachCard);
    })
}

renderCard(events);

const countEvents = document.querySelector("#events-count");
countEvents.textContent = `Кількість подій - ${events.length}`;

const titleInput = document.querySelector('#event-name');
const categoryInput = document.querySelector('#new-event-category');
const dateInput = document.querySelector('#new-event-date');
const loading = document.querySelector('#loading');


// Обробник події введення (input) для валідації довжини назви події в реальному часі
titleInput.addEventListener('input', event => {

    if (titleInput.value.length > 0 && titleInput.value.length < 3) {
        titleInput.setCustomValidity("Назва повинна складатися із щонайменше 3 символів");
    } else {
        titleInput.setCustomValidity('');
    }
})

// Обробник події помилки валідації (invalid) для відображення кастомного повідомлення при спробі відправки форми
titleInput.addEventListener('invalid', event => {
    if (titleInput.value.length < 3) {
        titleInput.setCustomValidity('Назва повинна складатися із щонайменше 3 символів');
    }
})


const form = document.querySelector('#forms')
// Обробник події відправки форми (submit) для створення нової події, додавання її в масив та перемальовування карток
form.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const category = categoryInput.value;
    const date = dateInput.value;

    const newEvent = {
        title: title,
        category: category,
    }

    events.push(newEvent);
    renderCard(events);
    form.reset();
})

const categoryFilter = document.querySelector('#quick-filters');
// Обробник події кліку (click) для кнопок швидких фільтрів: фільтрує масив подій за обраною категорією та оновлює відображення
categoryFilter.addEventListener('click', event => {
    event.preventDefault();
    let filtered;

    if (event.target.tagName === 'BUTTON') {
        const category = event.target.dataset.category;
        if (category === "all") {
            filtered = events;
        } else {
            filtered = events.filter(filter => filter.category === category);
        }
        renderCard(filtered);
    }
})


// Функція запиту до URL: https://date.nager.at/api/v3/PublicHolidays/2026/UA
async function loadData (){
    loading.style.display = 'block';
    const errorEl = document.querySelector('#error');
    if (errorEl) errorEl.style.display = 'none';

    try {
        const response = await fetch(URL);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Дані про події не знайдено')
            }
            throw new Error(`Код ${response.status}`);
        }

        const data = await response.json();
        console.log(data);

        const newData = data.map((item) => ({
            title: item.localName,
            category: 'Свята',
        }));

        newData.forEach((item) => {
            events.push(item);
        })

        renderCard(events);
    } catch (error) {
        if (error.message === 'Дані про події не знайдено') {
            showError(error.message);
        } else {
            showError('Не вдалося завантажити дані. Спробуйте пізніше.');
        }
        console.error(error);
    } finally {
        loading.style.display = 'none';
    }
}

const reloadBtn = document.querySelector('#reload');
if (reloadBtn) reloadBtn.addEventListener('click', loadData);

function showError (error) {
    const errorEl = document.querySelector('#error');
    if (errorEl) {
        errorEl.textContent = error;
        errorEl.style.display = 'block';
    }
}

loadData();