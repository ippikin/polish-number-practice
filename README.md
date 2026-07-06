# Liczby po Polsku | Polish Number Listening Practice

A premium, responsive, glassmorphic Single Page Application designed to help language learners practice listening to and spelling Polish numbers from **0 up to 10,000**.

## 🌐 Live Demo
Play it live here: [https://ippikin.github.io/polish-number-practice/](https://ippikin.github.io/polish-number-practice/)

---

## 🚀 Key Features

* **Speech Synthesis Control**: 
  * Play buttons triggers the browser's native Web Speech synthesis (`pl-PL`).
  * Features a **slow speech speed toggle (0.55x)** to assist with fast Polish pronunciation and complex consonant clusters.
  * Dropdown selector allows switching between different Polish voice engines installed on the device.
* **Polish Number Translating Algorithm**:
  * An accurate, custom JS helper translating any integer up to 10,000 to correct written Polish words.
  * Correctly handles grammatical declension rules for thousands (e.g. `tysiąc` vs. `tysiące` vs. `tysięcy`).
* **Interactive Feedback & Hints**:
  * Visual feedback indicates correct or incorrect guesses with neon-pink and emerald accents.
  * A "Reveal" button displays both the digits and the spelling when stuck.
* **Configurable Ranges**:
  * Quick-preset buttons (`0-10`, `0-100`, `0-1,000`, `0-10,000`).
  * Custom min/max inputs to specify a exact range to study.
* **Gamified Stats & Session History**:
  * Tracks total rounds, correct answers, accuracy percentage, and current vs. best streaks.
  * Logging panel displays the last 20 answers with a replay audio button for easy review.
  * LocalStorage saves statistics and configurations automatically.

---

## 🛠️ Technology Stack
* **HTML5**: Structured semantic layout.
* **CSS3**: Vanilla glassmorphism layout, Outfit & Plus Jakarta Sans typography, and subtle micro-animations.
* **JavaScript**: State management, speech synthesis wrapper, and translation helper.

---

## 💻 Running Locally
1. Clone this repository:
   ```bash
   git clone https://github.com/ippikin/polish-number-practice.git
   ```
2. Open `index.html` in any web browser.


 
