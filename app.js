/**
 * Polish Number Listening Practice App
 * Logic, State Management, Voice Synthesis and Polish Number Translator
 */

class PolishNumberPractice {
  constructor() {
    // State Initialization
    this.minRange = 0;
    this.maxRange = 1000;
    this.currentNumber = null;
    this.speechRate = 1.0;
    this.synth = window.speechSynthesis;
    this.polishVoice = null;
    this.voices = [];
    
    // Stats State
    this.stats = {
      correct: 0,
      total: 0,
      streak: 0,
      maxStreak: 0
    };
    
    // History log
    this.history = [];
    
    // UI Selectors
    this.selectors = {
      playBtn: document.getElementById('play-btn'),
      playSlowBtn: document.getElementById('play-slow-btn'),
      userInput: document.getElementById('user-input'),
      checkBtn: document.getElementById('check-btn'),
      revealBtn: document.getElementById('reveal-btn'),
      skipBtn: document.getElementById('skip-btn'),
      feedbackEl: document.getElementById('feedback'),
      feedbackTitle: document.getElementById('feedback-title'),
      feedbackMessage: document.getElementById('feedback-message'),
      feedbackSpelling: document.getElementById('feedback-spelling'),
      rangePresetBtns: document.querySelectorAll('.range-preset-btn'),
      minRangeInput: document.getElementById('min-range'),
      maxRangeInput: document.getElementById('max-range'),
      voiceSelect: document.getElementById('voice-select'),
      statsCorrect: document.getElementById('stats-correct'),
      statsTotal: document.getElementById('stats-total'),
      statsAccuracy: document.getElementById('stats-accuracy'),
      statsStreak: document.getElementById('stats-streak'),
      statsMaxStreak: document.getElementById('stats-max-streak'),
      historyList: document.getElementById('history-list'),
      resetStatsBtn: document.getElementById('reset-stats-btn'),
      voiceWarning: document.getElementById('voice-warning')
    };
  }

  init() {
    this.loadStateFromStorage();
    this.setupEventListeners();
    this.initVoices();
    
    // Web Speech API voices are loaded asynchronously in some browsers
    if (this.synth && this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.initVoices();
    }
    
    // Start first round
    this.newRound();
  }

  loadStateFromStorage() {
    const savedStats = localStorage.getItem('pl_num_stats');
    if (savedStats) {
      try {
        this.stats = JSON.parse(savedStats);
      } catch (e) {
        console.error('Failed to parse saved stats', e);
      }
    }
    
    const savedRange = localStorage.getItem('pl_num_range');
    if (savedRange) {
      try {
        const range = JSON.parse(savedRange);
        this.minRange = range.min;
        this.maxRange = range.max;
        this.selectors.minRangeInput.value = this.minRange;
        this.selectors.maxRangeInput.value = this.maxRange;
        this.updateActiveRangePreset();
      } catch (e) {
        console.error('Failed to parse saved range', e);
      }
    }

    const savedHistory = localStorage.getItem('pl_num_history');
    if (savedHistory) {
      try {
        this.history = JSON.parse(savedHistory);
        this.renderHistory();
      } catch (e) {
        console.error('Failed to parse saved history', e);
      }
    }
    
    const savedRate = localStorage.getItem('pl_num_rate');
    if (savedRate) {
      this.speechRate = parseFloat(savedRate);
    }
    this.updateStatsUI();
  }

  saveStateToStorage() {
    localStorage.setItem('pl_num_stats', JSON.stringify(this.stats));
    localStorage.setItem('pl_num_range', JSON.stringify({ min: this.minRange, max: this.maxRange }));
    localStorage.setItem('pl_num_history', JSON.stringify(this.history));
    localStorage.setItem('pl_num_rate', this.speechRate);
  }

