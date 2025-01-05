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
    if (currentAudioRef.value) {
      currentAudioRef.value.pause();
      currentAudioRef.value.currentTime = 0;
    }
    currentAudioRef.value = new Audio(audioUrl);
    currentAudioRef.value.play();
    currentAudioRef.value.onended = () => {
      currentAudioRef.value = null;
    };
  }
  
  // Sequence controller (unchanged except for button text reference)
  function createSequenceController(allItems, currentAudioRef, playAllButton) {
    const sequenceState = {
      selectedItems: [],
      currentIndex: 0,
      isPlaying: false,
      isPaused: false
    };
  
    function playNext() {
      if (!sequenceState.isPlaying || sequenceState.isPaused) return;
      if (sequenceState.currentIndex >= sequenceState.selectedItems.length) {
        stopSequence();
        return;
      }
      const row = sequenceState.selectedItems[sequenceState.currentIndex].element;
      const audioUrl = row.querySelector('.play-btn').dataset.audio;
  
      if (currentAudioRef.value) {
        currentAudioRef.value.pause();
        currentAudioRef.value.currentTime = 0;
      }
      currentAudioRef.value = new Audio(audioUrl);
      currentAudioRef.value.play();
      currentAudioRef.value.onended = () => {
        if (!sequenceState.isPaused && sequenceState.isPlaying) {
          sequenceState.currentIndex++;
          playNext();
        }
      };
    }
  
    function stopSequence() {
      if (currentAudioRef.value) {
        currentAudioRef.value.pause();
        currentAudioRef.value.currentTime = 0;
        currentAudioRef.value = null;
      }
      playAllButton.textContent = 'Start'; // reset to "Start"
      sequenceState.isPlaying = false;
      sequenceState.isPaused = false;
      sequenceState.currentIndex = 0;
    }
  
    return {
      start() {
        sequenceState.selectedItems = allItems.filter(item => item.selected);
        if (!sequenceState.selectedItems.length) {
          alert('No items selected.');
          return;
        }
        sequenceState.currentIndex = 0;
        sequenceState.isPlaying = true;
        sequenceState.isPaused = false;
        playAllButton.textContent = 'Pause'; // now toggles to "Pause"
        playNext();
      },
      pause() {
        sequenceState.isPaused = true;
        sequenceState.isPlaying = false;
        if (currentAudioRef.value) currentAudioRef.value.pause();
        playAllButton.textContent = 'Resume'; // toggles to "Resume"
      },
      resume() {
        sequenceState.isPaused = false;
        sequenceState.isPlaying = true;
        if (currentAudioRef.value) {
          currentAudioRef.value.currentTime = 0;
          currentAudioRef.value.play();
        } else {
          playNext();
        }
        playAllButton.textContent = 'Pause'; // toggles back to "Pause"
      },
      stop() {
        stopSequence();
      }
    };
  }
  
  function syncParentCheckbox(parentCheckbox, content) {
    const childCheckboxes = content.querySelectorAll('input[type="checkbox"]');
    const allChecked = Array.from(childCheckboxes).every(cb => cb.checked);
    const anyChecked = Array.from(childCheckboxes).some(cb => cb.checked);
    parentCheckbox.checked = allChecked;
    parentCheckbox.indeterminate = !allChecked && anyChecked;
  }
  
  /* 
    NEW FUNCTION: Updates the Practice Audio button
    - If zero selected, text = "Practice Audio (no phrases selected)", disabled (gray).
    - If > 0, text = "Practice Audio (X phrases)", enabled (green).
  */
  function updatePracticeAudioButton(practiceButton, allItems) {
    const selectedCount = allItems.filter(item => item.selected).length;
    if (selectedCount === 0) {
      practiceButton.textContent = 'Practice Audio (no phrases selected)';
      practiceButton.disabled = true;
      practiceButton.classList.remove('enabled');
    } else {
      practiceButton.textContent = `Practice Audio (${selectedCount} phrases)`;
      practiceButton.disabled = false;
      practiceButton.classList.add('enabled');
    }
  }
  
  // --- Main DOMContentLoaded setup ---
  document.addEventListener('DOMContentLoaded', () => {
    const lessonContainer = document.getElementById('lesson-container');
    const practiceAudioButton = document.getElementById('practice-audio');
    const practiceModal = document.getElementById('practice-modal');
    const closeModalButton = document.getElementById('close-modal');
    const playAllButton = document.getElementById('play-all');
  
    const currentAudio = { value: null };
    const allItems = [];
  
    let sequenceController = null;
  
    // Show modal
    practiceAudioButton.addEventListener('click', () => {
      // Only open if button is not disabled
      if (!practiceAudioButton.disabled) {
        practiceModal.style.display = 'block';
      }
    });
  
    // Hide modal & stop audio
    closeModalButton.addEventListener('click', () => {
      practiceModal.style.display = 'none';
      if (sequenceController) {
        sequenceController.stop();
      }
    });
  
    // Clicking outside modal-content closes the modal too
    window.addEventListener('click', (event) => {
      if (event.target === practiceModal) {
        practiceModal.style.display = 'none';
        if (sequenceController) {
          sequenceController.stop();
        }
      }
    });
  
    // Toggle between Start / Pause / Resume
    playAllButton.addEventListener('click', () => {
      if (!sequenceController) {
        sequenceController = createSequenceController(allItems, currentAudio, playAllButton);
      }
      const btnText = playAllButton.textContent;
      if (btnText === 'Start') {
        sequenceController.start();
      } else if (btnText === 'Pause') {
        sequenceController.pause();
      } else if (btnText === 'Resume') {
        sequenceController.resume();
      }
    });
  
    // Build UI from genData
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
  
          // Row checkbox change
          const rowCheckbox = row.querySelector('input[type="checkbox"]');
          rowCheckbox.addEventListener('change', () => {
            const foundItem = allItems.find(i => i.id === rowId);
            if (foundItem) {
              foundItem.selected = rowCheckbox.checked;
            }
            syncParentCheckbox(topicCheckbox, topicContent);
            syncParentCheckbox(langCheckbox, langContent);
  
            // Update practice audio button each time selection changes
            updatePracticeAudioButton(practiceAudioButton, allItems);
          });
  
          tbody.appendChild(row);
        });
  
        topicContent.appendChild(table);
  
        // Topic checkbox
        topicCheckbox.addEventListener('change', () => {
          topicContent.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = topicCheckbox.checked;
            const foundItem = allItems.find(i => i.id === cb.dataset.id);
            if (foundItem) {
              foundItem.selected = topicCheckbox.checked;
            }
          });
          syncParentCheckbox(langCheckbox, langContent);
  
          // Update button
          updatePracticeAudioButton(practiceAudioButton, allItems);
        });
  
        langContent.appendChild(topicDiv);
      });
  
      // Language checkbox
      langCheckbox.addEventListener('change', () => {
        langContent.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = langCheckbox.checked;
          const foundItem = allItems.find(i => i.id === cb.dataset.id);
          if (foundItem) {
            foundItem.selected = langCheckbox.checked;
          }
        });
  
        // Update button
        updatePracticeAudioButton(practiceAudioButton, allItems);
      });
  
      lessonContainer.appendChild(langDiv);
    });
  
    // Individual "Play" button
    lessonContainer.addEventListener('click', (event) => {
      if (event.target.classList.contains('play-btn')) {
        playAudio(event.target.dataset.audio, currentAudio);
      }
    });
    
    // Initial check (in case genData is initially empty or something):
    updatePracticeAudioButton(practiceAudioButton, allItems);
  });
  