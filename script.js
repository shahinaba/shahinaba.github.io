document.addEventListener('DOMContentLoaded', () => {
    const lessonContainer = document.getElementById('lesson-container');
    const playAllButton = document.getElementById('play-all');

    // Variable to store all items and their selected state
    const allItems = [];

    // Loop through the languages in genData
    genData.forEach(language => {
        const langDiv = createCollapsible(language.language, 'language-header');
        const langContent = langDiv.querySelector('.content'); // Access the collapsible content
        const langCheckbox = langDiv.querySelector('.checkbox-container input');

        // Loop through topics within each language
        language.topics.forEach(topic => {
            const topicDiv = createCollapsible(topic.name, 'topic-header');
            const topicContent = topicDiv.querySelector('.content'); // Access the collapsible content
            const topicCheckbox = topicDiv.querySelector('.checkbox-container input');

            // Create a table for phrases
            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Select</th>
                        <th>English Phrase</th>
                        <th>${language.language} Phrase</th>
                        <th>Play</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            `;

            const tbody = table.querySelector('tbody');
            topic.phrases.forEach((item, index) => {
                const row = document.createElement('tr');
                const rowId = `${language.language}-${topic.name}-${index}`;

                row.innerHTML = `
                    <td>
                        <input type="checkbox" data-id="${rowId}">
                    </td>
                    <td>${item.phrase.en}</td>
                    <td>${item.phrase.fr}</td>
                    <td>
                        <button onclick="playAudio('${item.audio.fr}')">Play</button>
                    </td>
                `;

                // Add row to allItems
                allItems.push({ id: rowId, data: item, element: row });

                // Add row checkbox listener
                const rowCheckbox = row.querySelector('input[type="checkbox"]');
                rowCheckbox.addEventListener('change', () => {
                    const item = allItems.find(i => i.id === rowId);
                    if (item) {
                        item.selected = rowCheckbox.checked;
                    }
                });

                tbody.appendChild(row);
            });

            // Add table to topic's collapsible content
            topicContent.appendChild(table);

            // Sync topic checkbox with row checkboxes
            topicCheckbox.addEventListener('change', () => {
                const allCheckboxes = topicContent.querySelectorAll('input[type="checkbox"]');
                allCheckboxes.forEach(cb => {
                    cb.checked = topicCheckbox.checked;
                    const item = allItems.find(i => i.id === cb.dataset.id);
                    if (item) {
                        item.selected = cb.checked;
                    }
                });
            });

            // Add topic collapsible to language content
            langContent.appendChild(topicDiv);
        });

        // Sync language checkbox with topic checkboxes
        langCheckbox.addEventListener('change', () => {
            const allTopicCheckboxes = langContent.querySelectorAll('.topic-header input[type="checkbox"]');
            allTopicCheckboxes.forEach(cb => {
                cb.checked = langCheckbox.checked;
                cb.dispatchEvent(new Event('change'));
            });
        });

        // Add language collapsible to lesson container
        lessonContainer.appendChild(langDiv);
    });

    // Play all selected items in page order
    playAllButton.addEventListener('click', () => {
        const selectedItems = allItems.filter(item => item.selected);
        playAll(selectedItems);
    });
});

// Utility to create collapsible sections with checkbox
function createCollapsible(title, headerClass) {
    const wrapper = document.createElement('div');
    const header = document.createElement('div');
    const content = document.createElement('div');
    const checkboxContainer = document.createElement('span');
    const checkbox = document.createElement('input');

    header.classList.add(headerClass);
    content.classList.add('content');
    checkboxContainer.classList.add('checkbox-container');
    checkbox.type = 'checkbox';

    header.innerHTML = `<span>${title}</span>`;
    header.style.display = "flex";
    header.style.alignItems = "center";

    header.addEventListener('click', (event) => {
        if (event.target !== checkbox) {
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
        }
    });

    checkboxContainer.appendChild(checkbox);
    header.prepend(checkboxContainer);

    wrapper.appendChild(header);
    wrapper.appendChild(content);

    return wrapper;
}

// Play audio
function playAudio(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
}

// Play all selected audio in page order
function playAll(selectedItems) {
    if (selectedItems.length === 0) return;
    const firstItem = selectedItems[0];
    const audio = new Audio(firstItem.data.audio.fr);

    audio.play();
    audio.onended = () => playAll(selectedItems.slice(1));
}
