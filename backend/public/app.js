import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://yzdmjfpwxqhzfdvoqcai.supabase.co",
  "sb_publishable_TEeZZG6M_RWYvv7jkFe5pQ_biH2qgpY"
);

/* =========================
   QUESTIONS
========================= */
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

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", async () => {
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const unlockBtn = document.getElementById("unlockBtn");

  if (startBtn) startBtn.onclick = startQuiz;
  if (restartBtn) restartBtn.onclick = startQuiz;

  if (unlockBtn) {
    unlockBtn.onclick = () => {
      window.location.href = "checkout.html";
    };
  }

  await initPaywall();

  console.log("ENGINE READY ✔");
});

/* =========================
   PAYWALL CHECK (IMPORTANT)
========================= */
async function initPaywall() {
  const email = localStorage.getItem("email");

  const paywall = document.querySelector(".paywall");

  if (!email) {
    if (paywall) paywall.style.display = "block";
    return;
  }

  const { data, error } = await supabase
    .from("users")
    .select("premium")
    .eq("email", email)
    .single();

  const premium = data?.premium === true;

  if (premium) {
    if (paywall) paywall.style.display = "none";
  } else {
    if (paywall) paywall.style.display = "block";
  }
}

/* =========================
   QUIZ FLOW
========================= */
function startQuiz() {
  current = 0;
  scores = [];

  document.getElementById("landing")?.classList.remove("active");
  document.getElementById("result")?.classList.remove("active");
  document.getElementById("quiz")?.classList.add("active");

  loadQuestion();
}

function loadQuestion() {
  const q = questions[current];

  const questionEl = document.getElementById("question");
  const optionsEl = document.getElementById("options");

  questionEl.innerText = q.q;
  optionsEl.innerHTML = "";

  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = opt.text;
    btn.onclick = () => select(opt.value);
    optionsEl.appendChild(btn);
  });
}

function select(value) {
  scores.push(value);
  current++;

  if (current < questions.length) {
    loadQuestion();
  } else {
    finish();
  }
}

/* =========================
   FINISH
========================= */
async function finish() {
  const score = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length
  );

  const weakest = ["Water", "Food", "Energy", "Communication"]
    .map((n, i) => ({ name: n, value: scores[i] }))
    .reduce((a, b) => (a.value < b.value ? a : b));

  localStorage.setItem("riskScore", score);
  localStorage.setItem("weakestArea", weakest.name);

  document.getElementById("quiz")?.classList.remove("active");
  document.getElementById("result")?.classList.add("active");

  document.getElementById("score").innerText = score + "%";

  document.getElementById("breakdown").innerHTML = `
    <div class="card">⚠ Weakest: ${weakest.name}</div>
  `;

  // salva assessment su Supabase
  await supabase.from("assessments").insert([{
    preparedness_score: score,
    water_score: scores[0] || 0,
    food_score: scores[1] || 0,
    energy_score: scores[2] || 0,
    comms_score: scores[3] || 0
  }]);
}