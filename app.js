let homeBaseData = {
  kids: [],
  rules: [],
  transactions: []
};

const currentParent = "Laina";

document.addEventListener("DOMContentLoaded", async () => {
  await loadHomeBase();
  setupModal();
});

async function loadHomeBase() {
  try {
    homeBaseData = await getHomeBaseData();
    renderDashboard();
  } catch (error) {
    console.error(error);
    alert("HomeBase could not load Google Sheet data yet.");
  }
}

function renderDashboard() {
  renderKids();
  renderSummary();
  renderActivity();
  populateFormOptions();
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getKidTransactions(kidId) {
  return homeBaseData.transactions.filter(
    tx =>
      String(tx.kidId).trim() === String(kidId).trim() &&
      String(tx.month).slice(0, 7) === getCurrentMonth()
  );
}

function calculateKidStats(kid) {
  const transactions = getKidTransactions(kid.id);
  const earned = transactions
    .filter(tx => Number(tx.amount) > 0)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const lost = transactions
    .filter(tx => Number(tx.amount) < 0)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const balance = Number(kid.baseAllowance) + earned + lost;

  return { earned, lost, balance };
}

function calculateAge(birthday) {
  const today = new Date();
  const birth = new Date(birthday);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

function isBirthdayToday(birthday) {
  const today = new Date();
  const birth = new Date(birthday);
  return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
}

function renderKids() {
  const grid = document.querySelector(".kids-grid");
  grid.innerHTML = "";

  homeBaseData.kids
    .filter(kid => kid.active === true || kid.active === "TRUE" || kid.active === "true")
    .forEach(kid => {
      const stats = calculateKidStats(kid);
      const birthday = isBirthdayToday(kid.birthday);
      const ageText = birthday
        ? `🎉 Happy Birthday! Age ${calculateAge(kid.birthday)}`
        : `Age ${calculateAge(kid.birthday)}`;

      const card = document.createElement("article");
      card.className = `kid-card ${kid.id}`;
      card.innerHTML = `
        <div class="kid-top">
          <div class="avatar">${kid.avatar}</div>
          <div>
            <h3>${kid.name}</h3>
            <p>${ageText}</p>
          </div>
        </div>

        <div class="balance-row">
          <span>Balance</span>
          <strong>$${stats.balance.toFixed(2)}</strong>
        </div>

        <div class="mini-stats">
          <span>+$${stats.earned.toFixed(2)} earned</span>
          <span>-$${Math.abs(stats.lost).toFixed(2)} lost</span>
          <span>❤️ 0 kindness</span>
        </div>
      `;

      grid.appendChild(card);
    });
}

function renderSummary() {
  const activeKids = homeBaseData.kids.filter(
    kid => kid.active === true || kid.active === "TRUE" || kid.active === "true"
  );

  let familyBalance = 0;
  let earned = 0;
  let lost = 0;

  activeKids.forEach(kid => {
    const stats = calculateKidStats(kid);
    familyBalance += stats.balance;
    earned += stats.earned;
    lost += stats.lost;
  });

  const cards = document.querySelectorAll(".summary-card strong");
  if (cards[0]) cards[0].textContent = `$${familyBalance.toFixed(2)}`;
  if (cards[1]) cards[1].textContent = `$${earned.toFixed(2)}`;
  if (cards[2]) cards[2].textContent = `$${Math.abs(lost).toFixed(2)}`;
  if (cards[3]) cards[3].textContent = "0";
}

function renderActivity() {
  const panel = document.querySelector(".activity-panel");
  const recent = [...homeBaseData.transactions].reverse().slice(0, 5);

  if (!recent.length) {
    panel.innerHTML = `
      <div>
        <h2>Recent Activity</h2>
        <p>No activity yet. Add the first reward or deduction soon.</p>
      </div>
      <div class="empty-state">🐶 Charlie is ready for his first walk entry.</div>
    `;
    return;
  }

  panel.innerHTML = `
    <div>
      <h2>Recent Activity</h2>
      <p>Latest rewards and deductions.</p>
    </div>
    <div class="activity-list">
      ${recent.map(tx => `
        <div class="activity-item ${Number(tx.amount) >= 0 ? "positive" : "negative"}">
          <strong>${Number(tx.amount) >= 0 ? "+" : "-"}$${Math.abs(Number(tx.amount)).toFixed(2)}</strong>
          <span>${tx.kidName}: ${tx.label}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function setupModal() {
  const addButton = document.querySelector(".primary-button");

  addButton.addEventListener("click", () => {
    document.querySelector(".modal-backdrop").classList.add("show");
  });

  document.querySelector(".modal-close").addEventListener("click", closeModal);
  document.querySelector(".modal-backdrop").addEventListener("click", event => {
    if (event.target.classList.contains("modal-backdrop")) closeModal();
  });

  document.querySelector("#ruleSelect").addEventListener("change", updateAmountFromRule);
  document.querySelector("#transactionForm").addEventListener("submit", saveTransaction);
}

function closeModal() {
  document.querySelector(".modal-backdrop").classList.remove("show");
}

function populateFormOptions() {
  const kidSelect = document.querySelector("#kidSelect");
  const ruleSelect = document.querySelector("#ruleSelect");

  kidSelect.innerHTML = homeBaseData.kids
    .filter(kid => kid.active === true || kid.active === "TRUE" || kid.active === "true")
    .map(kid => `<option value="${kid.id}">${kid.name}</option>`)
    .join("");

  ruleSelect.innerHTML = homeBaseData.rules
    .filter(rule => rule.active === true || rule.active === "TRUE" || rule.active === "true")
    .map(rule => `<option value="${rule.id}">${rule.type === "earn" ? "⭐" : "⚠️"} ${rule.label} (${formatAmount(rule.amount)})</option>`)
    .join("");

  updateAmountFromRule();
}

function updateAmountFromRule() {
  const ruleId = document.querySelector("#ruleSelect").value;
  const rule = homeBaseData.rules.find(r => r.id === ruleId);
  if (!rule) return;

  document.querySelector("#amountInput").value = Number(rule.amount);
}

function formatAmount(amount) {
  const number = Number(amount);
  return `${number >= 0 ? "+" : "-"}$${Math.abs(number).toFixed(2)}`;
}

async function saveTransaction(event) {
  event.preventDefault();

  const kidId = document.querySelector("#kidSelect").value;
  const ruleId = document.querySelector("#ruleSelect").value;
  const amount = Number(document.querySelector("#amountInput").value);
  const note = document.querySelector("#noteInput").value;

  const kid = homeBaseData.kids.find(k => k.id === kidId);
  const rule = homeBaseData.rules.find(r => r.id === ruleId);

  const transaction = {
    kidId: kid.id,
    kidName: kid.name,
    type: rule.type,
    label: rule.label,
    amount,
    category: rule.category,
    note,
    parent: currentParent
  };

  await addHomeBaseTransaction(transaction);

  closeModal();
  document.querySelector("#transactionForm").reset();
  await loadHomeBase();
}
