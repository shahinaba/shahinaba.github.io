// --- Functions (outside DOMContentLoaded) ---
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
    header.style.display = 'flex';
    header.style.alignItems = 'center';
  
    header.addEventListener('click', (event) => {
      // Toggle content visibility only if clicked outside the checkbox
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
  
  function playAudio(audioUrl, currentAudioRef) {
    // Stop previous audio if playing
    if (currentAudioRef.value) {
      currentAudioRef.value.pause();
      currentAudioRef.value.currentTime = 0;
    }
    // Create and play new audio
    currentAudioRef.value = new Audio(audioUrl);
    currentAudioRef.value.play();
    // Clear reference on end
    currentAudioRef.value.onended = () => {
      currentAudioRef.value = null;
    };
  }
  
  function syncParentCheckbox(parentCheckbox, content) {
    const childCheckboxes = content.querySelectorAll('input[type="checkbox"]');
    const allChecked = Array.from(childCheckboxes).every(cb => cb.checked);
    const anyChecked = Array.from(childCheckboxes).some(cb => cb.checked);
  
    parentCheckbox.checked = allChecked;
    parentCheckbox.indeterminate = !allChecked && anyChecked;
  }
  
  // --- Main DOMContentLoaded setup ---
  document.addEventListener('DOMContentLoaded', () => {
    // References to DOM elements
    const lessonContainer = document.getElementById('lesson-container');
    const practiceButton = document.getElementById('practice');
    const modal = document.getElementById('modal');
    const closeModalButton = document.getElementById('close-modal');
  
    // Global tracking
    const currentAudio = { value: null }; // Using an object to pass by reference
    const allItems = [];
  
    // Event listeners for modal
    practiceButton.addEventListener('click', () => {
      modal.style.display = 'block';
    });
    closeModalButton.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  
    // Build the UI from genData
    genData.forEach(language => {
      const langDiv = createCollapsible(language.language, 'language-header');
      const langContent = langDiv.querySelector('.content');
      const langCheckbox = langDiv.querySelector('.checkbox-container input');
      const { languageCode } = language;
  
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
          <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
  
        topic.phrases.forEach((item, index) => {
          const rowId = `${language.language}-${topic.name}-${index}`;
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><input type="checkbox" data-id="${rowId}"></td>
            <td>${item.phrase.en}</td>
            <td>${item.phrase[languageCode]}</td>
            <td><button class="play-btn" data-audio="${item.audio[languageCode]}">Play</button></td>
          `;
          allItems.push({ id: rowId, data: item, element: row });
  
          const rowCheckbox = row.querySelector('input[type="checkbox"]');
          rowCheckbox.addEventListener('change', () => {
            const foundItem = allItems.find(i => i.id === rowId);
            if (foundItem) foundItem.selected = rowCheckbox.checked;
            syncParentCheckbox(topicCheckbox, topicContent);
            syncParentCheckbox(langCheckbox, langContent);
          });
  
          tbody.appendChild(row);
        });
  
        topicContent.appendChild(table);
  
        // Topic checkbox listener
        topicCheckbox.addEventListener('change', () => {
          topicContent.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = topicCheckbox.checked;
            const foundItem = allItems.find(i => i.id === cb.dataset.id);
            if (foundItem) foundItem.selected = topicCheckbox.checked;
          });
          syncParentCheckbox(langCheckbox, langContent);
        });
  
        langContent.appendChild(topicDiv);
      });
  
      // Language checkbox listener
      langCheckbox.addEventListener('change', () => {
        langContent.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = langCheckbox.checked;
          const foundItem = allItems.find(i => i.id === cb.dataset.id);
          if (foundItem) foundItem.selected = langCheckbox.checked;
        });
      });
  
      lessonContainer.appendChild(langDiv);
    });
  
    // Handle play buttons
    lessonContainer.addEventListener('click', event => {
      if (event.target.classList.contains('play-btn')) {
        const audioUrl = event.target.dataset.audio;
        playAudio(audioUrl, currentAudio);
      }
    });
  });
  