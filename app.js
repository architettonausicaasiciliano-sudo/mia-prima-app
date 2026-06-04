// =========================
// SUPABASE INIT (ONLY ONCE)
// =========================
const SUPABASE_URL = "https://yzdmjfpwxqhzfdvoqcai.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TEeZZG6M_RWYvv7jkFe5pQb1H2q";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// =========================
// STATE
// =========================
let current = 0;
let scores = [];
let currentUser = null;

// =========================
// QUESTIONS
// =========================
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

// =========================
// INIT
// =========================
async function init() {
  const { data } = await supabase.auth.getUser();
  currentUser = data?.user || null;
}

init();

// =========================
// UI FLOW
// =========================
function startQuiz() {
  document.getElementById("landing").classList.remove("active");
  document.getElementById("quiz").classList.add("active");

  current = 0;
  scores = [];

  loadQuestion();
}

// =========================
// QUIZ LOGIC
// =========================
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

function select(value) {
  scores.push(value);
  current++;

  if (current < questions.length) {
    loadQuestion();
  } else {
    finishQuiz();
  }
}

// =========================
// RESULT
// =========================
async function finishQuiz() {
  const total = scores.reduce((a, b) => a + b, 0);
  const score = Math.round(total / scores.length);

  document.getElementById("quiz").classList.remove("active");
  document.getElementById("result").classList.add("active");

  document.getElementById("score").innerText = score + "%";

  renderBreakdown();
  renderPlan();

  if (currentUser) {
    await supabase.from("assessments").insert([
      {
        user_email: currentUser.email,
        preparedness_score: score
      }
    ]);
  }
}

// =========================
// UI RESULT
// =========================
function renderBreakdown() {
  document.getElementById("breakdown").innerHTML = `
    <div class="card">💧 Water: ${scores[0]}%</div>
    <div class="card">🍞 Food: ${scores[1]}%</div>
    <div class="card">🔋 Energy: ${scores[2]}%</div>
    <div class="card">📡 Communication: ${scores[3]}%</div>
  `;
}

function renderPlan() {
  document.getElementById("plan").innerHTML = `
    <div class="card">Day 1: Increase water storage</div>
    <div class="card">Day 2: Stock food supplies</div>
    <div class="card">Day 3: Backup energy sources</div>
    <div class="card">Day 4: Communication plan</div>
    <div class="card">🔒 Premium: full 7-day plan</div>
  `;
}