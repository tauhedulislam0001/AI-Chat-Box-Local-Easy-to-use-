const API_KEY = "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";
const API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const toggleThemeBtn = document.getElementById("toggle-theme-btn");
const clearChatBtn = document.getElementById("clear-chat-btn");
const exportChatBtn = document.getElementById("export-chat-btn");
const voiceBtn = document.getElementById("voice-btn");

window.onload = () => {
  const saved = localStorage.getItem("chatHistory");
  if (saved) chatBox.innerHTML = saved;
  chatBox.scrollTop = chatBox.scrollHeight;
};

function saveChat() {
  localStorage.setItem("chatHistory", chatBox.innerHTML);
}

function addTypingIndicator() {
  const typingEl = document.createElement("div");
  typingEl.id = "typing-indicator";
  typingEl.className = "ai-msg";
  typingEl.innerHTML = `<div class="chat-bubble ai-bubble">AI is typing<span class="dots">.</span></div>`;
  chatBox.appendChild(typingEl);
  chatBox.scrollTop = chatBox.scrollHeight;

  const dotsEl = typingEl.querySelector(".dots");
  let dots = 1;
  typingEl._interval = setInterval(() => {
    dots = (dots % 3) + 1;
    dotsEl.textContent = ".".repeat(dots);
  }, 500);
}

function removeTypingIndicator() {
  const typingEl = document.getElementById("typing-indicator");
  if (typingEl) {
    clearInterval(typingEl._interval);
    typingEl.remove();
  }
}

chatForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  appendUserMessage(message);
  saveChat();
  userInput.value = "";
  addTypingIndicator();

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response";

    removeTypingIndicator();
    appendAIMessage(reply);
    saveChat();
    speak(reply);
  } catch (error) {
    console.error("Error:", error);
    removeTypingIndicator();
    appendAIError();
    saveChat();
  }
});

function appendUserMessage(message) {
  chatBox.innerHTML += `
    <div class="user-msg">
      <div class="chat-bubble user-bubble">${message}</div>
    </div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendAIMessage(message) {
  chatBox.innerHTML += `
    <div class="ai-msg">
      <div class="chat-bubble ai-bubble">${message}</div>
    </div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendAIError() {
  chatBox.innerHTML += `
    <div class="ai-msg">
      <div class="chat-bubble ai-bubble text-danger">Error: Could not get response.</div>
    </div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

toggleThemeBtn.addEventListener("click", () => {
  const html = document.documentElement;
  if (html.getAttribute("data-bs-theme") === "dark") {
    html.setAttribute("data-bs-theme", "light");
  } else {
    html.setAttribute("data-bs-theme", "dark");
  }
});

clearChatBtn.addEventListener("click", () => {
  if (confirm("Clear all chat?")) {
    chatBox.innerHTML = "";
    localStorage.removeItem("chatHistory");
  }
});

exportChatBtn.addEventListener("click", () => {
  const text = chatBox.innerText.replace(/\n{2,}/g, "\n\n");
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "chat.txt";
  a.click();
});

// Voice-to-text
voiceBtn.addEventListener("click", () => {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Voice recognition not supported.");
    return;
  }
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.start();
  recognition.onresult = function(event) {
    userInput.value = event.results[0][0].transcript;
  };
});

// Text-to-speech
function speak(text) {
  const synth = window.speechSynthesis;
  if (synth.speaking) synth.cancel(); // Cancel any ongoing speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  synth.speak(utterance);
}
