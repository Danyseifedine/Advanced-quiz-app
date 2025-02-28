// Quiz data - questions, options and answers
const quizData = [
    {
        question: "What is the capital city of France?",
        options: ["London", "Paris", "Berlin", "Madrid"],
        correctAnswer: 1, // Paris
        coordinates: [
            [51.5074, -0.1278], // London
            [48.8566, 2.3522],  // Paris
            [52.5200, 13.4050], // Berlin
            [40.4168, -3.7038]  // Madrid
        ]
    },
    {
        question: "Which city is known as the 'Eternal City'?",
        options: ["Athens", "Cairo", "Rome", "Jerusalem"],
        correctAnswer: 2, // Rome
        coordinates: [
            [37.9838, 23.7275], // Athens
            [30.0444, 31.2357], // Cairo
            [41.9028, 12.4964], // Rome
            [31.7683, 35.2137]  // Jerusalem
        ]
    },
    {
        question: "Which country is home to the Great Barrier Reef?",
        options: ["Brazil", "Australia", "Thailand", "Mexico"],
        correctAnswer: 1, // Australia
        coordinates: [
            [-14.2350, -51.9253], // Brazil
            [-25.2744, 133.7751], // Australia
            [15.8700, 100.9925],  // Thailand
            [23.6345, -102.5528]  // Mexico
        ]
    },
    {
        question: "Which mountain range separates Europe from Asia?",
        options: ["Alps", "Andes", "Himalayas", "Ural Mountains"],
        correctAnswer: 3, // Ural Mountains
        coordinates: [
            [46.8182, 8.2275],    // Alps
            [-32.0000, -71.5000], // Andes
            [27.9881, 86.9250],   // Himalayas
            [60.0000, 60.0000]    // Ural Mountains
        ]
    },
    {
        question: "Which city is located at the mouth of the Amazon River?",
        options: ["Manaus", "Belém", "Rio de Janeiro", "Lima"],
        correctAnswer: 1, // Belém
        coordinates: [
            [-3.1190, -60.0217],  // Manaus
            [-1.4558, -48.5039],  // Belém
            [-22.9068, -43.1729], // Rio de Janeiro
            [-12.0464, -77.0428]  // Lima
        ]
    }
];

// Quiz state variables
let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 45;
let timerInterval;
let userAnswers = new Array(quizData.length).fill(null);

// DOM Elements
const questionNumberElement = document.querySelector('.question-number');
const questionTextElement = document.querySelector('.question-text');
const optionsContainer = document.querySelector('.options-container');
const progressBar = document.querySelector('.progress');
const progressText = document.querySelector('.progress-text');
const timerElement = document.querySelector('.timer span');
const prevButton = document.querySelector('.btn-secondary');
const nextButton = document.querySelector('.btn-primary');
const themeSwitch = document.getElementById('theme-switch');

// Voice narration for questions and feedback
let speechSynthesis = window.speechSynthesis;
let isSpeechEnabled = false;

// Add speech toggle button to the header
function addSpeechToggle() {
    const headerDiv = document.querySelector('header');
    const speechToggle = document.createElement('div');
    speechToggle.className = 'speech-toggle';
    speechToggle.innerHTML = `
        <input type="checkbox" id="speech-switch" class="speech-switch">
        <label for="speech-switch" class="speech-switch-label">
            <i class="fas fa-volume-mute mute-icon"></i>
            <i class="fas fa-volume-up unmute-icon"></i>
            <span class="slider"></span>
        </label>
    `;
    headerDiv.appendChild(speechToggle);

    // Add event listener
    document.getElementById('speech-switch').addEventListener('change', function () {
        isSpeechEnabled = this.checked;
        if (isSpeechEnabled) {
            speakText(`Speech narration enabled. ${quizData[currentQuestionIndex].question}`);
        } else {
            speechSynthesis.cancel();
        }
    });
}

// Function to speak text
function speakText(text) {
    if (!isSpeechEnabled) return;

    speechSynthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
}

// Add confetti effect for correct answers
function showConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);

    // Create confetti pieces
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.backgroundColor = getRandomColor();
        confettiContainer.appendChild(confetti);
    }

    // Remove confetti after animation
    setTimeout(() => {
        confettiContainer.remove();
    }, 3000);
}

// Get random color for confetti
function getRandomColor() {
    const colors = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#577590'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Add difficulty selector
function addDifficultySelector() {
    // Create difficulty modal
    const difficultyModal = document.createElement('div');
    difficultyModal.className = 'difficulty-modal';
    difficultyModal.innerHTML = `
        <div class="difficulty-content">
            <h2>Select Difficulty</h2>
            <p>Choose your challenge level:</p>
            <div class="difficulty-buttons">
                <button class="difficulty-btn" data-time="60" data-multiplier="1">Easy</button>
                <button class="difficulty-btn" data-time="45" data-multiplier="1.5">Medium</button>
                <button class="difficulty-btn" data-time="30" data-multiplier="2">Hard</button>
                <button class="difficulty-btn" data-time="15" data-multiplier="3">Expert</button>
            </div>
        </div>
    `;
    document.body.appendChild(difficultyModal);

    // Add event listeners to difficulty buttons
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Set difficulty
            const timePerQuestion = parseInt(this.getAttribute('data-time'));
            const scoreMultiplier = parseFloat(this.getAttribute('data-multiplier'));

            // Store in localStorage
            localStorage.setItem('quizTimePerQuestion', timePerQuestion);
            localStorage.setItem('quizScoreMultiplier', scoreMultiplier);

            // Remove modal and start quiz
            difficultyModal.remove();
            initQuiz();
        });
    });
}

