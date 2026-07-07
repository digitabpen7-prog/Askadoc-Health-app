const triageForm = document.getElementById('triage-form');
const triageOutput = document.getElementById('triage-output');
const triageLevel = document.getElementById('triage-level');
const triageSummary = document.getElementById('triage-summary');
const selfCareList = document.getElementById('self-care-list');
const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const sendChat = document.getElementById('send-chat');
const connectDoctor = document.getElementById('connect-doctor');
const requestCall = document.getElementById('request-call');
const tagButtons = document.querySelectorAll('#tag-list button');

const adviceRules = [
    {match: /fever|temperature|hot/i, level: 'urgent', advice: ['Rest in a cool room', 'Drink plenty of fluids', 'Track temperature hourly']},
    {match: /chest pain|shortness of breath|difficulty breathing/i, level: 'emergency', advice: ['Call emergency services immediately', 'Avoid exertion', 'Stay calm and seated']},
    {match: /chest tightness|pressure/i, level: 'urgent', advice: ['Seek care within a few hours', 'Avoid heavy lifting', 'Keep breathing slow and steady']},
    {match: /headache|migraine|dizzy/i, level: 'moderate', advice: ['Rest in a dark room', 'Avoid screens for a while', 'Hydrate well']},
    {match: /cough|sore throat|cold/i, level: 'routine', advice: ['Use warm salt water gargle', 'Keep humidity moderate', 'Drink warm liquids']},
    {match: /stomach|nausea|vomit|diarrhea/i, level: 'moderate', advice: ['Sip clear fluids', 'Avoid heavy meals', 'Take small bland foods']},
    {match: /pain|ache|soreness/i, level: 'routine', advice: ['Use heat or cold compress', 'Take OTC pain relief if safe', 'Rest the affected area']},
    {match: /rash|itch|swelling/i, level: 'urgent', advice: ['Keep the area clean', 'Avoid scratching', 'Monitor for spread or fever']}
];

const chatResponses = [
    {match: /what should i do|next step|help|recommend/i, response: 'Please share your symptoms and severity, and I’ll help you decide whether to rest, monitor, or seek care.'},
    {match: /fever|temperature/i, response: 'A fever can be a sign of infection. Keep hydrated, rest, and if it exceeds 38.5°C or continues for more than 48 hours, see a doctor.'},
    {match: /pain|ache/i, response: 'For pain, describe the location and how strong it feels. Mild pain often responds to rest and cooling, while sudden severe pain may need urgent evaluation.'},
    {match: /doctor|consult|call/i, response: 'A doctor is available 24/7. Use the "Request a Doctor Call" button and we will connect you right away.'},
    {match: /covid|cough|breath/i, response: 'If you have cough, fever or shortness of breath, monitor symptoms closely and seek care quickly. Avoid contact with others until you know it is safe.'},
    {match: /default/i, response: 'Tell me more about your symptoms or how long you have been feeling unwell. I’m here to support your next steps.'}
];

function getTriageLevel(text, severity, duration) {
    let score = 0;
    adviceRules.forEach(rule => {
        if (rule.match.test(text)) {
            score += rule.level === 'emergency' ? 4 : rule.level === 'urgent' ? 3 : rule.level === 'moderate' ? 2 : 1;
        }
    });
    if (severity === 'severe') score += 2;
    if (duration === '3') score += 1;
    if (/blood|severe pain|risk|safe|cannot breathe|unconscious/i.test(text)) score += 3;
    if (score >= 6) return 'Emergency care';
    if (score >= 4) return 'Urgent medical attention';
    if (score >= 2) return 'Monitor and follow self-care';
    return 'Routine self-care';
}

function getAdvice(text) {
    const matched = new Set();
    adviceRules.forEach(rule => {
        if (rule.match.test(text)) {
            rule.advice.forEach(item => matched.add(item));
        }
    });
    if (matched.size === 0) {
        return ['Rest, stay hydrated, and note whether symptoms change over the next few hours.'];
    }
    return Array.from(matched);
}

function updateDoctorStatus() {
    const online = Math.random() > 0.15;
    const statusLabel = document.getElementById('doctor-status');
    const depthLabel = document.getElementById('doctor-depth');
    if (online) {
        statusLabel.textContent = 'Doctor available now';
        statusLabel.classList.remove('busy');
        statusLabel.classList.add('online');
        depthLabel.textContent = 'Available now';
    } else {
        statusLabel.textContent = 'Doctors busy, please wait';
        statusLabel.classList.remove('online');
        statusLabel.classList.add('busy');
        depthLabel.textContent = '15-20 min wait';
    }
}

triageForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('name').value.trim();
    const age = document.getElementById('age').value;
    const symptoms = document.getElementById('symptoms').value.trim();
    const severity = document.getElementById('severity').value;
    const duration = document.getElementById('duration').value;

    if (!name || !age || !symptoms) return;

    const level = getTriageLevel(symptoms, severity, duration);
    const advice = getAdvice(symptoms);
    let summary = `Hi ${name}, based on the symptoms entered and the reported severity, your case is classified as "${level}."`;
    let details = [];
    if (level === 'Emergency care') {
        details.push('Seek emergency care immediately or call emergency services.');
    } else if (level === 'Urgent medical attention') {
        details.push('Book a same-day doctor consultation or urgent care visit.');
    } else if (level === 'Monitor and follow self-care') {
        details.push('Continue monitoring symptoms with rest and self-care steps below.');
    } else {
        details.push('Use the advice below and check in again if symptoms persist.');
    }
    if (Number(age) >= 65) details.push('Because you are over 65, consider speaking to a medical professional sooner.');

    triageLevel.textContent = level;
    triageSummary.textContent = `${summary} ${details.join(' ')}`;
    selfCareList.innerHTML = advice.map(item => `<li>${item}</li>`).join('');
    triageOutput.classList.remove('hidden');
    triageOutput.scrollIntoView({behavior: 'smooth', block: 'start'});
});

sendChat.addEventListener('click', () => {
    const prompt = chatInput.value.trim();
    if (!prompt) return;
    const userMessage = document.createElement('div');
    userMessage.className = 'message user';
    userMessage.textContent = prompt;
    chatWindow.appendChild(userMessage);
    chatInput.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight;

    setTimeout(() => {
        const response = generateChatResponse(prompt);
        const botMessage = document.createElement('div');
        botMessage.className = 'message bot';
        botMessage.textContent = response;
        chatWindow.appendChild(botMessage);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 450);
});

chatInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendChat.click();
    }
});

function generateChatResponse(prompt) {
    const normalized = prompt.toLowerCase();
    for (const item of chatResponses) {
        if (item.match.test(normalized)) return item.response;
    }
    return chatResponses.find(r => r.match.source === 'default').response;
}

connectDoctor.addEventListener('click', () => {
    const botMessage = document.createElement('div');
    botMessage.className = 'message bot';
    botMessage.textContent = 'Connecting you to a health consultant now. A doctor will review your triage details and reach out within minutes.';
    chatWindow.appendChild(botMessage);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    requestCall.textContent = 'Doctor connecting...';
    requestCall.disabled = true;
    setTimeout(() => {
        requestCall.textContent = 'Doctor connected';
        requestCall.disabled = false;
    }, 2500);
});

requestCall.addEventListener('click', () => {
    const botMessage = document.createElement('div');
    botMessage.className = 'message bot';
    botMessage.textContent = 'Your doctor call request is received. You should receive a connection from a healthcare provider shortly.';
    chatWindow.appendChild(botMessage);
    chatWindow.scrollTop = chatWindow.scrollHeight;
});

tagButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tag = button.getAttribute('data-tag');
        const symptomsField = document.getElementById('symptoms');
        const current = symptomsField.value.trim();
        const addition = current ? `${current}, ${tag}` : tag;
        symptomsField.value = addition;
        symptomsField.focus();
    });
});

updateDoctorStatus();

/* === Enhancements === */
const darkBtn = document.createElement('button');
darkBtn.id = 'dark-toggle';
darkBtn.textContent = '🌙 Dark Mode';
document.body.appendChild(darkBtn);
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    darkBtn.textContent = '☀️ Light Mode';
}
darkBtn.onclick = () => {
    document.body.classList.toggle('dark');
    const d = document.body.classList.contains('dark');
    localStorage.setItem('theme', d ? 'dark' : 'light');
    darkBtn.textContent = d ? '☀️ Light Mode' : '🌙 Dark Mode';
};

const topBtn = document.createElement('button');
topBtn.id = 'top-btn';
topBtn.textContent = '⬆';
document.body.appendChild(topBtn);
window.addEventListener('scroll', () => {
    if (window.scrollY > 250) topBtn.classList.add('visible');
    else topBtn.classList.remove('visible');
});
topBtn.onclick = () => window.scrollTo({top: 0, behavior: 'smooth'});

document.querySelectorAll('.card').forEach(c => c.classList.add('animate-init'));
const obs = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) {
        e.target.classList.add('animate-in');
    }
}));
document.querySelectorAll('.card').forEach(c => obs.observe(c));

window.addEventListener('load', () => {
    const m = document.createElement('div');
    m.className = 'message bot';
    m.textContent = 'Welcome to Ask a Doc!';
    chatWindow.appendChild(m);
});
