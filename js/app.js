const events = [
    {title: '"Deadbeat Tour" Tame Impala', category: 'Музика'},
    {title: 'Марія Примаченко "Слава Україні"', category: 'Мистецтво'},
    {title: 'Новорічна музична вистава "Три горішки для Попелюшки"', category: 'Театр'}]

const listContainer = document.querySelector('#events-list');


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
        } else {
            eachCard.classList.add('art');
        }

        listContainer.append(eachCard);
    })
}

renderCard(events);

const countEvents = document.querySelector("#events-count");
countEvents.textContent = `Кількість подій - ${events.length}`;
