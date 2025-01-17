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
  // (Used only for single “Play” button clicks)
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
 * Shuffle an array in place (Fisher-Yates)
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Play the chain for a single phrase:
 *  1) English normal speed
 *  2) Pause 0.5s
 *  3) French at 0.5 speed
 *  4) Pause 0.5s
 *  5) French at 1x speed
 *  6) Pause 0.5s
 *  7) onComplete()
 */
function playPhraseSequence(englishUrl, frenchUrl, currentAudioRef, onComplete) {
  // Helper: stop any current audio
  function stopCurrentAudio() {
    if (currentAudioRef.value) {
      currentAudioRef.value.pause();
      currentAudioRef.value.currentTime = 0;
      currentAudioRef.value = null;
    }
  }

  stopCurrentAudio();
  currentAudioRef.value = new Audio(englishUrl);
  currentAudioRef.value.play();
  currentAudioRef.value.onended = () => {
    // 2) Pause 0.5s
    stopCurrentAudio();
    setTimeout(() => {
      // 3) French at normal speed
      stopCurrentAudio();
      currentAudioRef.value = new Audio(frenchUrl);
      currentAudioRef.value.playbackRate = 1;
      currentAudioRef.value.play();

      currentAudioRef.value.onended = () => {
        // 4) Pause 0.5s
        stopCurrentAudio();
        setTimeout(() => {
          // 5) French at 0.75 speed
          stopCurrentAudio();
          currentAudioRef.value = new Audio(frenchUrl);
          currentAudioRef.value.playbackRate = 0.65;
          currentAudioRef.value.play();

          currentAudioRef.value.onended = () => {
            // 6) Pause 0.5s
            stopCurrentAudio();
            setTimeout(() => {
              // 7) French at normal speed again
              stopCurrentAudio();
              currentAudioRef.value = new Audio(frenchUrl);
              currentAudioRef.value.playbackRate = 1;
              currentAudioRef.value.play();

              currentAudioRef.value.onended = () => {
                // 8) Pause 0.5s
                stopCurrentAudio();
                setTimeout(() => {
                  // 9) Sequence done
                  onComplete();
                }, 550); // 0.5s
              };
            }, 550); // 0.5s
          };
        }, 550); // 0.5s
      };
    }, 550); // 0.5s
  };
}

/**
 * createSequenceController:
 *  - “Start” => sets up selected items, hides intro, shows active section
 *  - “Pause/Resume” => toggles between pausing and resuming current phrase
 *  - “Loop” => if enabled, once we reach the end, start over
 *  - “Shuffle” => randomize selected items if checked
 *  - “Duration” => if not 0, stop after X minutes
 */
