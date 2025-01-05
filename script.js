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
  
  /**
   * createSequenceController:
   *  - “Start” => sets up selected items, hides intro, shows active section
   *  - “Pause/Resume” => toggles between pausing and resuming current phrase
   *  - automatically updates displayed phrase text/index in practice-active
   */
  function createSequenceController(allItems, currentAudioRef) {
    // Track which items are selected, current index, etc.
    const sequenceState = {
      selectedItems: [],
      currentIndex: 0,
      isPlaying: false,
      isPaused: false
    };
  
    // Cache references to DOM elements for the “active” layout
    const practiceIntro       = document.getElementById('practice-intro');
    const practiceActive      = document.getElementById('practice-active');
    const practiceProgress    = document.getElementById('practice-progress');
    const practiceEnglish     = document.getElementById('practice-english');
    const practiceTranslation = document.getElementById('practice-translation');
  
    // We’ll also reference the separate buttons
    const btnStart       = document.getElementById('btn-start');
    const btnPauseResume = document.getElementById('btn-pause-resume');
  
    // Display the current item’s text & progress
    function updateActiveLayout(index) {
      const currentItem = sequenceState.selectedItems[index];
      if (!currentItem) return;
  
      const { en, ...otherLangs } = currentItem.data.phrase;
      // If you only have one extra language, pick the first
      const translations = Object.keys(otherLangs);
      const firstTranslationKey = translations[0];
      const translatedText = (firstTranslationKey && otherLangs[firstTranslationKey]) || '';
  
      // Example: "5/18 Phrase"
      const total = sequenceState.selectedItems.length;
      practiceProgress.textContent = `${index + 1}/${total} Phrase`;
  
      // Show English + Translation
      practiceEnglish.textContent = en;
      practiceTranslation.textContent = translatedText;
    }
  
    function playNext() {
      if (!sequenceState.isPlaying || sequenceState.isPaused) return;
      if (sequenceState.currentIndex >= sequenceState.selectedItems.length) {
        stopSequence();
        return;
      }
  
      // Update the text in the active layout
      updateActiveLayout(sequenceState.currentIndex);
  
      // Grab the audio from the row’s data
      const row = sequenceState.selectedItems[sequenceState.currentIndex].element;
      const audioUrl = row.querySelector('.play-btn').dataset.audio;
  
      // Stop any previous audio
      if (currentAudioRef.value) {
        currentAudioRef.value.pause();
        currentAudioRef.value.currentTime = 0;
      }
      currentAudioRef.value = new Audio(audioUrl);
      currentAudioRef.value.play();
  
      // On end, move to the next item
      currentAudioRef.value.onended = () => {
        if (!sequenceState.isPaused && sequenceState.isPlaying) {
          sequenceState.currentIndex++;
          playNext();
        }
      };
    }
  
    // Called when we’re done or user closes modal
    function stopSequence() {
      if (currentAudioRef.value) {
        currentAudioRef.value.pause();
        currentAudioRef.value.currentTime = 0;
        currentAudioRef.value = null;
      }
      // Reset internal state
      sequenceState.isPlaying = false;
      sequenceState.isPaused = false;
      sequenceState.currentIndex = 0;
  
      // Hide practice-active, show intro
      practiceActive.style.display = 'none';
      practiceIntro.style.display = 'block';
  
      // Show Start button, hide Pause/Resume
      btnStart.style.display = 'inline-block';
      btnPauseResume.style.display = 'none';
      btnPauseResume.textContent = 'Pause';
    }
  
    return {
      // Called on “Start” button click
      start() {
        sequenceState.selectedItems = allItems.filter(item => item.selected);
        if (!sequenceState.selectedItems.length) {
          alert('No items selected.');
          return;
        }
  
        sequenceState.currentIndex = 0;
        sequenceState.isPlaying = true;
        sequenceState.isPaused = false;
  
        // Hide the intro, show the active layout
        practiceIntro.style.display = 'none';
        practiceActive.style.display = 'block';
  
        // Show Pause button, hide Start
        btnStart.style.display = 'none';
        btnPauseResume.style.display = 'inline-block';
        btnPauseResume.textContent = 'Pause';
  
        playNext();
      },
  
      // Called when user presses the “Pause/Resume” button
      pause() {
        sequenceState.isPaused = true;
        sequenceState.isPlaying = false;
        if (currentAudioRef.value) {
          currentAudioRef.value.pause();
        }
      },
      resume() {
        sequenceState.isPaused = false;
        sequenceState.isPlaying = true;
        if (currentAudioRef.value) {
          currentAudioRef.value.currentTime = 0; // replay from start
          currentAudioRef.value.play();
        } else {
          playNext();
        }
      },
  
      // Called when user closes modal or we finish all phrases
      stop() {
        stopSequence();
      },
  
      // Advance to the next item manually if needed (optional)
      next() {
        sequenceState.currentIndex++;
        playNext();
      },
    };
  }
  
  // Synchronizes topic/language checkboxes
  function syncParentCheckbox(parentCheckbox, content) {
    const childCheckboxes = content.querySelectorAll('input[type="checkbox"]');
    const allChecked = Array.from(childCheckboxes).every(cb => cb.checked);
    const anyChecked = Array.from(childCheckboxes).some(cb => cb.checked);
  
    parentCheckbox.checked = allChecked;
    parentCheckbox.indeterminate = !allChecked && anyChecked;
  }
  
  /**
   * Update the main “Practice Audio” button subtext & style 
   * based on how many items are selected
   */
  function updatePracticeAudioButton(practiceButton, practiceAudioSubtext, allItems) {
    const selectedCount = allItems.filter(item => item.selected).length;
    if (selectedCount === 0) {
      practiceAudioSubtext.textContent = '(no phrases selected)';
      practiceButton.disabled = true;
      practiceButton.classList.remove('enabled');
    } else {
      practiceAudioSubtext.textContent = `(${selectedCount} phrases selected)`;
      practiceButton.disabled = false;
      practiceButton.classList.add('enabled');
    }
  }
  
  // --- Main setup ---
  document.addEventListener('DOMContentLoaded', () => {
    const lessonContainer = document.getElementById('lesson-container');
    const practiceAudioButton = document.getElementById('practice-audio');
    const practiceAudioSubtext = document.getElementById('practice-audio-subtext');
  
    // Modal
    const practiceModal = document.getElementById('practice-modal');
    const closeModalButton = document.getElementById('close-modal');
  
    // “About to Practice X phrases”
    const aboutToPractice = document.getElementById('about-to-practice');
    
    // Our two separate buttons
    const btnStart = document.getElementById('btn-start');
    const btnPauseResume = document.getElementById('btn-pause-resume');
  
    // Audio reference & all items
    const currentAudio = { value: null };
    const allItems = [];
  
    // Create the sequence controller (manages start/pause/resume/stop)
    let sequenceController = null;
  
    // Show modal if button not disabled
    practiceAudioButton.addEventListener('click', () => {
      if (!practiceAudioButton.disabled) {
        practiceModal.style.display = 'block';
        const selectedCount = allItems.filter(item => item.selected).length;
        aboutToPractice.textContent = `You are about to practice ${selectedCount} phrase${selectedCount !== 1 ? 's' : ''}.`;
      }
    });
  
    // Close modal => stop audio
    closeModalButton.addEventListener('click', () => {
      practiceModal.style.display = 'none';
      if (sequenceController) sequenceController.stop();
    });
  
    // Clicking outside modal-content also closes
    window.addEventListener('click', (event) => {
      if (event.target === practiceModal) {
        practiceModal.style.display = 'none';
        if (sequenceController) sequenceController.stop();
      }
    });
  
    // Start button
    btnStart.addEventListener('click', () => {
      if (!sequenceController) {
        // Create it once
        sequenceController = createSequenceController(allItems, currentAudio);
      }
      sequenceController.start();
    });
  
    // Pause/Resume button
    btnPauseResume.addEventListener('click', () => {
      if (!sequenceController) return;
      if (btnPauseResume.textContent === 'Pause') {
        sequenceController.pause();
        btnPauseResume.textContent = 'Resume';
      } else {
        // “Resume”
        sequenceController.resume();
        btnPauseResume.textContent = 'Pause';
      }
    });
  
    // Build out the UI from genData (collapsible sections, tables, etc.)
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
  
          // Handle row checkbox
          const rowCheckbox = row.querySelector('input[type="checkbox"]');
          rowCheckbox.addEventListener('change', () => {
            const foundItem = allItems.find(i => i.id === rowId);
            if (foundItem) {
              foundItem.selected = rowCheckbox.checked;
            }
            syncParentCheckbox(topicCheckbox, topicContent);
            syncParentCheckbox(langCheckbox, langContent);
            updatePracticeAudioButton(practiceAudioButton, practiceAudioSubtext, allItems);
          });
  
          tbody.appendChild(row);
        });
  
        topicContent.appendChild(table);
  
        // Topic-level checkbox
        topicCheckbox.addEventListener('change', () => {
          topicContent.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = topicCheckbox.checked;
            const foundItem = allItems.find(i => i.id === cb.dataset.id);
            if (foundItem) {
              foundItem.selected = topicCheckbox.checked;
            }
          });
          syncParentCheckbox(langCheckbox, langContent);
          updatePracticeAudioButton(practiceAudioButton, practiceAudioSubtext, allItems);
        });
  
        langContent.appendChild(topicDiv);
      });
  
      // Language-level checkbox
      langCheckbox.addEventListener('change', () => {
        langContent.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = langCheckbox.checked;
          const foundItem = allItems.find(i => i.id === cb.dataset.id);
          if (foundItem) {
            foundItem.selected = langCheckbox.checked;
          }
        });
        updatePracticeAudioButton(practiceAudioButton, practiceAudioSubtext, allItems);
      });
  
      lessonContainer.appendChild(langDiv);
    });
  
    // Individual “Play” button for single row
    lessonContainer.addEventListener('click', event => {
      if (event.target.classList.contains('play-btn')) {
        playAudio(event.target.dataset.audio, currentAudio);
      }
    });
  
    // Initial button state
    updatePracticeAudioButton(practiceAudioButton, practiceAudioSubtext, allItems);
  });
  