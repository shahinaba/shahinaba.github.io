document.addEventListener('DOMContentLoaded', () => {
    const lessonContainer = document.getElementById('lesson-container');

    // Loop through the languages in genData
    genData.forEach(language => {
        const langDiv = createCollapsible(language.language, 'language-header');
        const langContent = langDiv.querySelector('.content'); // Access the collapsible content

        // Loop through topics within each language
        language.topics.forEach(topic => {
            const topicDiv = createCollapsible(topic.name, 'topic-header');
            const topicContent = topicDiv.querySelector('.content'); // Access the collapsible content

            // Create a table for phrases
            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>English Phrase</th>
                        <th>${language.language} Phrase</th>
                        <th>Play</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            `;

            const tbody = table.querySelector('tbody');
            topic.phrases.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.phrase.en}</td>
                    <td>${item.phrase.fr}</td>
                    <td>
                        <button onclick="playAudio('${item.audio.fr}')">Play</button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Add the table to the topic's collapsible content
            topicContent.appendChild(table);

            // Add the topic collapsible to the language content
            langContent.appendChild(topicDiv);
        });

        // Add the language collapsible to the lesson container
        lessonContainer.appendChild(langDiv);
    });
});

// Utility to create collapsible sections
function createCollapsible(title, headerClass) {
    const wrapper = document.createElement('div');
    const header = document.createElement('button');
    const content = document.createElement('div');

    header.classList.add(headerClass);
    content.classList.add('content');

    header.textContent = title;
    header.onclick = () => {
        content.style.display = content.style.display === 'block' ? 'none' : 'block';
    };

    wrapper.appendChild(header);
    wrapper.appendChild(content);
    return wrapper;
}

// Play audio
function playAudio(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
}