// Add hint system
let hintsUsed = 0;
const maxHints = 2;

function fixHintSystem() {
    // First, check if hint button already exists to avoid duplicates
    if (!document.querySelector('.hint-btn')) {
        addHintButton();
    }

    // Add CSS for eliminated options if not already added
    addEliminatedOptionStyles();
}

function addHintButton() {
    const quizContainer = document.querySelector('.quiz-container');
    if (!quizContainer) return; // Safety check

    const hintButton = document.createElement('button');
    hintButton.className = 'btn hint-btn';
    hintButton.innerHTML = `<i class="fas fa-lightbulb"></i> Use Hint (${maxHints - hintsUsed} left)`;

    // Disable if no hints left
    if (hintsUsed >= maxHints) {
        hintButton.disabled = true;
        hintButton.classList.add('disabled');
    }

    // Add event listener
    hintButton.addEventListener('click', showHint);

    // Insert before navigation buttons
    const navButtons = document.querySelector('.navigation-buttons');
    if (navButtons) {
        quizContainer.insertBefore(hintButton, navButtons);
    } else {
        // Fallback - append to quiz container
        quizContainer.appendChild(hintButton);
    }
}

function showHint() {
    if (hintsUsed >= maxHints) {
        showToast('No hints remaining!', 2000);
        return;
    }

    const currentQuestion = quizData[currentQuestionIndex];
    const correctOptionIndex = currentQuestion.correctAnswer;

    // Get all incorrect options
    const incorrectOptions = [];
    const options = document.querySelectorAll('.option');

    options.forEach((option, index) => {
        const input = option.querySelector('.option-input');
        const optionIndex = parseInt(input.value);

        // Check if this option is not the correct one and not already eliminated
        if (optionIndex !== correctOptionIndex && !option.classList.contains('eliminated')) {
            incorrectOptions.push(option);
        }
    });

    // If there are no incorrect options left to eliminate
    if (incorrectOptions.length === 0) {
        showToast('No more incorrect options to eliminate!', 2000);
        return;
    }

    // Randomly remove one incorrect option
    const randomIndex = Math.floor(Math.random() * incorrectOptions.length);
    const optionToEliminate = incorrectOptions[randomIndex];

    // Mark as eliminated
    optionToEliminate.classList.add('eliminated');

    // Disable the input
    const optionInput = optionToEliminate.querySelector('.option-input');
    if (optionInput) {
        optionInput.disabled = true;
    }

    // Update hint button
    hintsUsed++;
    updateHintButton();

    // Show toast notification
    showToast('Hint used! One incorrect option eliminated.', 2000);

    // If speech is enabled, announce the hint
    if (isSpeechEnabled) {
        speakText('One incorrect option has been eliminated.');
    }
}

// Update hint button state
function updateHintButton() {
    const hintBtn = document.querySelector('.hint-btn');
    if (hintBtn) {
        hintBtn.innerHTML = `<i class="fas fa-lightbulb"></i> Use Hint (${maxHints - hintsUsed} left)`;

        if (hintsUsed >= maxHints) {
            hintBtn.disabled = true;
            hintBtn.classList.add('disabled');
        }
    }
}

// Add toast notification system
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Add streak counter
let currentStreak = 0;
let bestStreak = 0;

function updateStreak(isCorrect) {
    if (isCorrect) {
        currentStreak++;
        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
            localStorage.setItem('quizBestStreak', bestStreak);
            showToast(`New streak record: ${bestStreak}! 🔥`);
        }

        // Show streak milestone messages
        if (currentStreak === 3) {
            showToast('3 correct answers in a row! Keep going! 🔥');
        } else if (currentStreak === 5) {
            showToast('5 streak! You\'re on fire! 🔥🔥🔥');
            showConfetti();
        }
    } else {
        if (currentStreak >= 3) {
            showToast(`Streak ended at ${currentStreak}. Try again!`);
        }
        currentStreak = 0;
    }

    // Update streak display
    updateStreakDisplay();
}

function updateStreakDisplay() {
    let streakDisplay = document.querySelector('.streak-display');

    if (!streakDisplay) {
        streakDisplay = document.createElement('div');
        streakDisplay.className = 'streak-display';
        const quizHeader = document.querySelector('.quiz-header');
        quizHeader.appendChild(streakDisplay);
    }

    streakDisplay.innerHTML = `
        <div class="current-streak ${currentStreak > 0 ? 'active' : ''}">
            <i class="fas fa-fire"></i> ${currentStreak}
        </div>
        <div class="best-streak">
            <i class="fas fa-trophy"></i> ${bestStreak}
        </div>
    `;
}

