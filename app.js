const SUPABASE_URL = "https://yzdmjfpwxqhzfdvoqcai.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TEeZZG6M_RWYvv7jkFe5pQb1H2q";

// SUPABASE CLIENT
const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
); console.log("Supabase connected");

// QUIZ QUESTIONS
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

let current = 0;
let scores = [];
let currentUser = null;

// START APP
async function init() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  currentUser = user;

  if (user) {
    console.log("Logged in:", user.email);
  } else {
    console.log("No user");
  }
}

init();
if (!window.supabase) {
  console.error("Supabase library not loaded");
  return;
}

// LOGIN
async function signUp() {
  const email = prompt("Enter email");
  const password = prompt("Enter password");

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Account created. Check your email.");
}

// LOGIN
async function signIn() {
  const email = prompt("Email");
  const password = prompt("Password");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  currentUser = data.user;

  alert("Logged in");
}

// LOGOUT
async function logout() {
  await supabase.auth.signOut();
  location.reload();
}

// START QUIZ
function start() {
  document.getElementById("landing").classList.remove("active");
  document.getElementById("result").classList.remove("active");
  document.getElementById("quiz").classList.add("active");

  current = 0;
  scores = [];

  loadQuestion();
}

// LOAD QUESTION
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

  updateProgress();
}

// SELECT ANSWER
function select(value) {
  scores.push(value);

  current++;

  if (current < questions.length) {
    loadQuestion();
  } else {
    showResult();
  }
}

// UPDATE BAR
function updateProgress() {
  document.getElementById("progressBar").style.width =
    (current / questions.length) * 100 + "%";

  document.getElementById("currentStep").innerText =
    current + 1;
}

// SHOW RESULT
async function showResult() {
  document.getElementById("quiz").classList.remove("active");

  document.getElementById("result").classList.add("active");

  const total = scores.reduce((a, b) => a + b, 0);

  const score = Math.round(total / scores.length);

  document.getElementById("score").innerText =
    score + "%";

  // SAVE TO SUPABASE
  await saveAssessment(score);

  const plan = generateActionPlan(scores);

  renderBreakdown();

  renderPlan(plan);
}

// SAVE RESULT
async function saveAssessment(score) {
  if (!currentUser) return;

  const { error } = await supabase
    .from("assessments")
    .insert([
      {
        user_email: currentUser.email,
        preparedness_score: score
      }
    ]);

  if (error) {
    console.error(error);
  } else {
    console.log("Saved");
  }
}

// BREAKDOWN
function renderBreakdown() {
  const breakdown =
    document.getElementById("breakdown");

  breakdown.innerHTML = `
    <div class="card">💧 Water: ${scores[0]}%</div>
    <div class="card">🍞 Food: ${scores[1]}%</div>
    <div class="card">🔋 Energy: ${scores[2]}%</div>
    <div class="card">📡 Communication: ${scores[3]}%</div>
  `;
}

// PLAN
function renderPlan(plan) {
  const container = document.getElementById("plan");

  container.innerHTML = "";

  const freeDays =
    plan.filter(p => p.day <= 2);

  const premiumDays =
    plan.filter(p => p.day > 2);

  freeDays.forEach(renderCard);

  const lock = document.createElement("div");

  lock.className = "card";

  lock.innerHTML = `
    🔒 Unlock full 7-day plan<br><br>

    <a
      href="https://buy.stripe.com/test_00w3cv0SQaYa70uczm9R600"
      target="_blank"
      class="stripe-button"
    >
      Unlock Premium
    </a>
  `;

  container.appendChild(lock);
}

// CARD
function renderCard(item) {
  const container =
    document.getElementById("plan");

  const div = document.createElement("div");

  div.className = "card";

  div.innerHTML = `
    <strong>Day ${item.day}</strong><br>
    ${item.action}<br>
    <small>${item.impact}</small>
  `;

  container.appendChild(div);
}

// ACTION PLAN
function generateActionPlan(scores) {
  let plan = [];

  if (scores[0] < 50)
    plan.push({
      day: 1,
      action: "Increase water storage",
      impact: "High"
    });

  if (scores[1] < 50)
    plan.push({
      day: 2,
      action: "Stock food supplies",
      impact: "High"
    });

  if (scores[2] < 50)
    plan.push({
      day: 3,
      action: "Backup energy sources",
      impact: "High"
    });

  if (scores[3] < 50)
    plan.push({
      day: 4,
      action: "Communication plan",
      impact: "Medium"
    });

  plan.push(
    {
      day: 5,
      action: "Print documents",
      impact: "Medium"
    },
    {
      day: 6,
      action: "Emergency kit",
      impact: "High"
    },
    {
      day: 7,
      action: "Review plan",
      impact: "Medium"
    }
  );

  return plan;
}function buyFullReport() {
  window.open(
    "https://buy.stripe.com/test_00w3cv0SQaYa70uczm9R600",
    "_blank"
  );
}