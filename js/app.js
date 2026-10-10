// Обираю React, оскільки його підхід з використанням JSX та звичайних JS-функцій для
// рендеру є більш гнучким і ближчим до класичного програмування.

// Рендерить картку події та обчислює кількість днів до її початку
function EventCard({title, category, date, location, item, onToggleSaved, isSaved}) {
    const [currentWidth, setCurrentWidth] = React.useState(0);

    const todayDate = new Date();
    const eventDate = new Date(date);

    const difference = eventDate - todayDate;
    const daysLeft = Math.ceil(difference / (1000*60*60*24));
    let textDaysLeft = "";
    if (daysLeft === 0) {
        textDaysLeft = "Подія відбувається уже сьогодні";
    } else if (daysLeft < 0) {
        textDaysLeft = "Подія вже пройшла. Очікуйте наступних анонсів!";
    } else {
        textDaysLeft = "Днів до: " + daysLeft;
    }

    let cssClasses;
    let cssClassProgressBar
    if (category === "Музика") {
        cssClasses = "music";
        cssClassProgressBar = "music";
    }else if (category === "Мистецтво") {
        cssClasses = "art";
        cssClassProgressBar = "art";
    } else if (category === "Театр") {
        cssClasses = "theatre";
        cssClassProgressBar = "theatre";
    } else {
        cssClasses = "holiday";
        cssClassProgressBar = "holiday";
    }


    let percentage = 0;
    if (daysLeft === 0) {
        cssClassProgressBar = "happensToday";
        percentage = 100;
    } else if (daysLeft > 0) {
        percentage = (daysLeft / 93) * 100;
        if (percentage > 100) percentage = 100;
    }

    const isUpcoming = daysLeft >= 0 && daysLeft <= 14;


// Невелика затримка перед встановленням стану, щоб CSS transition відпрацював коректно при монтуванні компонента
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setCurrentWidth(percentage);
        }, 50)

        return () => {clearTimeout(timeout);};
    }, [percentage]);

    const buttonText = isSaved ? 'Збережено' : 'Додати в обране';
    return (
        <article className={`card ${cssClasses} ${isUpcoming ? 'upcoming' : ''}`}>
            <span className="badge">{category}</span>
            <h3 className="boldText">{title}</h3>
            <p>{date}</p>
            <p>Місце проведення: {location}</p>
            <p className="boldText">{textDaysLeft}</p>

            {daysLeft >= 0 && (
                <div className="progress-bar-base"> {}
                    <div className={`progress-bar ${cssClassProgressBar}`} style={{width: `${currentWidth}%`} }>{}</div>
                </div>
            )}

            <div className="card-buttons">
                <button
                    type='button'
                    className = {isSaved ? 'btn btn-remove' : 'btn btn-saved'}
                    onClick={() => {onToggleSaved(item)}}
                >
                    {buttonText}
                </button>

                <button
                    type='button'
                    className="btn btn-details"
                    onClick={(event) => {
                        event.preventDefault();
                        window.location.hash = `#/events/${item.id}`;
                    }}
                >
                    Деталі
                </button>
            </div>
        </article>
    )
}

// Зберігає масив подій у localStorage (використовується для старої логіки)
function saveToLocalStorage(items) {
    localStorage.setItem("savedEvents", JSON.stringify(items));
}

// Зчитує масив подій з localStorage
function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem("savedEvents");
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Пошкоджені дані в localStorage:', error);
        return [];
    }
}

// Відкриває з'єднання з IndexedDB та створює сховище збережених подій
function openDB() {
    return new Promise((resolve, reject) => {
        try {
            if (!window.indexedDB) {
                alert("Ваш браузер не підтримує сховище даних або ви перебуваєте в жорсткому приватному режимі. Функція збереження подій недоступна.");
                return reject(new Error("IndexedDB не підтримується"))
            }

            const request = indexedDB.open('EventsDB', 1);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('savedEvents')) {
                    db.createObjectStore('savedEvents', {keyPath: 'id'})
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => {
                alert("Не вдалося відкрити базу даних збережених подій. Схоже, ваш браузер блокує доступ до локальної пам'яті (можливо, увімкнено приватний режим).")
                reject(event.target.error)
            }
        } catch (error) {
            alert("Виникла критична помилка під час звернення до пам'яті браузера.")
            reject(error);
        }
    })
}

// Додає або оновлює подію в базі IndexedDB
async function addItem(item) {
    const db =  await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('savedEvents', 'readwrite');
        tx.objectStore('savedEvents').put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Видаляє подію з IndexedDB за її id
async function deleteItem(id) {
    const db =  await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('savedEvents', 'readwrite');
        tx.objectStore('savedEvents').delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    })
}

// Отримує всі збережені події з IndexedDB
async function getAllItems() {
    const db =  await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('savedEvents', 'readonly');
        const request = tx.objectStore('savedEvents').getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    })
}

