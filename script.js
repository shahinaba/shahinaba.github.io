document.addEventListener('DOMContentLoaded', () => {
    const lessonContainer = document.getElementById('lesson-container');
    const practiceButton = document.getElementById('practice');
    const modal = document.getElementById('modal');
    const closeModalButton = document.getElementById('close-modal');

    let currentAudio = null; // To track the currently playing audio

    // Show the modal when Practice button is clicked
    practiceButton.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // Hide the modal when Close button is clicked
    closeModalButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Variable to store all items and their selected state
    const allItems = [];

    // Loop through the languages in genData
    genData.forEach(language => {
        const langDiv = createCollapsible(language.language, 'language-header');
        const langContent = langDiv.querySelector('.content');
        const langCheckbox = langDiv.querySelector('.checkbox-container input');
        const languageCode = language.languageCode; // Extract language code

        // Loop through topics within each language
        language.topics.forEach(topic => {
            const topicDiv = createCollapsible(topic.name, 'topic-header');
            const topicContent = topicDiv.querySelector('.content');
            const topicCheckbox = topicDiv.querySelector('.checkbox-container input');

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
                    <td>${item.phrase[languageCode]}</td>
                    <td>
                        <button class="play-btn" data-audio="${item.audio[languageCode]}">Play</button>
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

                    // Sync parent checkboxes
                    syncParentCheckbox(topicCheckbox, topicContent);
                    syncParentCheckbox(langCheckbox, langContent);
                });

                tbody.appendChild(row);
            });

            topicContent.appendChild(table);

            // Add topic checkbox listener
            topicCheckbox.addEventListener('change', () => {
                const childCheckboxes = topicContent.querySelectorAll('input[type="checkbox"]');
                childCheckboxes.forEach(cb => {
                    cb.checked = topicCheckbox.checked;
                    const item = allItems.find(i => i.id === cb.dataset.id);
                    if (item) {
                        item.selected = topicCheckbox.checked;
                    }
                });
                syncParentCheckbox(langCheckbox, langContent);
            });

            langContent.appendChild(topicDiv);
        });

        // Add language checkbox listener
        langCheckbox.addEventListener('change', () => {
            const childCheckboxes = langContent.querySelectorAll('input[type="checkbox"]');
            childCheckboxes.forEach(cb => {
                cb.checked = langCheckbox.checked;
                const item = allItems.find(i => i.id === cb.dataset.id);
                if (item) {
                    item.selected = langCheckbox.checked;
                }
            });
        });

        lessonContainer.appendChild(langDiv);
    });

    // Add event listener to dynamically handle play buttons
    lessonContainer.addEventListener('click', event => {
        if (event.target.classList.contains('play-btn')) {
            const audioUrl = event.target.dataset.audio;
            playAudio(audioUrl);
        }
    });

    // Function to play audio and stop previous audio if playing
    function playAudio(audioUrl) {
        if (currentAudio) {
            currentAudio.pause(); // Stop currently playing audio
            currentAudio.currentTime = 0; // Reset to the start
        }

        currentAudio = new Audio(audioUrl); // Create new audio
        currentAudio.play();

        // Clear currentAudio reference when playback ends
        currentAudio.onended = () => {
            currentAudio = null;
        };
    }

    // Synchronize parent checkbox state based on children
    function syncParentCheckbox(parentCheckbox, content) {
        const childCheckboxes = content.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(childCheckboxes).every(cb => cb.checked);
        const anyChecked = Array.from(childCheckboxes).some(cb => cb.checked);

        parentCheckbox.checked = allChecked;
        parentCheckbox.indeterminate = !allChecked && anyChecked; // Show indeterminate state
    }

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
});
