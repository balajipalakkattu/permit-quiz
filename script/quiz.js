// QUESTIONS ARE LOADED FROM questions.json (instead of an inline array)
let questionBank = [];
let sharedQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
const QUESTIONS_PER_TEST = 20; // Number of random questions to show per attempt

document.addEventListener("DOMContentLoaded", () => {
    setLastModified();
    loadQuestionsAndStart();

document.getElementById("next-button")
        .addEventListener("click", nextQuestion);

document.getElementById("retry-button")
        .addEventListener("click", startQuiz);
});


// Load questions.json and then start the quiz
async function loadQuestionsAndStart() {
    try {
        const resp = await fetch("https://permit-quiz.onrender.com/api/questions", {
            method: "GET",
            cache: "no-cache"
        });

        if (!resp.ok) {
            throw new Error(`Failed to load questions: ${resp.status}`);
        }

        const data = await resp.json();

        // Your backend returns:
        // { meta: { lastModified: ... }, questions: [...] }
        questionBank = data.questions;

        startQuiz();
    } catch (err) {
        console.error(err);
        document.getElementById('q-text').innerText =
            'Failed to load questions. Please try again later.';
        document.getElementById('options-box').innerHTML = '';
        document.getElementById('next-button').style.display = 'none';
    }
}


// 2. QUIZ ENGINE LOGIC
function startQuiz() {
    score = 0;
    currentQuestionIndex = 0;
    
    // Completely randomize the question bank pool
    const shuffledPool = [...questionBank].sort(() => 0.5 - Math.random());
    
    // If QUESTIONS_PER_TEST > bank size, slice will just return the available items
    sharedQuestions = shuffledPool.slice(0, QUESTIONS_PER_TEST);
    
    document.getElementById("quiz-box").style.display = "block";
    document.getElementById("result-box").style.display = "none";
    document.getElementById("total-qty").innerText = sharedQuestions.length;
    
    showQuestion();
}

function showQuestion() {
    document.getElementById("next-button").style.display = "none";
    const currentQ = sharedQuestions[currentQuestionIndex];
    
    document.getElementById("current-idx").innerText = currentQuestionIndex + 1;
    document.getElementById("q-text").innerText = currentQ.question;
    
    // Handle Image Display
    const imgElement = document.getElementById("q-image");
    if (currentQ.image) {
        imgElement.src = currentQ.image;
        imgElement.style.display = "block";
    } else {
        imgElement.style.display = "none";
    }
    
    // Render Options Buttons
    const optionsBox = document.getElementById("options-box");
    optionsBox.innerHTML = "";
    
    currentQ.options.forEach((option, idx) => {
        const button = document.createElement("button");
        button.innerText = option;
        button.classList.add("btn");
        button.onclick = () => selectOption(button, idx, currentQ.answer);
        optionsBox.appendChild(button);
    });
}

function selectOption(selectedButton, selectedIdx, correctIdx) {
    const allButtons = document.getElementById("options-box").children;
    
    // Disable all options so they can't change their mind
    for (let btn of allButtons) {
        btn.disabled = true;
    }
    
    if (selectedIdx === correctIdx) {
        selectedButton.classList.add("correct");
        score++;
    } else {
        selectedButton.classList.add("wrong");
        allButtons[correctIdx].classList.add("correct"); // Highlight the right answer
    }
    
    document.getElementById("next-button").style.display = "block";
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < sharedQuestions.length) {
        showQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById("quiz-box").style.display = "none";
    document.getElementById("result-box").style.display = "block";
    
    const total = sharedQuestions.length || QUESTIONS_PER_TEST;
    const percentage = total ? Math.round((score / total) * 100) : 0;
    document.getElementById("final-score").innerText = percentage;
    
    const msgElement = document.getElementById("pass-fail-msg");
    if (percentage >= 80) { // Standard 80% passing mark
        msgElement.innerText = "Congratulations! You passed the practice exam.";
        msgElement.style.color = "var(--success)";
    } else {
        msgElement.innerText = "You did not pass. Keep studying the handbook!";
        msgElement.style.color = "var(--error)";
    }
}

// Determine last-modified for questions.json (server header when available, fallback to GitHub API and document.lastModified)
async function setLastModified() {
    const el = document.getElementById('last-modified');
    try {
        // Try HEAD request for questions.json
        let resp = await fetch('questions.json', { method: 'HEAD', cache: 'no-cache' });
        let lm = resp.headers.get('last-modified');

        // Fallback to GET if HEAD doesn't return header
        if (!lm) {
            try {
                resp = await fetch('questions.json', { cache: 'no-cache' });
                lm = resp.headers.get('last-modified');
            } catch (e) {
                // ignore
            }
        }

        // If still no header, try GitHub commits API to get latest commit for the file
        if (!lm) {
            try {
                const apiUrl = 'https://api.github.com/repos/balajipalakkattu/permit-quiz/commits?path=questions.json&per_page=1';
                const apiResp = await fetch(apiUrl);
                if (apiResp.ok) {
                    const commits = await apiResp.json();
                    if (Array.isArray(commits) && commits.length) {
                        lm = commits[0]?.commit?.committer?.date || commits[0]?.commit?.author?.date || null;
                    }
                }
            } catch (e) {
                // ignore
            }
        }

        // Final fallback
        if (!lm) lm = document.lastModified || null;

        if (lm) {
            const d = new Date(lm);
            el.innerText = isNaN(d.getTime()) ? lm : d.toLocaleString();
        } else {
            el.innerText = 'Unknown';
        }
    } catch (err) {
        console.error('Could not determine questions.json last modified time', err);
        el.innerText = document.lastModified || 'Unknown';
    }
}
