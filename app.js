function saveResult(scoreData) {
  let history = JSON.parse(localStorage.getItem("assessments")) || [];

  history.push({
    date: new Date().toISOString(),
    data: scoreData
  });

  localStorage.setItem("assessments", JSON.stringify(history));
}const questions = [
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
      { text: "Power bank only", value: 50 },
      { text: "Backup batteries", value: 75 },
      { text: "Generator / full backup", value: 100 }
    ]
  },
  {
    q: "Communication readiness",
    options: [
      { text: "No plan", value: 0 },
      { text: "Phone only", value: 50 },
      { text: "Backup radio / contacts", value: 100 }
    ]
  }
];

let current = 0;
let scores = [];

function start() {
  document.getElementById("landing").classList.remove("active");
  document.getElementById("result").classList.remove("active");
  document.getElementById("quiz").classList.add("active");

  current = 0;
  scores = [];

  loadQuestion();
}

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

function select(value) {
  scores.push(value);
  current++;

  if (current < questions.length) {
    loadQuestion();
  } else {
    showResult();
  }
}

function updateProgress() {
  const percent = (current / questions.length) * 100;

  document.getElementById("progressBar").style.width = percent + "%";
  document.getElementById("currentStep").innerText = current + 1;
}

function showResult() {
  document.getElementById("quiz").classList.remove("active");
  document.getElementById("result").classList.add("active");

  const total = scores.reduce((a,b) => a + b, 0);
  const score = Math.round(total / scores.length);

  const resultData = {
    score,
    water: scores[0],
    food: scores[1],
    energy: scores[2],
    communication: scores[3]
  };

  document.getElementById("score").innerText = score + "%";
  const plan = generateActionPlan(scores);

const planContainer = document.createElement("div");
planContainer.className = "recommendation-box";

planContainer.innerHTML = "<h3>7-Day Action Plan</h3>";

plan.forEach(item => {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <strong>Day ${item.day}</strong><br>
    ${item.action}<br>
    <small>Impact: ${item.impact}</small>
  `;
  planContainer.appendChild(div);
});

document.getElementById("result").appendChild(planContainer);

  saveResult(resultData);

  const breakdown = document.getElementById("breakdown");
  breakdown.innerHTML = `
    <div class="card">💧 Water: ${scores[0]}%</div>
    <div class="card">🍞 Food: ${scores[1]}%</div>
    <div class="card">🔋 Energy: ${scores[2]}%</div>
    <div class="card">📡 Communication: ${scores[3]}%</div>
  `;

  const rec = document.getElementById("recommendations");
  rec.innerHTML = "";

  let recommendations = [];

  if (scores[0] < 50) recommendations.push("Increase water storage");
  if (scores[1] < 50) recommendations.push("Store more food supplies");
  if (scores[2] < 50) recommendations.push("Prepare backup power sources");
  if (scores[3] < 50) recommendations.push("Improve communication backup plan");

  recommendations.forEach(r => {
    const li = document.createElement("li");
    li.innerText = r;
    rec.appendChild(li);
  });
}
function startAssessment() {
  document.getElementById("landing").classList.remove("active");
  document.getElementById("quiz").classList.add("active");
  current = 0;
  scores = [];
  loadQuestion();
}function generateActionPlan(scores) {
  let plan = [];

  if (scores[0] < 50) {
    plan.push({
      day: 1,
      action: "Increase water storage (minimum +20L per person)",
      impact: "High",
    });
  }

  if (scores[1] < 50) {
    plan.push({
      day: 2,
      action: "Stock 5–7 days of non-perishable food",
      impact: "High",
    });
  }

  if (scores[2] < 50) {
    plan.push({
      day: 3,
      action: "Prepare backup energy (power bank, batteries, flashlight)",
      impact: "High",
    });
  }

  if (scores[3] < 50) {
    plan.push({
      day: 4,
      action: "Create communication backup plan (contacts + radio)",
      impact: "Medium",
    });
  }

  plan.push(
    {
      day: 5,
      action: "Print emergency documents & contacts",
      impact: "Medium",
    },
    {
      day: 6,
      action: "Prepare emergency kit (basic go-bag)",
      impact: "High",
    },
    {
      day: 7,
      action: "Review household readiness & improve weak areas",
      impact: "Medium",
    }
  );

  return plan;
}function checkUnlock() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("paid") === "1") {
    localStorage.setItem("premium", "true");
  }
}

checkUnlock();async function buyFullReport() {
  const res = await fetch("http://localhost:3000/create-checkout-session", {
    method: "POST",
  });

  const data = await res.json();

  window.location.href = data.url;
}