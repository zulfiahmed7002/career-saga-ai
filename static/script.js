const chatForm = document.querySelector("#chatForm");
const userInput = document.querySelector("#userInput");
const messages = document.querySelector("#messages");
const sendButton = document.querySelector("#sendButton");
const typingIndicator = document.querySelector("#typingIndicator");
const themeToggle = document.querySelector("#themeToggle");
const themeIcon = document.querySelector("#themeIcon");
const clearChat = document.querySelector("#clearChat");
const promptCards = document.querySelectorAll(".prompt-card");

const STORAGE_KEY = "careerSagaChatHistory";
const THEME_KEY = "careerSagaTheme";

function getSavedMessages() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveMessages(chatMessages) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatMessages));
}

function scrollToLatest() {
    messages.scrollTop = messages.scrollHeight;
}

function addMessage(role, content, shouldSave = true) {
    const message = document.createElement("div");
    message.className = `message ${role}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = content;

    message.appendChild(bubble);
    messages.appendChild(message);
    scrollToLatest();

    if (shouldSave) {
        const chatMessages = getSavedMessages();
        chatMessages.push({ role, content });
        saveMessages(chatMessages);
    }
}

function loadSavedMessages() {
    const chatMessages = getSavedMessages();

    if (chatMessages.length === 0) {
        addMessage(
            "ai",
            "Hi, I am CareerSaga AI. Ask me about career paths, learning roadmaps, programming concepts, resumes, or interviews.",
            false
        );
        return;
    }

    chatMessages.forEach((item) => addMessage(item.role, item.content, false));
}

function setLoading(isLoading) {
    sendButton.disabled = isLoading;
    userInput.disabled = isLoading;
    typingIndicator.hidden = !isLoading;
}

async function sendMessage(message) {
    addMessage("user", message);
    setLoading(true);

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        addMessage("ai", data.response);
    } catch (error) {
        addMessage("ai", `Sorry, I could not respond right now. ${error.message}`);
    } finally {
        setLoading(false);
        userInput.focus();
    }
}

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const message = userInput.value.trim();
    if (!message) {
        return;
    }

    userInput.value = "";
    userInput.style.height = "auto";
    sendMessage(message);
});

userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = `${userInput.scrollHeight}px`;
});

userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        chatForm.requestSubmit();
    }
});

promptCards.forEach((card) => {
    card.addEventListener("click", () => {
        userInput.value = card.textContent.trim();
        chatForm.requestSubmit();
    });
});

themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    themeIcon.textContent = isDark ? "☀" : "☾";
});

clearChat.addEventListener("click", async () => {
    localStorage.removeItem(STORAGE_KEY);
    messages.innerHTML = "";
    addMessage(
        "ai",
        "Chat cleared. What career goal should we work on next?",
        false
    );

    try {
        await fetch("/clear", { method: "POST" });
    } catch (error) {
        console.warn("Server history could not be cleared.", error);
    }
});

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    document.body.classList.toggle("dark", shouldUseDark);
    themeIcon.textContent = shouldUseDark ? "☀" : "☾";
}

loadTheme();
loadSavedMessages();