  setupEventListeners() {
    // Play button
    this.selectors.playBtn.addEventListener('click', () => {
      this.speechRate = 1.0;
      this.saveStateToStorage();
      this.speakCurrentNumber(1.0);
    });
    this.selectors.playSlowBtn.addEventListener('click', () => {
      this.speechRate = 0.55;
      this.saveStateToStorage();
      this.speakCurrentNumber(0.55);
    });
    
    // Input action
    this.selectors.checkBtn.addEventListener('click', () => this.checkAnswer());
    this.selectors.userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.checkAnswer();
      }
    });

    // Reveal & Skip
    this.selectors.revealBtn.addEventListener('click', () => this.revealAnswer());
    this.selectors.skipBtn.addEventListener('click', () => this.skipRound());
    
    // Range preset buttons
    this.selectors.rangePresetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const min = parseInt(e.target.dataset.min, 10);
        const max = parseInt(e.target.dataset.max, 10);
        this.minRange = min;
        this.maxRange = max;
        this.selectors.minRangeInput.value = min;
        this.selectors.maxRangeInput.value = max;
        this.updateActiveRangePreset();
        this.saveStateToStorage();
        this.newRound();
      });
    });

    // Custom range inputs
    const handleCustomRangeChange = () => {
      let min = parseInt(this.selectors.minRangeInput.value, 10) || 0;
      let max = parseInt(this.selectors.maxRangeInput.value, 10) || 10;
      
      // Enforce bounds
      if (min < 0) min = 0;
      if (max > 10000) max = 10000;
      if (min > max) {
        // Swap or adjust
        min = max - 1;
        if (min < 0) min = 0;
        this.selectors.minRangeInput.value = min;
      }
      
      this.minRange = min;
      this.maxRange = max;
      this.updateActiveRangePreset();
      this.saveStateToStorage();
    };

    this.selectors.minRangeInput.addEventListener('change', handleCustomRangeChange);
    this.selectors.maxRangeInput.addEventListener('change', handleCustomRangeChange);
    
    // Reset stats
    this.selectors.resetStatsBtn.addEventListener('click', () => this.resetStats());
    
    // Voice select change
    this.selectors.voiceSelect.addEventListener('change', (e) => {
      const selectedIndex = e.target.value;
      if (selectedIndex !== '') {
        this.polishVoice = this.voices[selectedIndex];
        // Speak current number as a small check
        this.speakCurrentNumber();
      }
    });
  }

  updateActiveRangePreset() {
    this.selectors.rangePresetBtns.forEach(btn => {
      const min = parseInt(btn.dataset.min, 10);
      const max = parseInt(btn.dataset.max, 10);
      if (this.minRange === min && this.maxRange === max) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  initVoices() {
    if (!this.synth) return;
    
    // Get all system voices
    const allVoices = this.synth.getVoices();
    this.voices = allVoices.filter(voice => voice.lang.includes('pl-PL') || voice.lang.startsWith('pl'));
    
    // Populate voice dropdown
    this.selectors.voiceSelect.innerHTML = '';
    
    if (this.voices.length === 0) {
      // Fallback: If no Polish voice is available, show system default voices
      this.selectors.voiceSelect.innerHTML = '<option value="">No Polish voice found - falling back to browser default</option>';
      this.selectors.voiceWarning.style.display = 'block';
      
      // Attempt to load standard voices anyway
      this.voices = allVoices;
      allVoices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        this.selectors.voiceSelect.appendChild(option);
      });
      this.polishVoice = allVoices.find(voice => voice.default) || allVoices[0];
    } else {
      this.selectors.voiceWarning.style.display = 'none';
      
      this.voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        // Prefer Google voice if available, or first polish voice
        if (voice.name.includes('Google') || voice.name.includes('Natural')) {
          option.selected = true;
          this.polishVoice = voice;
        }
        this.selectors.voiceSelect.appendChild(option);
      });
      
      if (!this.polishVoice) {
        this.polishVoice = this.voices[0];
      }
    }
  }

  numberToPolishWords(n) {
    if (n === 0) return 'zero';
    
    const units = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
    const teens = ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
    const tens = ['', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
    const hundreds = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset', 'dziewięćset'];

    let parts = [];

    // Thousands (Up to 10000)
    let thousandsVal = Math.floor(n / 1000);
    let remainder = n % 1000;

    if (thousandsVal > 0) {
      if (thousandsVal === 1) {
        parts.push('tysiąc');
      } else {
        let thWord = this.numberToPolishWords(thousandsVal);
        let lastDigit = thousandsVal % 10;
        let lastTwo = thousandsVal % 100;
        
        if (lastTwo >= 11 && lastTwo <= 19) {
          parts.push(thWord + ' tysięcy');
        } else if (lastDigit >= 2 && lastDigit <= 4) {
          parts.push(thWord + ' tysiące');
        } else {
          parts.push(thWord + ' tysięcy');
        }
      }
    }

    // Hundreds
    let hundredsVal = Math.floor(remainder / 100);
    remainder = remainder % 100;
    if (hundredsVal > 0) {
      parts.push(hundreds[hundredsVal]);
    }

    // Tens and units
    if (remainder >= 10 && remainder <= 19) {
      parts.push(teens[remainder - 10]);
    } else {
      let tensVal = Math.floor(remainder / 10);
      let unitsVal = remainder % 10;
      
      if (tensVal > 0) {
        parts.push(tens[tensVal]);
      }
      if (unitsVal > 0) {
        parts.push(units[unitsVal]);
      }
    }

    return parts.filter(Boolean).join(' ');
  }

  generateNumber() {
    const range = this.maxRange - this.minRange + 1;
    return Math.floor(Math.random() * range) + this.minRange;
  }

  newRound() {
    this.currentNumber = this.generateNumber();
    this.selectors.userInput.value = '';
    this.selectors.userInput.focus();
    
    // Hide feedback
    this.selectors.feedbackEl.className = 'feedback hidden';
    
    // Re-enable interactive elements
    this.selectors.userInput.disabled = false;
    this.selectors.checkBtn.disabled = false;
    this.selectors.revealBtn.disabled = false;
    
    // Automatically speak the number
    // Set a tiny timeout to ensure page handles any initial loading/focus first
    setTimeout(() => {
      this.speakCurrentNumber();
    }, 150);
  }

  speakCurrentNumber(speed = null) {
    if (this.currentNumber === null) return;
    const rate = speed !== null ? speed : this.speechRate;
    const words = this.numberToPolishWords(this.currentNumber);
    this.speakText(words, rate);
  }

  speakText(text, speed = 1.0) {
    if (!this.synth) return;
    
    // Cancel active synthesis
    this.synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.polishVoice) {
      utterance.voice = this.polishVoice;
    }
    
    // If fallback voice, we try to force 'pl-PL' lang attribute
    utterance.lang = 'pl-PL';
    utterance.rate = speed;
    utterance.pitch = 1.0;
    
    // Add visual playing indicators on the button
    const activeBtn = speed < 0.8 ? this.selectors.playSlowBtn : this.selectors.playBtn;
    activeBtn.classList.add('playing');
    
    utterance.onend = () => {
      activeBtn.classList.remove('playing');
    };
    
    utterance.onerror = () => {
      activeBtn.classList.remove('playing');
    };
    
    this.synth.speak(utterance);
  }

  checkAnswer() {
    const userValString = this.selectors.userInput.value.trim();
    if (userValString === '') return;
    
    const userVal = parseInt(userValString, 10);
    const isCorrect = userVal === this.currentNumber;
    const spelling = this.numberToPolishWords(this.currentNumber);
    
    // Update stats
    this.stats.total += 1;
    if (isCorrect) {
      this.stats.correct += 1;
      this.stats.streak += 1;
      if (this.stats.streak > this.stats.maxStreak) {
        this.stats.maxStreak = this.stats.streak;
      }
      this.showFeedback(true, spelling);
    } else {
      this.stats.streak = 0;
      this.showFeedback(false, spelling);
    }
    
    // Add to history
    this.history.unshift({
      id: Date.now(),
      number: this.currentNumber,
      guess: userVal,
      correct: isCorrect,
      spelling: spelling
    });
    
    // Limit history length to 20
    if (this.history.length > 20) {
      this.history.pop();
    }
    
    // Disable inputs until next round
    this.selectors.userInput.disabled = true;
    this.selectors.checkBtn.disabled = true;
    this.selectors.revealBtn.disabled = true;
    
    this.saveStateToStorage();
    this.updateStatsUI();
    this.renderHistory();
    
    // Auto advance after 2.5 seconds if correct, or let user click 'Next'
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary next-round-btn';
    nextBtn.id = 'next-round-btn';
    nextBtn.innerHTML = 'Następny (Next) <span class="kbd">Enter</span>';
    
    // Remove any previous next button
    const existingNext = document.getElementById('next-round-btn');
    if (existingNext) existingNext.remove();
    
    this.selectors.feedbackEl.appendChild(nextBtn);
    nextBtn.focus();
    
    nextBtn.addEventListener('click', () => {
      nextBtn.remove();
      this.newRound();
    });
    
    // Bind Enter key to next button
    const nextKeyListener = (e) => {
      if (e.key === 'Enter') {
        document.removeEventListener('keydown', nextKeyListener);
        const btn = document.getElementById('next-round-btn');
        if (btn) {
          btn.click();
        }
      }
    };
    document.addEventListener('keydown', nextKeyListener);
  }

  revealAnswer() {
    if (this.currentNumber === null) return;
    const spelling = this.numberToPolishWords(this.currentNumber);
    
    // Fail current round but reveal answer
    this.stats.total += 1;
    this.stats.streak = 0;
    
    this.showFeedback(false, spelling, true);
    
    this.history.unshift({
      id: Date.now(),
      number: this.currentNumber,
      guess: null,
      correct: false,
      spelling: spelling,
      revealed: true
    });
    
    if (this.history.length > 20) {
      this.history.pop();
    }
    
    this.selectors.userInput.disabled = true;
    this.selectors.checkBtn.disabled = true;
    this.selectors.revealBtn.disabled = true;
    
    this.saveStateToStorage();
    this.updateStatsUI();
    this.renderHistory();
    
    // Add next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary next-round-btn';
    nextBtn.id = 'next-round-btn';
    nextBtn.innerHTML = 'Następny (Next) <span class="kbd">Enter</span>';
    
    const existingNext = document.getElementById('next-round-btn');
    if (existingNext) existingNext.remove();
    
    this.selectors.feedbackEl.appendChild(nextBtn);
    nextBtn.focus();
    
    nextBtn.addEventListener('click', () => {
      nextBtn.remove();
      this.newRound();
    });
    
    const nextKeyListener = (e) => {
      if (e.key === 'Enter') {
        document.removeEventListener('keydown', nextKeyListener);
        const btn = document.getElementById('next-round-btn');
        if (btn) {
          btn.click();
        }
      }
    };
    document.addEventListener('keydown', nextKeyListener);
  }

  skipRound() {
    this.newRound();
  }

  showFeedback(isCorrect, spelling, isRevealed = false) {
    this.selectors.feedbackEl.classList.remove('hidden', 'correct', 'incorrect');
    
    // Remove previous next-round buttons from feedback
    const existingNext = document.getElementById('next-round-btn');
    if (existingNext) existingNext.remove();
    
    if (isCorrect) {
      this.selectors.feedbackEl.classList.add('correct');
      this.selectors.feedbackTitle.textContent = 'Dobrze! (Correct!) 🎉';
      this.selectors.feedbackMessage.innerHTML = `Liczba (Number): <strong>${this.currentNumber}</strong>`;
    } else {
      this.selectors.feedbackEl.classList.add('incorrect');
      if (isRevealed) {
        this.selectors.feedbackTitle.textContent = 'Odkryty (Revealed)';
      } else {
        this.selectors.feedbackTitle.textContent = 'Źle (Incorrect) 😢';
      }
      this.selectors.feedbackMessage.innerHTML = `Poprawna odpowiedź (Correct answer): <strong>${this.currentNumber}</strong>`;
    }
    
    this.selectors.feedbackSpelling.innerHTML = `Słownie (In words): <span class="polish-spelling-highlight">${spelling}</span>`;
  }

  updateStatsUI() {
    const accuracy = this.stats.total > 0 
      ? Math.round((this.stats.correct / this.stats.total) * 100) 
      : 0;
      
    this.selectors.statsCorrect.textContent = this.stats.correct;
    this.selectors.statsTotal.textContent = this.stats.total;
    this.selectors.statsAccuracy.textContent = `${accuracy}%`;
    this.selectors.statsStreak.textContent = this.stats.streak;
    this.selectors.statsMaxStreak.textContent = this.stats.maxStreak;
  }

  renderHistory() {
    this.selectors.historyList.innerHTML = '';
    
    if (this.history.length === 0) {
      this.selectors.historyList.innerHTML = '<li class="history-empty">Brak historii sesji (No session history yet)</li>';
      return;
    }
    
    this.history.forEach(item => {
      const li = document.createElement('li');
      li.className = `history-item ${item.correct ? 'history-correct' : 'history-incorrect'}`;
      
      const badge = item.correct 
        ? '<span class="history-badge badge-correct">✓</span>' 
        : '<span class="history-badge badge-incorrect">✗</span>';
        
      const guessStr = item.revealed 
        ? '<i>revealed</i>' 
        : (item.guess !== null ? item.guess : 'None');
      
      li.innerHTML = `
        <div class="history-header">
          ${badge}
          <span class="history-number">${item.number}</span>
          <span class="history-guess">Guess: ${guessStr}</span>
          <button class="history-replay-btn" title="Replay Audio" data-text="${item.spelling}">🔊</button>
        </div>
        <div class="history-spelling">${item.spelling}</div>
      `;
      
      // Wire up replay button
      const replayBtn = li.querySelector('.history-replay-btn');
      replayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const textToSpeak = e.target.dataset.text;
        this.speakText(textToSpeak, 1.0);
      });
      
      this.selectors.historyList.appendChild(li);
    });
  }

  resetStats() {
    if (confirm('Czy na pewno chcesz zresetować statystyki? (Are you sure you want to reset stats?)')) {
      this.stats = {
        correct: 0,
        total: 0,
        streak: 0,
        maxStreak: 0
      };
      this.history = [];
      this.saveStateToStorage();
      this.updateStatsUI();
      this.renderHistory();
      this.newRound();
    }
  }
}

// Instantiate and start on load
window.addEventListener('DOMContentLoaded', () => {
  const app = new PolishNumberPractice();
  app.init();
  
  // Expose to window for console diagnostics if needed
  window.appInstance = app;
});