// Add live feedback on answer selection
function addLiveFeedback() {
    // Override the original createOptionElement function to add feedback
    const originalCreateOptionElement = createOptionElement;

    createOptionElement = function (optionText, optionIndex, questionIndex) {
        const optionDiv = originalCreateOptionElement(optionText, optionIndex, questionIndex);

        // Add enhanced event listener to the radio input
        const radioInput = optionDiv.querySelector('.option-input');
        const originalEventListener = radioInput.onchange;

        radioInput.addEventListener('change', () => {
            // Call original event listener
            if (originalEventListener) originalEventListener();

            // Add feedback
            const isCorrect = optionIndex === quizData[questionIndex].correctAnswer;
            const allOptions = document.querySelectorAll('.option');

            // Disable all options after selection
            allOptions.forEach(opt => {
                opt.querySelector('.option-input').disabled = true;
                opt.classList.add('disabled');
            });

            // Show correct/incorrect feedback
            optionDiv.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');

            // If correct, show the confetti effect
            if (isCorrect) {
                showConfetti();
                speakText('Correct!');
            } else {
                // Show which one was correct
                allOptions[quizData[questionIndex].correctAnswer].classList.add('show-correct');
                speakText('Incorrect. The correct answer is ' +
                    quizData[questionIndex].options[quizData[questionIndex].correctAnswer]);
            }

            // Update streak
            updateStreak(isCorrect);

            // Auto-advance after a delay
            setTimeout(() => {
                if (currentQuestionIndex < quizData.length - 1) {
                    goToNextQuestion();
                }
            }, 2000);
        });

        return optionDiv;
    };
}

// Add achievement system
const achievements = [
    { id: 'first_quiz', title: 'First Steps', description: 'Complete your first quiz', unlocked: false },
    { id: 'perfect_score', title: 'Perfectionist', description: 'Get a perfect score', unlocked: false },
    { id: 'speed_demon', title: 'Speed Demon', description: 'Complete a quiz in under 2 minutes', unlocked: false },
    { id: 'streak_master', title: 'Streak Master', description: 'Get a streak of 5 correct answers', unlocked: false },
    { id: 'night_owl', title: 'Night Owl', description: 'Complete a quiz in dark mode', unlocked: false }
];

function loadAchievements() {
    const savedAchievements = localStorage.getItem('quizAchievements');
    if (savedAchievements) {
        const parsed = JSON.parse(savedAchievements);
        parsed.forEach((saved, index) => {
            if (saved.unlocked) {
                achievements[index].unlocked = true;
            }
        });
    }
}

