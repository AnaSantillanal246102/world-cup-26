const supabaseUrl = "https://cqeuabsqjftuagcbiyzq.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZXVhYnNxamZ0dWFnY2JpeXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTg1MDUsImV4cCI6MjA5NjU3NDUwNX0.Od_DYEycWd-7nnTJX3FGPgPJz1y-YhBxVr7hz1yZfII"

const client = supabase.createClient(supabaseUrl, supabaseKey)

// ---------- STATUS ----------
function getStatus(champ, runner) {
  if (!champ.is_eliminated && !runner.is_eliminated)
    return { label: "🟢 In Competition", class: "status-alive" }

  if (!champ.is_eliminated || !runner.is_eliminated)
    return { label: "🟡 At Risk", class: "status-risk" }

  return { label: "🔴 Eliminated", class: "status-out" }
}

// ---------- LEADERBOARD ----------
async function loadLeaderboard() {
  const { data: predictions } = await client.from("predictions").select("*")
  const { data: teams } = await client.from("teams").select("*")

  if (!predictions || !teams) return

  const container = document.getElementById("leaderboard")
  container.innerHTML = ""

  const players = predictions.map(p => {
    const champ = teams.find(t => t.name === p.champion)
    const runner = teams.find(t => t.name === p.runnerup)

    const status = getStatus(champ, runner)

    let points = 0
    if (!champ.is_eliminated) points += 3
    if (!runner.is_eliminated) points += 1

    return { ...p, points, status }
  })

  players.sort((a, b) => b.points - a.points)

  players.forEach((p, i) => {
    const row = document.createElement("div")
    row.className = "row"

    row.innerHTML = `
      <strong>#${i + 1} ${p.name}</strong> - ${p.points} pts
      <div>${p.champion} | ${p.runnerup}</div>
      <div class="${p.status.class}">${p.status.label}</div>
    `

    container.appendChild(row)
  })

  buildInsights(players, teams)
  renderChart(players)
  renderHeatmap(players)
  renderMatches(teams)
}

// ---------- INSIGHTS ----------
function buildInsights(players, teams) {

  const alive = players.filter(p => p.status.class === "status-alive").length

  document.getElementById("probability").innerHTML =
    `🎯 Win Probability<br>${alive}/${players.length} alive (${Math.round(alive / players.length * 100)}%)`

  // Top Teams
  const counts = {}
  players.forEach(p => counts[p.champion] = (counts[p.champion] || 0) + 1)

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])

  document.getElementById("topTeams").innerHTML =
    `🔥 Top Teams<br>${sorted.slice(0,3).map(t => t.join(": ")).join("<br>")}`

  // Risk
  const eliminated = teams.filter(t => t.is_eliminated).length

  document.getElementById("risk").innerHTML =
    `⚠️ Risk Level<br>${Math.round(eliminated / teams.length * 100)}% teams eliminated`

  // Eliminated players
  const dead = players.filter(p => p.status.class === "status-out").length

  document.getElementById("eliminatedCount").innerHTML =
    `💀 Eliminated Players<br>${dead}`
}

// ---------- CHART ----------
function renderChart(players) {
  const counts = {}

  players.forEach(p => {
    counts[p.champion] = (counts[p.champion] || 0) + 1
  })

  new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [{ data: Object.values(counts) }]
    }
  })
}

// ---------- HEATMAP ----------
function renderHeatmap(players) {
  const counts = {}

  players.forEach(p => counts[p.champion] = (counts[p.champion] || 0) + 1)

  const max = Math.max(...Object.values(counts))
  const container = document.getElementById("heatmap")

  container.innerHTML = ""

  Object.entries(counts).forEach(([team, val]) => {
    const div = document.createElement("div")

    div.style.background = `rgba(255,0,0,${val / max})`
    div.style.padding = "10px"
    div.innerHTML = `${team}`

    container.appendChild(div)
  })
}

// ---------- MATCHES ----------
function renderMatches(teams) {
  const container = document.getElementById("matches")
  container.innerHTML = ""

  const alive = teams.filter(t => !t.is_eliminated)

  for (let i = 0; i < alive.length; i += 2) {
    if (!alive[i + 1]) break

    const match = document.createElement("div")
    match.className = "card"

    match.innerHTML = `
      ${alive[i].name} vs ${alive[i + 1].name}
    `

    container.appendChild(match)
  }
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  loadLeaderboard()

  client.channel("live")
    .on("postgres_changes", { event: "*", table: "predictions" }, loadLeaderboard)
    .on("postgres_changes", { event: "*", table: "teams" }, loadLeaderboard)
    .subscribe()
})