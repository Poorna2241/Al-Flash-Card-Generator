        let flashcards = [];
        let currentStudyIndex = 0;

        class FlashcardGenerator {
            constructor() {
                this.flashcards = [];
                this.notesText = "";
            }

            loadNotesFromString(text) {
                this.notesText = text;
            }

            preprocessText(text) {
                return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
            }

            extractDefinitions(sentences) {
                const flashcards = [];
                const patterns = [
                    /(.+?)\s+is\s+(.+)/i,
                    /(.+?)\s+means\s+(.+)/i,
                    /(.+?)\s+refers to\s+(.+)/i,
                    /(.+?)\s+are\s+(.+)/i,
                    /(.+?):\s+(.+)/
                ];

                for (const sentence of sentences) {
                    for (const pattern of patterns) {
                        const match = sentence.match(pattern);
                        if (match && match[1].trim().length > 3 && match[2].trim().length > 10) {
                            flashcards.push({
                                question: `What is ${match[1].trim()}?`,
                                answer: match[2].trim(),
                                type: 'definition'
                            });
                            break;
                        }
                    }
                }
                return flashcards;
            }

            extractKeyPhrases(sentences) {
                const flashcards = [];
                const keywords = ['important', 'key', 'main', 'primary', 'essential', 'crucial'];

                for (const sentence of sentences) {
                    if (keywords.some(kw => sentence.toLowerCase().includes(kw))) {
                        const words = sentence.split(' ');
                        if (words.length > 5) {
                            const blankPos = Math.floor(words.length / 2);
                            const removedWord = words[blankPos];
                            if (removedWord.length > 3) {
                                const questionWords = [...words];
                                questionWords[blankPos] = "______";
                                flashcards.push({
                                    question: questionWords.join(' ') + '?',
                                    answer: removedWord,
                                    type: 'fill-in-blank'
                                });
                            }
                        }
                    }
                }
                return flashcards;
            }

            extractNumberedLists(text) {
                const flashcards = [];
                const pattern = /(\d+[\.\)]\s+.+?)(?=\d+[\.\)]|\n\n|$)/g;
                const matches = [...text.matchAll(pattern)];

                if (matches.length >= 2) {
                    const items = matches.slice(0, 5).map((m, i) => 
                        `${i + 1}. ${m[1].replace(/^\d+[\.\)]\s+/, '').trim()}`
                    );
                    flashcards.push({
                        question: "List the key points mentioned:",
                        answer: items.join('\n'),
                        type: 'list'
                    });
                }
                return flashcards;
            }

            generateFlashcards() {
                if (!this.notesText) return [];
                const sentences = this.preprocessText(this.notesText);
                const allCards = [
                    ...this.extractDefinitions(sentences),
                    ...this.extractKeyPhrases(sentences),
                    ...this.extractNumberedLists(this.notesText)
                ];

                const seen = new Set();
                this.flashcards = allCards.filter(card => {
                    if (seen.has(card.question)) return false;
                    seen.add(card.question);
                    return true;
                });
                return this.flashcards;
            }
        }

        function showAlert(message, type) {
            const container = document.getElementById('alertContainer');
            container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
            setTimeout(() => container.innerHTML = '', 5000);
        }

        function generateFlashcards() {
            const notesInput = document.getElementById('notesInput').value.trim();
            
            if (!notesInput) {
                showAlert('Please enter some notes first!', 'info');
                return;
            }

            const generator = new FlashcardGenerator();
            generator.loadNotesFromString(notesInput);
            flashcards = generator.generateFlashcards();

            if (flashcards.length === 0) {
                showAlert('No flashcards generated. Try adding definitions or structured content.', 'info');
                return;
            }

            showAlert(`Successfully generated ${flashcards.length} flashcards!`, 'success');
            displayStats();
            displayFlashcards();
        }

        function displayStats() {
            const defCount = flashcards.filter(f => f.type === 'definition').length;
            const fillCount = flashcards.filter(f => f.type === 'fill-in-blank').length;
            const listCount = flashcards.filter(f => f.type === 'list').length;

            document.getElementById('statsContainer').innerHTML = `
                <div class="stats">
                    <div class="stat-item">
                        <h3>${flashcards.length}</h3>
                        <p>Total Flashcards</p>
                    </div>
                    <div class="stat-item">
                        <h3>${defCount}</h3>
                        <p>Definitions</p>
                    </div>
                    <div class="stat-item">
                        <h3>${fillCount}</h3>
                        <p>Fill-in-Blanks</p>
                    </div>
                    <div class="stat-item">
                        <h3>${listCount}</h3>
                        <p>Lists</p>
                    </div>
                </div>
            `;
        }

        function displayFlashcards() {
            const container = document.getElementById('flashcardsContainer');
            let html = '<h2 style="color: #667eea; margin-bottom: 20px;">🎴 Generated Flashcards</h2>';
            
            html += `
                <div class="button-group" style="margin-bottom: 20px;">
                    <button class="btn-success" onclick="startStudyMode()">📖 Study Mode</button>
                    <button class="btn-secondary" onclick="downloadFlashcards()">💾 Download JSON</button>
                </div>
            `;

            flashcards.forEach((card, index) => {
                html += `
                    <div class="flashcard">
                        <div class="flashcard-header">
                            <span class="flashcard-number">Flashcard #${index + 1}</span>
                            <span class="flashcard-type">${card.type}</span>
                        </div>
                        <div class="flashcard-question">Q: ${card.question}</div>
                        <div class="flashcard-answer">A: ${card.answer.replace(/\n/g, '<br>')}</div>
                    </div>
                `;
            });

            container.innerHTML = html;
        }

        function startStudyMode() {
            currentStudyIndex = 0;
            showStudyCard();
        }

        function showStudyCard() {
            if (currentStudyIndex >= flashcards.length) {
                document.getElementById('studyModeContainer').innerHTML = `
                    <div class="study-mode">
                        <h2 style="color: #667eea; margin-bottom: 20px;">🎉 Complete!</h2>
                        <p style="font-size: 1.2em; margin-bottom: 20px;">You reviewed all ${flashcards.length} flashcards!</p>
                        <button class="btn-primary" onclick="startStudyMode()">🔄 Restart</button>
                    </div>
                `;
                return;
            }

            const card = flashcards[currentStudyIndex];
            document.getElementById('studyModeContainer').innerHTML = `
                <div class="study-mode">
                    <h2 style="color: #667eea; margin-bottom: 20px;">📖 Study Mode</h2>
                    <p style="margin-bottom: 20px;">Card ${currentStudyIndex + 1} of ${flashcards.length}</p>
                    <div class="study-card" id="studyCard" onclick="flipCard()">
                        <h3 style="font-size: 1.5em; margin-bottom: 20px;">Question:</h3>
                        <p style="font-size: 1.2em;">${card.question}</p>
                        <p style="margin-top: 20px; opacity: 0.8;">Click to reveal answer</p>
                    </div>
                    <div class="button-group" style="justify-content: center;">
                        <button class="btn-secondary" onclick="previousCard()" ${currentStudyIndex === 0 ? 'disabled' : ''}>⬅️ Previous</button>
                        <button class="btn-primary" onclick="nextCard()">Next ➡️</button>
                        <button class="btn-secondary" onclick="exitStudyMode()">❌ Exit</button>
                    </div>
                </div>
            `;
        }

        function flipCard() {
            const card = flashcards[currentStudyIndex];
            const studyCard = document.getElementById('studyCard');
            
            if (studyCard.classList.contains('flipped')) {
                studyCard.innerHTML = `
                    <h3 style="font-size: 1.5em; margin-bottom: 20px;">Question:</h3>
                    <p style="font-size: 1.2em;">${card.question}</p>
                    <p style="margin-top: 20px; opacity: 0.8;">Click to reveal answer</p>
                `;
                studyCard.classList.remove('flipped');
            } else {
                studyCard.innerHTML = `
                    <h3 style="font-size: 1.5em; margin-bottom: 20px;">Answer:</h3>
                    <p style="font-size: 1.2em;">${card.answer.replace(/\n/g, '<br>')}</p>
                    <p style="margin-top: 20px; opacity: 0.8;">Click to see question</p>
                `;
                studyCard.classList.add('flipped');
            }
        }

        function nextCard() {
            currentStudyIndex++;
            showStudyCard();
        }

        function previousCard() {
            if (currentStudyIndex > 0) {
                currentStudyIndex--;
                showStudyCard();
            }
        }

        function exitStudyMode() {
            document.getElementById('studyModeContainer').innerHTML = '';
        }

        function downloadFlashcards() {
            const dataStr = JSON.stringify(flashcards, null, 2);
            const blob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'flashcards.json';
            link.click();
            showAlert('Flashcards downloaded!', 'success');
        }

        function loadSample() {
            document.getElementById('notesInput').value = `Machine Learning is a subset of artificial intelligence that enables systems to learn from data.

Supervised learning means training a model on labeled data where the correct answer is known.

Neural networks are computing systems inspired by biological neural networks in animal brains.

The three important types of machine learning are: supervised learning, unsupervised learning, and reinforcement learning.

Overfitting refers to a model that learns the training data too well, including its noise.

The key advantage of deep learning is its ability to automatically learn features from raw data.

1. Data preprocessing is essential for model performance.
2. Feature engineering helps improve model accuracy.
3. Model validation prevents overfitting.
4. Hyperparameter tuning optimizes results.`;
            showAlert('Sample notes loaded! Click "Generate Flashcards" now.', 'info');
        }

        function clearNotes() {
            document.getElementById('notesInput').value = '';
            flashcards = [];
            document.getElementById('statsContainer').innerHTML = '';
            document.getElementById('flashcardsContainer').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <h3>No flashcards yet</h3>
                    <p>Enter your notes above and click "Generate Flashcards" to get started!</p>
                </div>
            `;
            document.getElementById('studyModeContainer').innerHTML = '';
            document.getElementById('alertContainer').innerHTML = '';
        }   