function unlockAchievement(id) {
    const achievement = achievements.find(a => a.id === id);
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        localStorage.setItem('quizAchievements', JSON.stringify(achievements));

        // Show notification
        showAchievementNotification(achievement);
    }
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-text">
            <h3>Achievement Unlocked!</h3>
            <h4>${achievement.title}</h4>
            <p>${achievement.description}</p>
        </div>
    `;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
}

// Check achievements at the end of quiz
function checkAchievements(finalScore, timeTaken) {
    // First quiz
    unlockAchievement('first_quiz');

    // Perfect score
    if (finalScore === quizData.length) {
        unlockAchievement('perfect_score');
    }

    // Speed demon (under 2 minutes)
    if (timeTaken < 120) {
        unlockAchievement('speed_demon');
    }

    // Streak master
    if (bestStreak >= 5) {
        unlockAchievement('streak_master');
    }

    // Night owl
    if (document.body.classList.contains('dark-theme')) {
        unlockAchievement('night_owl');
    }
}

// Track quiz time
let quizStartTime;
let quizEndTime;

// Add these small but extraordinary features after all the existing code but before the DOMContentLoaded event listener

// 1. Emoji Reactions for Questions
function addEmojiReactions() {
    const quizContainer = document.querySelector('.quiz-container');
    const emojiReactionBar = document.createElement('div');
    emojiReactionBar.className = 'emoji-reaction-bar';
    emojiReactionBar.innerHTML = `
        <div class="emoji-reaction-title">How do you feel about this question?</div>
        <div class="emoji-reactions">
            <div class="emoji-reaction" data-emoji="easy">😊 Easy</div>
            <div class="emoji-reaction" data-emoji="thinking">🤔 Thinking</div>
            <div class="emoji-reaction" data-emoji="hard">😓 Hard</div>
            <div class="emoji-reaction" data-emoji="confused">😵 Confused</div>
        </div>
    `;

    // Insert before navigation buttons
    const navButtons = document.querySelector('.navigation-buttons');
    quizContainer.insertBefore(emojiReactionBar, navButtons);

    // Add event listeners
    const emojiReactions = document.querySelectorAll('.emoji-reaction');
    emojiReactions.forEach(emoji => {
        emoji.addEventListener('click', function () {
            // Remove active class from all emojis
            emojiReactions.forEach(e => e.classList.remove('active'));

            // Add active class to clicked emoji
            this.classList.add('active');

            // Show feedback
            const emojiType = this.getAttribute('data-emoji');
            let message = '';

            switch (emojiType) {
                case 'easy':
                    message = "Great! You've got this!";
                    break;
                case 'thinking':
                    message = "Take your time to think it through!";
                    break;
                case 'hard':
                    message = "Challenging questions help you learn!";
                    break;
                case 'confused':
                    message = "Don't worry! Try using a hint or eliminating options.";
                    break;
            }

            showToast(message, 2000);
        });
    });
}

// 2. Focus Mode
function addFocusMode() {
    const headerDiv = document.querySelector('header');
    const focusModeButton = document.createElement('button');
    focusModeButton.className = 'focus-mode-btn';
    focusModeButton.innerHTML = '<i class="fas fa-compress-alt"></i>';
    focusModeButton.title = "Toggle Focus Mode";
    headerDiv.appendChild(focusModeButton);

    focusModeButton.addEventListener('click', toggleFocusMode);

    function toggleFocusMode() {
        document.body.classList.toggle('focus-mode');

        if (document.body.classList.contains('focus-mode')) {
            focusModeButton.innerHTML = '<i class="fas fa-expand-alt"></i>';
            showToast('Focus Mode activated. Distractions minimized.', 2000);
        } else {
            focusModeButton.innerHTML = '<i class="fas fa-compress-alt"></i>';
            showToast('Focus Mode deactivated.', 2000);
        }
    }
}

// 3. Personal Notes Feature
function addNotesFeature() {
    const quizContainer = document.querySelector('.quiz-container');
    const notesButton = document.createElement('button');
    notesButton.className = 'notes-btn';
    notesButton.innerHTML = '<i class="fas fa-sticky-note"></i> Add Note';

    // Insert before navigation buttons
    const navButtons = document.querySelector('.navigation-buttons');
    quizContainer.insertBefore(notesButton, navButtons);

    notesButton.addEventListener('click', toggleNotes);

    // Create notes container (initially hidden)
    const notesContainer = document.createElement('div');
    notesContainer.className = 'notes-container hidden';
    notesContainer.innerHTML = `
        <textarea class="notes-textarea" placeholder="Add your notes for this question here..."></textarea>
        <div class="notes-actions">
            <button class="save-note-btn">Save Note</button>
            <button class="close-note-btn">Close</button>
        </div>
    `;
    quizContainer.insertBefore(notesContainer, navButtons);

    // Load existing note if any
    const savedNotes = JSON.parse(localStorage.getItem('quizNotes') || '{}');

    function toggleNotes() {
        notesContainer.classList.toggle('hidden');

        if (!notesContainer.classList.contains('hidden')) {
            // Load note for current question
            const noteKey = `question_${currentQuestionIndex}`;
            const noteTextarea = document.querySelector('.notes-textarea');
            noteTextarea.value = savedNotes[noteKey] || '';
            noteTextarea.focus();

            // Scroll to make sure notes are visible
            notesContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // Add event listeners for save and close
    document.querySelector('.save-note-btn').addEventListener('click', saveNote);
    document.querySelector('.close-note-btn').addEventListener('click', toggleNotes);

    function saveNote() {
        const noteTextarea = document.querySelector('.notes-textarea');
        const noteText = noteTextarea.value.trim();
        const noteKey = `question_${currentQuestionIndex}`;

        // Save to localStorage
        if (noteText) {
            savedNotes[noteKey] = noteText;
            localStorage.setItem('quizNotes', JSON.stringify(savedNotes));
            showToast('Note saved!', 1500);

            // Add indicator that this question has a note
            updateNoteIndicator(true);
        } else {
            // Remove note if empty
            delete savedNotes[noteKey];
            localStorage.setItem('quizNotes', JSON.stringify(savedNotes));

            // Remove indicator
            updateNoteIndicator(false);
        }

        toggleNotes(); // Close notes panel
    }

    function updateNoteIndicator(hasNote) {
        // Remove existing indicator if any
        const existingIndicator = document.querySelector('.has-note-indicator');
        if (existingIndicator) existingIndicator.remove();

        if (hasNote) {
            const questionText = document.querySelector('.question-text');
            // Add new indicator
            const noteIndicator = document.createElement('span');
            noteIndicator.className = 'has-note-indicator';
            noteIndicator.innerHTML = '<i class="fas fa-sticky-note"></i>';
            noteIndicator.title = "Click to view your note";
            noteIndicator.style.cursor = "pointer";

            // Make the indicator clickable
            noteIndicator.addEventListener('click', toggleNotes);

            questionText.appendChild(noteIndicator);
        }
    }

    // Check if current question has a note and add indicator if needed
    function checkForExistingNote() {
        const noteKey = `question_${currentQuestionIndex}`;
        if (savedNotes[noteKey]) {
            updateNoteIndicator(true);
        }
    }

    // Call this function when loading a question
    const originalLoadQuestion = loadQuestion;
    loadQuestion = function (index) {
        originalLoadQuestion(index);

        // Check if this question has a note
        const noteKey = `question_${index}`;
        if (savedNotes[noteKey]) {
            updateNoteIndicator(true);
        } else {
            updateNoteIndicator(false);
        }
    };

    // Check for existing note on current question
    checkForExistingNote();
}

// 4. Keyboard Shortcuts
function addKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
        // Only process if not typing in an input or textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case 'ArrowRight':
                // Next question
                if (!document.querySelector('.btn-primary').disabled) {
                    goToNextQuestion();
                }
                break;
            case 'ArrowLeft':
                // Previous question
                if (!document.querySelector('.btn-secondary').disabled) {
                    goToPreviousQuestion();
                }
                break;
            case '1': case '2': case '3': case '4':
                // Select option
                const optionIndex = parseInt(e.key) - 1;
                const optionInput = document.getElementById(`option${optionIndex + 1}`);
                if (optionInput && !optionInput.disabled) {
                    optionInput.checked = true;
                    optionInput.dispatchEvent(new Event('change'));
                }
                break;
            case 'h':
                // Use hint
                const hintBtn = document.querySelector('.hint-btn');
                if (hintBtn && !hintBtn.disabled) {
                    showHint();
                }
                break;
            case 'f':
                // Toggle focus mode
                if (document.querySelector('.focus-mode-btn')) {
                    document.querySelector('.focus-mode-btn').click();
                }
                break;
            case 'n':
                // Toggle notes
                if (document.querySelector('.notes-btn')) {
                    document.querySelector('.notes-btn').click();
                }
                break;
        }
    });

    // Show keyboard shortcuts help
    const headerDiv = document.querySelector('header');
    const shortcutsButton = document.createElement('button');
    shortcutsButton.className = 'shortcuts-btn';
    shortcutsButton.innerHTML = '<i class="fas fa-keyboard"></i>';
    shortcutsButton.title = "Keyboard Shortcuts";
    headerDiv.appendChild(shortcutsButton);

    shortcutsButton.addEventListener('click', showShortcutsHelp);

    function showShortcutsHelp() {
        const shortcutsModal = document.createElement('div');
        shortcutsModal.className = 'shortcuts-modal';
        shortcutsModal.innerHTML = `
            <div class="shortcuts-content">
                <h2>Keyboard Shortcuts</h2>
                <div class="shortcuts-list">
                    <div class="shortcut-item">
                        <div class="shortcut-key">→</div>
                        <div class="shortcut-desc">Next question</div>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-key">←</div>
                        <div class="shortcut-desc">Previous question</div>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-key">1-4</div>
                        <div class="shortcut-desc">Select answer option</div>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-key">H</div>
                        <div class="shortcut-desc">Use hint</div>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-key">F</div>
                        <div class="shortcut-desc">Toggle focus mode</div>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-key">N</div>
                        <div class="shortcut-desc">Open notes</div>
                    </div>
                </div>
                <button class="close-shortcuts-btn">Close</button>
            </div>
        `;
        document.body.appendChild(shortcutsModal);

        document.querySelector('.close-shortcuts-btn').addEventListener('click', () => {
            shortcutsModal.remove();
        });
    }
}

// Bookmark feature
let bookmarkedQuestions = [];

function addBookmarkFeature() {
    // Load bookmarked questions from localStorage
    bookmarkedQuestions = JSON.parse(localStorage.getItem('quizBookmarks') || '[]');

    // Add bookmark button to each question
    addBookmarkButton(currentQuestionIndex);

    // Add bookmarks view button to header
    addBookmarksViewButton();
}

function addBookmarkButton(index) {
    // Check if bookmark button already exists
    if (!document.querySelector('.bookmark-btn')) {
        const questionContainer = document.querySelector('.question-container');
        if (!questionContainer) return;

        // Create bookmark button
        const bookmarkBtn = document.createElement('button');
        bookmarkBtn.className = 'bookmark-btn';
        bookmarkBtn.innerHTML = bookmarkedQuestions.includes(index) ?
            '<i class="fas fa-bookmark"></i>' :
            '<i class="far fa-bookmark"></i>';
        bookmarkBtn.title = bookmarkedQuestions.includes(index) ?
            "Remove bookmark" : "Bookmark this question";

        questionContainer.appendChild(bookmarkBtn);

        // Add event listener
        bookmarkBtn.addEventListener('click', toggleBookmark);
    } else {
        // Update existing bookmark button
        const bookmarkBtn = document.querySelector('.bookmark-btn');
        bookmarkBtn.innerHTML = bookmarkedQuestions.includes(index) ?
            '<i class="fas fa-bookmark"></i>' :
            '<i class="far fa-bookmark"></i>';
        bookmarkBtn.title = bookmarkedQuestions.includes(index) ?
            "Remove bookmark" : "Bookmark this question";
    }
}

function toggleBookmark() {
    const index = currentQuestionIndex;

    if (bookmarkedQuestions.includes(index)) {
        // Remove bookmark
        bookmarkedQuestions = bookmarkedQuestions.filter(i => i !== index);
        document.querySelector('.bookmark-btn').innerHTML = '<i class="far fa-bookmark"></i>';
        document.querySelector('.bookmark-btn').title = "Bookmark this question";
        showToast('Bookmark removed', 1500);
    } else {
        // Add bookmark
        bookmarkedQuestions.push(index);
        document.querySelector('.bookmark-btn').innerHTML = '<i class="fas fa-bookmark"></i>';
        document.querySelector('.bookmark-btn').title = "Remove bookmark";
        showToast('Question bookmarked!', 1500);
    }

    // Save to localStorage
    localStorage.setItem('quizBookmarks', JSON.stringify(bookmarkedQuestions));
}

function addBookmarksViewButton() {
    // Check if button already exists
    if (!document.querySelector('.bookmarks-btn')) {
        const headerDiv = document.querySelector('header');
        if (!headerDiv) return;

        const bookmarksButton = document.createElement('button');
        bookmarksButton.className = 'bookmarks-btn';
        bookmarksButton.innerHTML = '<i class="fas fa-list"></i>';
        bookmarksButton.title = "View Bookmarks";
        headerDiv.appendChild(bookmarksButton);

        bookmarksButton.addEventListener('click', showBookmarks);
    }
}

function showBookmarks() {
    if (bookmarkedQuestions.length === 0) {
        showToast('No bookmarked questions yet', 2000);
        return;
    }

    const bookmarksModal = document.createElement('div');
    bookmarksModal.className = 'bookmarks-modal';
    bookmarksModal.innerHTML = `
        <div class="bookmarks-content">
            <h2>Bookmarked Questions</h2>
            <div class="bookmarks-list">
                ${bookmarkedQuestions.map(index => `
                    <div class="bookmark-item" data-index="${index}">
                        <div class="bookmark-number">${index + 1}</div>
                        <div class="bookmark-text">${quizData[index].question}</div>
                    </div>
                `).join('')}
            </div>
            <button class="close-bookmarks-btn">Close</button>
        </div>
    `;
    document.body.appendChild(bookmarksModal);

    // Add event listeners
    document.querySelector('.close-bookmarks-btn').addEventListener('click', () => {
        bookmarksModal.remove();
    });

    const bookmarkItems = document.querySelectorAll('.bookmark-item');
    bookmarkItems.forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.getAttribute('data-index'));
            currentQuestionIndex = index;
            loadQuestion(index);
            bookmarksModal.remove();
        });
    });
}

// Add CSS for eliminated options
function addEliminatedOptionStyles() {
    // Check if styles already exist
    if (!document.getElementById('eliminated-styles')) {
        const style = document.createElement('style');
        style.id = 'eliminated-styles';
        style.textContent = `
            .option.eliminated {
                opacity: 0.5;
                text-decoration: line-through;
                pointer-events: none;
            }
            
            .option.eliminated .option-label {
                background-color: rgba(231, 76, 60, 0.1);
                border-color: #e74c3c;
            }
            
            .hint-btn {
                display: block;
                margin: 15px auto;
                background-color: var(--accent);
                color: white;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .hint-btn:hover {
                background-color: var(--accent-hover);
            }
            
            .hint-btn.disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background-color: var(--text-secondary);
            }
        `;
        document.head.appendChild(style);
    }
}

// Add text-to-speech functionality
function addTextToSpeechFeature() {
    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
        console.error('Your browser does not support speech synthesis');
        return;
    }

    // Add read aloud icons to questions and options
    addReadAloudIcons();

    // Add speech toggle to header
    addSpeechToggle();
}

// Fix the read aloud icons function to prevent duplicates
function addReadAloudIcons() {
    // First, remove any existing read aloud icons to prevent duplicates
    const existingIcons = document.querySelectorAll('.read-aloud-icon');
    existingIcons.forEach(icon => icon.remove());

    // Add icon to question
    const questionText = document.querySelector('.question-text');
    if (questionText) {
        addReadIconToElement(questionText, 'question');
    }

    // Add icons to each option
    const optionTexts = document.querySelectorAll('.option-text');
    optionTexts.forEach((optionText, index) => {
        addReadIconToElement(optionText, `option-${index}`);
    });
}

// Improved function to add read icon to an element
function addReadIconToElement(element, type) {
    // Check if element already has a read icon
    if (element.querySelector('.read-aloud-icon')) {
        return; // Skip if already has an icon
    }

    // Create the icon
    const readIcon = document.createElement('span');
    readIcon.className = 'read-aloud-icon';
    readIcon.innerHTML = '<i class="fas fa-volume-up"></i>';
    readIcon.title = 'Click to hear this read aloud';
    readIcon.setAttribute('data-type', type);

    // Add click event
    readIcon.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent triggering option selection

        // Extract just the text content without the icon text
        const textToRead = element.childNodes[0].textContent.trim();
        speakText(textToRead);

        // Visual feedback that the icon was clicked
        readIcon.classList.add('speaking');
        setTimeout(() => {
            readIcon.classList.remove('speaking');
        }, 1000);
    });

    // Append icon to element
    element.appendChild(readIcon);
}

// Add map functionality
function addMapFeature() {
    // Add Leaflet CSS to head
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    leafletCSS.crossOrigin = '';
    document.head.appendChild(leafletCSS);

    // Add Leaflet JS
    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    leafletScript.crossOrigin = '';
    document.head.appendChild(leafletScript);

    // Create map container
    const quizContainer = document.querySelector('.quiz-container');
    const mapContainer = document.createElement('div');
    mapContainer.id = 'quiz-map';
    mapContainer.className = 'map-container hidden';
    quizContainer.appendChild(mapContainer);

    // Initialize map when Leaflet is loaded
    leafletScript.onload = function () {
        initMap();
    };
}

// Initialize the map
let map;
let marker;

function initMap() {
    // Create map centered on the world
    map = L.map('quiz-map').setView([20, 0], 2);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add event listeners to options for showing locations
    addMapEventListeners();
}

// Add event listeners to options for showing locations
function addMapEventListeners() {
    const options = document.querySelectorAll('.option');

    options.forEach((option, index) => {
        option.addEventListener('click', function () {
            const optionIndex = parseInt(this.querySelector('.option-input').value);
            showLocationOnMap(optionIndex);
        });
    });
}

// Show location on map
function showLocationOnMap(optionIndex) {
    // Get coordinates for the selected option
    const coordinates = quizData[currentQuestionIndex].coordinates[optionIndex];

    // Show map container
    const mapContainer = document.getElementById('quiz-map');
    mapContainer.classList.remove('hidden');

    // Make sure map is initialized
    if (!map) return;

    // Update map size after showing it
    map.invalidateSize();

    // Remove existing marker if any
    if (marker) {
        map.removeLayer(marker);
    }

    // Add marker for the selected location
    marker = L.marker(coordinates).addTo(map);

    // Center map on the marker
    map.setView(coordinates, 5);

    // Add popup with option text
    const optionText = quizData[currentQuestionIndex].options[optionIndex];
    marker.bindPopup(`<b>${optionText}</b>`).openPopup();

    // Highlight correct/incorrect on map
    const isCorrect = optionIndex === quizData[currentQuestionIndex].correctAnswer;

    // Use different marker icon based on correctness
    const markerElement = marker.getElement();
    if (markerElement) {
        if (isCorrect) {
            markerElement.classList.add('correct-marker');
        } else {
            markerElement.classList.add('incorrect-marker');
        }
    }
}

// Modify the initQuiz function to include our map feature
const originalInitQuizWithSpeech = initQuiz;
initQuiz = function () {
    // Check if this is the first load or difficulty already selected
    if (!localStorage.getItem('quizTimePerQuestion')) {
        // Show difficulty selector first
        addDifficultySelector();
        return; // Stop here until difficulty is selected
    }

    // Fix theme toggle before anything else
    fixThemeToggle();

    // Call the previous initQuiz function with all the other features
    originalInitQuizWithSpeech();

    // Fix hint system
    fixHintSystem();

    // Add our features
    addEmojiReactions();
    addFocusMode();
    addNotesFeature();
    addKeyboardShortcuts();
    addBookmarkFeature();
    addTextToSpeechFeature();

    // Add map feature
    addMapFeature();

    // Add map info message
    const quizContainer = document.querySelector('.quiz-container');
    const mapInfo = document.createElement('div');
    mapInfo.className = 'map-info';
    mapInfo.innerHTML = '<i class="fas fa-info-circle"></i> Click on an answer to see its location on the map!';
    quizContainer.insertBefore(mapInfo, document.querySelector('.options-container'));

    // Show a tip about the new features
    setTimeout(() => {
        showToast('Tip: Select an answer to see its location on the map!', 3000);
    }, 2000);
};

// Initialize the quiz
function initQuiz() {
    // Set up theme toggle
    fixThemeToggle();

    // Load first question
    loadQuestion(currentQuestionIndex);

    // Set up button event listeners
    prevButton.addEventListener('click', goToPreviousQuestion);
    nextButton.addEventListener('click', goToNextQuestion);

    // Start timer
    startTimer();

    // Update progress
    updateProgress();
}

// Load a question by index
function loadQuestion(index) {
    const question = quizData[index];

    // Update question number (add leading zero for single digits)
    questionNumberElement.textContent = (index + 1).toString().padStart(2, '0');

    // Update question text
    questionTextElement.textContent = question.question;

    // Clear previous options
    optionsContainer.innerHTML = '';

    // Create new option elements
    question.options.forEach((option, optionIndex) => {
        const optionElement = createOptionElement(option, optionIndex, index);
        optionsContainer.appendChild(optionElement);
    });

    // Check if this question was already answered
    if (userAnswers[index] !== null) {
        document.getElementById(`option${userAnswers[index] + 1}`).checked = true;
    }

    // Update button states
    updateButtonStates();

    // Update progress
    updateProgress();

    // Reset timer if moving to a new question
    resetTimer();

    // Update hint button if it exists, or add it if it doesn't
    const hintBtn = document.querySelector('.hint-btn');
    if (hintBtn) {
        updateHintButton();
    } else {
        addHintButton();
    }

    // Update bookmark button
    addBookmarkButton(index);

    // Add read aloud icons
    addReadAloudIcons();
}

// Create an option element
function createOptionElement(optionText, optionIndex, questionIndex) {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option';

    const optionId = `option${optionIndex + 1}`;

    optionDiv.innerHTML = `
        <input type="radio" id="${optionId}" name="answer" class="option-input" value="${optionIndex}">
        <label for="${optionId}" class="option-label">
            <span class="option-marker">${String.fromCharCode(65 + optionIndex)}</span>
            <span class="option-text">${optionText}</span>
        </label>
    `;

    // Add event listener to the radio input
    const radioInput = optionDiv.querySelector('.option-input');
    radioInput.addEventListener('change', () => {
        userAnswers[questionIndex] = optionIndex;

        // If it's the last question, enable the next button which will act as submit
        if (questionIndex === quizData.length - 1) {
            nextButton.disabled = false;
        }
    });

    return optionDiv;
}

// Go to the next question
function goToNextQuestion() {
    // If we're on the last question, finish the quiz
    if (currentQuestionIndex === quizData.length - 1) {
        finishQuiz();
        return;
    }

    currentQuestionIndex++;
    loadQuestion(currentQuestionIndex);
}

// Go to the previous question
function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion(currentQuestionIndex);
    }
}

// Update the button states based on current question
function updateButtonStates() {
    // Disable previous button on first question
    prevButton.disabled = currentQuestionIndex === 0;

    // Change next button text on last question
    if (currentQuestionIndex === quizData.length - 1) {
        nextButton.textContent = 'Submit Quiz';
        // Only enable if an answer is selected
        nextButton.disabled = userAnswers[currentQuestionIndex] === null;
    } else {
        nextButton.textContent = 'Next Question';
        nextButton.disabled = false;
    }
}

// Update the progress bar and text
function updateProgress() {
    const progressPercentage = ((currentQuestionIndex + 1) / quizData.length) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    progressText.textContent = `Question ${currentQuestionIndex + 1} of ${quizData.length}`;
}

// Start the timer
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 45; // Reset to 45 seconds per question
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            // Auto-move to next question or finish quiz if time runs out
            if (currentQuestionIndex < quizData.length - 1) {
                goToNextQuestion();
            } else {
                finishQuiz();
            }
        }
    }, 1000);
}

// Reset the timer
function resetTimer() {
    clearInterval(timerInterval);
    startTimer();
}

// Update the timer display
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Add visual indication when time is running low
    if (timeLeft <= 10) {
        timerElement.parentElement.classList.add('time-low');
    } else {
        timerElement.parentElement.classList.remove('time-low');
    }
}

// Fix the theme toggle initialization and event listener
function fixThemeToggle() {
    // Get the theme switch element
    const themeSwitch = document.getElementById('theme-switch');

    if (themeSwitch) {
        // Remove any existing event listeners
        themeSwitch.removeEventListener('change', toggleTheme);

        // Add our improved event listener
        themeSwitch.addEventListener('change', function () {
            toggleTheme();
        });

        // Initialize theme based on saved preference
        initializeTheme();
    } else {
        console.error("Theme switch element not found!");
    }
}

// Modify the toggleTheme function to ensure it works properly
function toggleTheme() {
    const isDarkMode = document.body.classList.contains('dark-theme');

    // Remove both classes first to ensure clean state
    document.body.classList.remove('light-theme', 'dark-theme');

    // Apply the opposite theme
    if (isDarkMode) {
        document.body.classList.add('light-theme');
        localStorage.setItem('quizTheme', 'light');
        if (isSpeechEnabled) {
            speakText("Light mode activated");
        }
    } else {
        document.body.classList.add('dark-theme');
        localStorage.setItem('quizTheme', 'dark');
        if (isSpeechEnabled) {
            speakText("Dark mode activated");
        }
    }

    // Update the switch state if needed
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.checked = !isDarkMode;
    }
}

// Improve the initializeTheme function
function initializeTheme() {
    const savedTheme = localStorage.getItem('quizTheme') || 'light';

    // Remove both classes first
    document.body.classList.remove('light-theme', 'dark-theme');

    // Apply saved theme
    document.body.classList.add(`${savedTheme}-theme`);

    // Update the theme switch to match
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.checked = savedTheme === 'dark';
    }
}

// Calculate the score
function calculateScore() {
    score = 0;
    userAnswers.forEach((answer, index) => {
        if (answer === quizData[index].correctAnswer) {
            score++;
        }
    });
    return score;
}

// Finish the quiz and show results
function finishQuiz() {
    clearInterval(timerInterval);

    // Calculate final score
    const finalScore = calculateScore();
    const percentage = (finalScore / quizData.length) * 100;

    // Create results HTML
    const quizContainer = document.querySelector('.quiz-container');
    quizContainer.innerHTML = `
        <div class="results-container">
            <h2>Quiz Results</h2>
            <div class="score-circle">
                <span class="score-number">${finalScore}/${quizData.length}</span>
                <span class="score-percentage">${percentage.toFixed(0)}%</span>
            </div>
            <div class="result-message">
                ${percentage >= 70 ?
            '<p class="success-message">Great job! You passed the quiz.</p>' :
            '<p class="failure-message">You need to score at least 70% to pass. Try again!</p>'
        }
            </div>
            <div class="answer-review">
                <h3>Review Your Answers</h3>
                <div class="review-list">
                    ${generateReviewList()}
                </div>
            </div>
            <button class="btn btn-primary restart-btn">Restart Quiz</button>
        </div>
    `;

    // Add event listener to restart button
    document.querySelector('.restart-btn').addEventListener('click', restartQuiz);
}

// Generate the review list HTML
function generateReviewList() {
    return quizData.map((question, index) => {
        const userAnswer = userAnswers[index] !== null ? question.options[userAnswers[index]] : 'Not answered';
        const correctAnswer = question.options[question.correctAnswer];
        const isCorrect = userAnswers[index] === question.correctAnswer;

        return `
            <div class="review-item ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="review-question">
                    <span class="question-number-small">${index + 1}</span>
                    ${question.question}
                </div>
                <div class="review-answers">
                    <div class="your-answer">
                        <span>Your answer:</span> 
                        <span class="${isCorrect ? 'correct-text' : 'incorrect-text'}">${userAnswer}</span>
                    </div>
                    ${!isCorrect ? `<div class="correct-answer">
                        <span>Correct answer:</span> 
                        <span class="correct-text">${correctAnswer}</span>
                    </div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Restart the quiz
function restartQuiz() {
    // Reset all state variables
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = new Array(quizData.length).fill(null);

    // Reload the page to restart the quiz
    window.location.reload();
}

// Initialize the quiz when the DOM is loaded
document.addEventListener('DOMContentLoaded', initQuiz);

// Modify loadQuestion to update bookmark button
const originalLoadQuestionWithBookmarks = loadQuestion;
loadQuestion = function (index) {
    // Call the previous loadQuestion function
    originalLoadQuestionWithBookmarks(index);

    // Add read aloud icons
    addReadAloudIcons();
}; 