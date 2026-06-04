const SUPABASE_URL = "https://yzdmjfpwxqhzfdvoqcai.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TEeZZG6M_RWYvv7jkFe5pQb1H2q";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let current = 0;
let scores = [];

const questions = [
  {
    q: "Water storage",
    options: [
      { text: "Less than 5L", value: 0 },
      { text: "5–20L", value: 25 },
      { text: "20–50L", value: 50 },
      { text: "50L+", value: 100 }
    ]
  },
  {
    q: "Food supply",
    options: [
      { text: "1 day", value: 0 },
      { text: "2–3 days", value: 25 },
      { text: "5 days", value: 50 },
      { text: "7+ days", value: 100 }
    ]
  },
  {
    q: "Energy backup",
    options: [
      { text: "None", value: 0 },
      { text: "Power bank", value: 50 },
      { text: "Generator", value: 100 }
    ]
  },
  {
    q: "Communication",
    options: [
      { text: "None", value: 0 },
      { text: "Basic plan", value: 50 },
      { text: "Full plan", value: 100 }
    ]
  }
];

function startQuiz() {
  document.getElementById("landing").classList.remove("active");
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

    btn.onclick = () => {
      scores.push(opt.value);
      current++;

      if (current < questions.length) {
        loadQuestion();
      } else {
        finishQuiz();
      }
    };

    optionsDiv.appendChild(btn);
  });

  document.getElementById("currentStep").innerText = current + 1;
  document.getElementById("progressBar").style.width =
    (current / questions.length) * 100 + "%";
}

async function finishQuiz() {
  const total = scores.reduce((a, b) => a + b, 0);
  const score = Math.round(total / scores.length);

  document.getElementById("quiz").classList.remove("active");
  document.getElementById("result").classList.add("active");

  document.getElementById("score").innerText = score + "%";

  await supabase.from("assessments").insert([
    { preparedness_score: score }
  ]);
}

function unlockPremium() {
  window.location.href =
    "https://buy.stripe.com/test_00w3cv0SQaYa70uczm9R600";
}