const routes = [
    {path: '/', view: Home},
    {path: '/saved', view: SavedEventsPage},
    {path: '/events/:id', view: EventCardPage}
];

function matchRoutes(path) {
    const pathParts = path.split('/').filter(Boolean);
    for (const route of routes) {
        const routeParts = route.path.split('/').filter(Boolean);
        if (routeParts.length !== pathParts.length) continue;
        const params = {};
        const isMatch = routeParts.every((part, i) => {
            if (part.startsWith(':')) {
                params[part.slice(1)] = pathParts[i];
                return true;
            }
            return part === pathParts[i];
        });
        if (isMatch) return {view: route.view, params};
    }
    return null;
}

// Головний компонент: керує станом, міграцією, запитами до API та збереженням у БД
function App() {
    const [events, setEvents] = React.useState([
        {id: 1, title: '"Deadbeat Tour" Tame Impala New show edition', category: 'Музика', date: '2026-11-24', location: 'НСК "Олімпійський"', img: 'assets/img/ConcertAffiche.jpg' },
        {id: 2, title: 'Марія Примаченко "Слава Україні"', category: 'Мистецтво', date: '2026-12-03', location: 'Будинок Офіцерів', img: 'assets/img/ExhibitionMariya.jpg'},
        {id: 3, title: 'Новорічна музична вистава "Три горішки для Попелюшки"', category: 'Театр', date: '2026-10-22', location: 'бульвар Тараса Шевченка', img: 'assets/img/NewYearPlay.jpg'},
    ]);

    const [savedEvents, setSavedEvents] = React.useState([]);

    const [currentHash, setCurrrentHash] = React.useState(window.location.hash || '#/');

    React.useEffect(() => {
        const handleHashChange = () => {
            setCurrrentHash(window.location.hash || '#/');
        }
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [])

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getAllItems();
                setSavedEvents(data);
            }catch(error) {
                console.error(error);
            }
        }
        fetchData();
    }, [])

    const handleSavedEvents = async (eventItem) => {
        const isSaved = savedEvents.some(savedEvent => savedEvent.id === eventItem.id);

        try {
            if (isSaved) {
                await deleteItem(eventItem.id);
                setSavedEvents(savedEvents.filter(item => item.id !== eventItem.id));
            } else {
                await addItem(eventItem);
                setSavedEvents([...savedEvents, eventItem]);
            }
        } catch (error) {
            console.error(error);
        }
    }

    React.useEffect(() => {
        const loadEvents = async () => {
            try {
                const response = await fetch("https://date.nager.at/api/v3/PublicHolidays/2026/UA");

                if (!response.ok) {
                    throw new Error("Failed to load events");
                }

                const data = await response.json();
                const newEvents = data.map((item, index) => ({
                    id: 4 + index,
                    title: item.localName,
                    category: 'Свята',
                    date: item.date,
                    location: 'Around the World',
                }))

                setEvents(prevEvents => {
                    const oldEvents = prevEvents.filter((item) => item.category !== 'Свята');
                    return [...oldEvents, ...newEvents];
                });

            } catch (error) {
                console.error(error);
            }
        };

        loadEvents();
    }, []);

    React.useEffect(() => {
        const migrateEvents = async () => {
            try {
                const isMigrated = localStorage.getItem("migrated");

                if (!isMigrated) {
                    const oldEvents = loadFromLocalStorage();

                    if (oldEvents.length > 0) {
                        for (let eventItem of oldEvents) {
                            await addItem(eventItem);
                        }
                    }
                }

                localStorage.setItem("migrated", 'true');
            } catch (error) {
                console.error(error);
            }
        }

        migrateEvents();
    }, [])

    const path = currentHash.replace('#', '');
    const routeMatch = matchRoutes(path);

    let CurrentView = NotFoundPage;
    let routeParams = {};

    if (routeMatch) {
        CurrentView = routeMatch.view;
        routeParams = routeMatch.params;
    }

    return (
        <div className="app">
            <CurrentView
                events={events}
                savedEvents={savedEvents}
                onToggleSaved={handleSavedEvents}
                params={routeParams}
            />
        </div>
    )
}