function createSequenceController(allItems, currentAudioRef) {
  const sequenceState = {
    selectedItems: [],
    currentIndex: 0,
    isPlaying: false,
    isPaused: false,
    loop: false,
    shuffle: false,
    maxDuration: 0, // in minutes; 0 means no limit
    durationTimer: null,
    startTime: 0,   // We'll record the time we start the practice
    updateInterval: null // Store the interval ID here
  };

  // Grab DOM elements
  const practiceIntro = document.getElementById('practice-intro');
  const practiceActive = document.getElementById('practice-active');
  const practiceProgress = document.getElementById('practice-progress');
  const practiceEnglish = document.getElementById('practice-english');
  const practiceTranslation = document.getElementById('practice-translation');
  const practiceOptionsStatus = document.getElementById('practice-options-status');
  const btnStart = document.getElementById('practice-start-btn');
  const btnPauseResume = document.getElementById('practice-play-resume-btn');

  // Helper: format mm:ss from milliseconds
  function formatTime(ms) {
    if (ms <= 0) return '0:00';
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / 60000);
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }

  // Returns string of how much time remains if user selected a duration
  function getTimeRemaining() {
    if (sequenceState.maxDuration === 0) {
      return 'No limit';
    }
    // total ms for the practice
    const totalMs = sequenceState.maxDuration * 60000;
    // how long we've been going
    const elapsedMs = Date.now() - sequenceState.startTime;
    const remainingMs = totalMs - elapsedMs;
    if (remainingMs <= 0) return '0:00'; // time’s up
    return formatTime(remainingMs);
  }

  // Update the text in #practice-options-status (e.g. "Shuffle: ON, Loop: OFF, Time remaining: 6:05")
  function updatePracticeDetailsUI() {
    const shuffleText = sequenceState.shuffle ? 'ON' : 'OFF';
    const loopText = sequenceState.loop ? 'ON' : 'OFF';
    const timeText = getTimeRemaining();

    practiceOptionsStatus.textContent = `Shuffle: ${shuffleText}, Loop: ${loopText}, Time: ${timeText}`;
  }

  function updateActiveLayout(index) {
    const currentItem = sequenceState.selectedItems[index];
    if (!currentItem) return;

    const { en, ...otherLangs } = currentItem.data.phrase;
    const translations = Object.keys(otherLangs);
    const firstTranslationKey = translations[0];
    const translatedText = (firstTranslationKey && otherLangs[firstTranslationKey]) || '';

    // e.g., "5/18 Phrase"
    const total = sequenceState.selectedItems.length;
    practiceProgress.style.textAlign = 'left';
    practiceProgress.textContent = `${index + 1}/${total} Phrase`;

    practiceEnglish.textContent = en;
    practiceTranslation.textContent = translatedText;

    // Update the practice status each time we switch to a new phrase
    updatePracticeDetailsUI();
  }

  function onPhraseComplete() {
    sequenceState.currentIndex++;
    if (!sequenceState.isPaused && sequenceState.isPlaying) {
      playNext();
    }
  }

  function playNext() {
    if (!sequenceState.isPlaying || sequenceState.isPaused) return;

    if (sequenceState.currentIndex >= sequenceState.selectedItems.length) {
      if (sequenceState.loop) {
        sequenceState.currentIndex = 0;
      } else {
        stopSequence();
        return;
      }
    }
    updateActiveLayout(sequenceState.currentIndex);

    const item = sequenceState.selectedItems[sequenceState.currentIndex];
    const englishUrl = item.data.audio.en;
    const frenchUrl = item.data.audio.fr || item.data.audio[item.data.languageCode];

    playPhraseSequence(englishUrl, frenchUrl, currentAudioRef, onPhraseComplete);
  }

  function stopSequence() {
    if (currentAudioRef.value) {
      currentAudioRef.value.pause();
      currentAudioRef.value.currentTime = 0;
      currentAudioRef.value = null;
    }
    sequenceState.isPlaying = false;
    sequenceState.isPaused = false;
    sequenceState.currentIndex = 0;

    // Clear any timer
    if (sequenceState.durationTimer) {
      clearTimeout(sequenceState.durationTimer);
      sequenceState.durationTimer = null;
    }

    // Clear interval if it's running
    if (sequenceState.updateInterval) {
      clearInterval(sequenceState.updateInterval);
      sequenceState.updateInterval = null;
    }

    practiceActive.style.display = 'none';
    practiceIntro.style.display = 'block';
    btnStart.style.display = 'inline-block';
    btnPauseResume.style.display = 'none';
    btnPauseResume.textContent = 'Pause';
  }

  return {
    start({ shuffle, loop, maxDuration }) {
      let selected = allItems.filter(item => item.selected);

      if (shuffle) {
        selected = shuffleArray(selected);
      }
      sequenceState.selectedItems = selected;
      sequenceState.loop = loop;
      sequenceState.shuffle = shuffle;
      sequenceState.maxDuration = maxDuration;
      sequenceState.currentIndex = 0;
      sequenceState.isPlaying = true;
      sequenceState.isPaused = false;
      sequenceState.startTime = Date.now(); // Record start time

      practiceIntro.style.display = 'none';
      practiceActive.style.display = 'block';

      btnStart.style.display = 'none';
      btnPauseResume.style.display = 'inline-block';
      btnPauseResume.textContent = 'Pause';

      // If user selected a duration limit
      if (maxDuration > 0) {
        const ms = maxDuration * 60000;
        sequenceState.durationTimer = setTimeout(() => {
          stopSequence();
        }, ms);
      }

      // Start updating the UI every second
      sequenceState.updateInterval = setInterval(() => {
        if (sequenceState.isPlaying && !sequenceState.isPaused) {
          updatePracticeDetailsUI();
        }
      }, 100);

      // Immediately update the UI to reflect selected options
      updatePracticeDetailsUI();
      playNext();
    },

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
        currentAudioRef.value.currentTime = 0;
        currentAudioRef.value.play();
      } else {
        playNext();
      }
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

