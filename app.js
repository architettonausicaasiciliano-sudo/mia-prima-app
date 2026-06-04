const API_URL = ""; // se backend separato metti URL Vercel/Render

/* -------------------------
   QUIZ DATA
-------------------------- */

const questions = [
  {
    q: "Water storage",
    options: [
      { text: "Less than 5L", value: 0 },
      { text: "5–20L", value: 25 },
      { text: "20–50L", value: 50 },
      { text: "More than 50L", value: 100 }
    ]
  },
  {
    q: "Food availability",
    options: [
      { text: "Less than 1 day", value: 0 },
      { text: "1–2 days", value: 25 },
      { text: "3–5 days", value: 50 },
      { text: "1 week+", value: 100 }
    ]
  },
  {
    q: "Emergency power",
    options: [
      { text: "None", value: 0 },
      { text: "Power bank", value: 50 },
      { text: "Backup batteries", value: 75 },
      { text: "Generator", value: 100 }
    ]
  },
  {
    q: "Communication readiness",
    options: [
      { text: "No plan", value: 0 },
      { text: "Phone only", value: 50 },
      { text: "Backup contacts", value: 100 }
    ]
  }
];

/* -------------------------
   STATE
-------------------------- */

let current = 0;
let scores = [];

/* -------------------------
   START
-------------------------- */

function startQuiz() {
  document.getElementById("landing").classList.remove("active");
  document.getElementById("result").classList.remove("active");
  document.getElementById("quiz").classList.add("active");

  current = 0;
  scores = [];

  loadQuestion();
}

/* -------------------------
   QUESTIONS
-------------------------- */

function loadQuestion() {
  const q = questions[current];

  document.getElementById("question").innerText = q.q;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = opt.text;
    btn.onclick = () => select(opt.value);
    optionsDiv.appendChild(btn);
  });

  document.getElementById("currentStep").innerText = current + 1;

  document.getElementById("progressBar").style.width =
    (current / questions.length) * 100 + "%";
}

/* -------------------------
   SELECT ANSWER
-------------------------- */

function select(value) {
  scores.push(value);
  current++;

  if (current < questions.length) {
    loadQuestion();
  } else {
    finishQuiz();
  }
}

/* -------------------------
   RESULT
-------------------------- */

function finishQuiz() {
  const total = scores.reduce((a, b) => a + b, 0);
  const score = Math.round(total / scores.length);

  document.getElementById("quiz").classList.remove("active");
  document.getElementById("result").classList.add("active");

  document.getElementById("score").innerText = score + "%";

  renderBreakdown();
  renderPlan();
}

/* -------------------------
   BREAKDOWN
-------------------------- */

function renderBreakdown() {
  const el = document.getElementById("breakdown");

  el.innerHTML = `
    <div class="card">💧 Water: ${scores[0]}%</div>
    <div class="card">🍞 Food: ${scores[1]}%</div>
    <div class="card">🔋 Energy: ${scores[2]}%</div>
    <div class="card">📡 Communication: ${scores[3]}%</div>
  `;
}

/* -------------------------
   PLAN
-------------------------- */

function renderPlan() {
  const el = document.getElementById("plan");

  const plan = [
    { day: 1, action: "Increase water storage", impact: "High" },
    { day: 2, action: "Stock food supplies", impact: "High" },
    { day: 3, action: "Backup energy sources", impact: "High" },
    { day: 4, action: "Communication plan", impact: "Medium" },
    { day: 5, action: "Print documents", impact: "Medium" },
    { day: 6, action: "Emergency kit", impact: "High" },
    { day: 7, action: "Review plan", impact: "Medium" }
  ];

  el.innerHTML = plan.map(p => `
    <div class="card">
      <strong>Day ${p.day}</strong><br/>
      ${p.action}<br/>
      <small>${p.impact}</small>
    </div>
  `).join("");
}

/* -------------------------
   MONETIZATION HOOK
-------------------------- */

function unlockPremium() {
  alert("Stripe integration next step (ready to plug)");
}