function Home ({events, savedEvents, onToggleSaved}) {
    return (
        <div className='layout'>
            <main>
                <section id="filters">
                    <h2>Фільтр за датою/категорією</h2>
                    <form className="filters">
                        <div className="filter-date">
                            <label htmlFor="event-date">Оберіть дату події:</label>
                            <input type="date" id="event-date"/>
                        </div>

                        <div className="filter-category">
                            <label htmlFor="event-category">Оберіть категорію події:</label>
                            <select id="event-category">
                                <option value="music">Музика</option>
                                <option value="art">Мистецтво</option>
                                <option value="theatre">Театр</option>
                                <option value="holiday">Свята</option>
                            </select>
                        </div>
                    </form>
                </section>

                <section id="forms">
                    <h2>Додати нову подію</h2>
                    <form className="add-event-form">
                        <div className="add-event">
                            <label htmlFor="event-name">Уведіть назву події</label>
                            <input type="text" id="event-name" name="title" required pattern=".{3,}"/>

                            <label htmlFor="new-event-category">Оберіть категорію події:</label>
                            <select id="new-event-category" name="category" required>
                                <option value="Музика">Музика</option>
                                <option value="Мистецтво">Мистецтво</option>
                                <option value="Театр">Театр</option>
                                <option value="holiday">Свята</option>
                            </select>

                            <label htmlFor="new-event-date">Оберіть дату події</label>
                            <input type="date" id="new-event-date" name="date" required/>
                        </div>

                        <div className="form-submit">
                            <button type="submit" className="btn">Додати подію</button>
                        </div>
                    </form>
                </section>

                <section id="quick-filters">
                    <h2>Швидкі фільтри</h2>
                    <div className="buttons-container" id="category-filters">
                        <button type="button" className="btn" data-category="all">Усі</button>
                        <button type="button" className="btn" data-category="Музика">Музика</button>
                        <button type="button" className="btn" data-category="Мистецтво">Мистецтво</button>
                        <button type="button" className="btn" data-category="Театр">Театр</button>
                        <button type="button" className="btn" data-category="Свята">Свята</button>
                    </div>
                </section>

                <section id="events">
                    <div>
                        <p>Кількість подій: {events.length}</p>
                        <div className='all-cards'>
                            {events.map((item) => {
                                const isEventSaved = savedEvents.some(saved => saved.id === item.id);

                                return (
                                    <EventCard
                                        key={item.id}
                                        item={item}
                                        onToggleSaved={onToggleSaved}
                                        isSaved={isEventSaved}
                                        title={item.title}
                                        category={item.category}
                                        date={item.date}
                                        location={item.location}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </section>
            </main>
            <aside id="current">
                <h2>Деталі події</h2>
                <p>Тут можна буде переглянути деталі обраної події</p>
            </aside>
        </div>
    )
}

//Сторінка збережених подій
function SavedEventsPage({savedEvents, onToggleSaved}) {
    return (
        <div className="layout">
            <main>
                <section className="events">
                    <h2>Збережені події</h2>

                    {savedEvents.length===0 ? (
                        <p>У Вас поки немає збережених подій</p>
                    ) : (
                        <div className="all-cards">
                            {savedEvents.map((item) => {
                                return (
                                    <EventCard
                                    key={item.id}
                                    item={item}
                                    onToggleSaved={onToggleSaved}
                                    isSaved={true}
                                    title={item.title}
                                    category={item.category}
                                    date={item.date}
                                    location={item.location}
                                    />
                                )
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}

//Сторінка з деталями конкретної сторінки
function EventCardPage ({events, savedEvents, onToggleSaved, params}) {
    const selectedEvents = events.find(item => item.id == params.id);

    return (
        <div className="layout">
            <main>
                <section className="events">
                    <h2>Оберіть подію для перегляду деталей</h2>
                    <div className="all-cards">
                        {events.map((item) => {
                            const isEventSaved = savedEvents.find(saved => saved.id === item.id);

                            return (
                                <EventCard
                                    key={item.id}
                                    item={item}
                                    onToggleSaved={onToggleSaved}
                                    isSaved={isEventSaved}
                                    title={item.title}
                                    category={item.category}
                                    date={item.date}
                                    location={item.location}
                                />
                            )
                        })}
                    </div>
                </section>
            </main>
            <aside id="current">
                <h2>Деталі події</h2>
                {selectedEvents ? (
                    <div className="event-details">
                        {selectedEvents.img && (
                            <img
                                src={selectedEvents.img}
                                alt={selectedEvents.title}
                            />
                        )}

                        <p>Дата: {selectedEvents.date}</p>
                        <p>Локація: {selectedEvents.location}</p>

                        <p>
                            Це детальна сторінка події. Тут Ви можете ознайомитися з афішею, дізнатися точне місце проведення та деталі заходу.</p>
                        <p>Натисніть "Зберегти", щоб не втратити її!</p>

                    </div>
                ) : (
                    <p style={{ color: 'red' }}>Оберіть подію зі списку або перевірте посилання.</p>
                )}
            </aside>
        </div>
    );
}

//Сторінка при омилковому вводі адреси
function NotFoundPage () {
    return (
        <div className="layout">
            <main>
                <h1>СТОРІНКУ НЕ ЗНАЙДЕНО</h1>
                <h2>Натисніть на посилання нижче аби перейти до головної сторінки</h2>
                <a href="#/" data-link>Повернутися</a>
            </main>
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
);

//Обробка переходу
document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-link]');
    if (!link) return;
    event.preventDefault();
    window.location.hash = link.getAttribute('href');
});



//Робота попередніх 9 лабораторних, які були замінені кодом вище
/*let events = [
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

        events = events.filter(event => event.category !== "Свята")

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

loadData();*/