// --- Main DOMContentLoaded setup ---
document.addEventListener('DOMContentLoaded', () => {
  // References
  const lessonContainer = document.getElementById('lesson-container');
  const practiceAudioButton = document.getElementById('practice-audio');
  const practiceAudioSubtext = document.getElementById('practice-audio-subtext');
  const practiceModal = document.getElementById('practice-modal');
  const closeModalButton = document.getElementById('close-modal');

  // “Intro” UI elements
  const aboutToPractice = document.getElementById('about-to-practice');
  const btnStart = document.getElementById('practice-start-btn');

  // “Active” UI elements
  const btnPauseResume = document.getElementById('practice-play-resume-btn');

  // Additional settings
  const durationSelect = document.getElementById('practice-duration');
  const shuffleCheck = document.getElementById('shuffle-check');
  const loopCheck = document.getElementById('loop-check');

  // Track audio & items
  const currentAudio = { value: null };
  const allItems = [];

  // Create the sequence controller
  let sequenceController = null;

  // Show modal if not disabled
  practiceAudioButton.addEventListener('click', () => {
    if (!practiceAudioButton.disabled) {
      practiceModal.style.display = 'block';
      const selectedCount = allItems.filter(item => item.selected).length;
      aboutToPractice.textContent = `You are about to practice ${selectedCount} phrase${selectedCount !== 1 ? 's' : ''}.`;
    }
  });

  // Close modal => stop everything
  closeModalButton.addEventListener('click', () => {
    practiceModal.style.display = 'none';
    if (sequenceController) {
      sequenceController.stop();
    }
  });

  // Clicking outside modal-content also closes
  window.addEventListener('click', (event) => {
    if (event.target === practiceModal) {
      practiceModal.style.display = 'none';
      if (sequenceController) {
        sequenceController.stop();
      }
    }
  });

  // Start button
  btnStart.addEventListener('click', () => {
    if (!sequenceController) {
      sequenceController = createSequenceController(allItems, currentAudio);
    }
    // Gather user-selected options
    const selectedDuration = parseInt(durationSelect.value, 10); // minutes
    const shuffleEnabled = shuffleCheck.checked;
    const loopEnabled = loopCheck.checked;

    sequenceController.start({
      shuffle: shuffleEnabled,
      loop: loopEnabled,
      maxDuration: selectedDuration
    });
  });

  // Pause/Resume button
  btnPauseResume.addEventListener('click', () => {
    if (!sequenceController) return;
    if (btnPauseResume.textContent === 'Pause') {
      sequenceController.pause();
      btnPauseResume.textContent = 'Resume';
    } else {
      sequenceController.resume();
      btnPauseResume.textContent = 'Pause';
    }
  });

  // Build collapsible UI from genData
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
            <td>
              <button class="play-btn" data-lang="${languageCode}" data-audio="${item.audio[languageCode]}">Play</button>
            </td>
          `;
        allItems.push({ id: rowId, data: item, element: row });

        // Row checkbox
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
        updatePracticeAudioButton(practiceAudioButton, practiceAudioSubtext, allItems);
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
      updatePracticeAudioButton(practiceAudioButton, practiceAudioSubtext, allItems);
    });

    lessonContainer.appendChild(langDiv);
  });

  // Individual “Play” button (for single-language playback)
  lessonContainer.addEventListener('click', event => {
    if (event.target.classList.contains('play-btn')) {
      const audioUrl = event.target.dataset.audio;
      playAudio(audioUrl, currentAudio);
    }
  });

  // Initialize the button state
  updatePracticeAudioButton(practiceAudioButton, practiceAudioSubtext, allItems);
});
