const supabaseUrl = "https://cqeuabsqjftuagcbiyzq.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZXVhYnNxamZ0dWFnY2JpeXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTg1MDUsImV4cCI6MjA5NjU3NDUwNX0.Od_DYEycWd-7nnTJX3FGPgPJz1y-YhBxVr7hz1yZfII"

const client = supabase.createClient(supabaseUrl, supabaseKey)

// -------- STATUS --------
function getStatus(champ, runner) {
  if (!champ.is_eliminated && !runner.is_eliminated) return "alive"
  if (!champ.is_eliminated || !runner.is_eliminated) return "risk"
  return "out"
}

// -------- MAIN LOAD --------
async function load() {
  const { data: predictions } = await client.from("predictions").select("*")
  const { data: teams } = await client.from("teams").select("*")

  if (!predictions || !teams) return

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

  renderLeaderboard(players)
  renderKPIs(players)
  renderChart(players)
  renderHeatmap(players)
}

// -------- LEADERBOARD --------
function renderLeaderboard(players) {
  const container = document.getElementById("leaderboard")
  container.innerHTML = ""

  const max = Math.max(...players.map(p => p.points))

  players.forEach((p, i) => {
    const width = (p.points / max) * 100

    const row = document.createElement("div")
    row.className = "row"

    row.innerHTML = `
      <div><strong>#${i+1} ${p.name}</strong></div>
      <div>${p.champion} | ${p.runnerup}</div>
      <div class="${p.status}">${p.status}</div>
      <div class="bar">
        <div class="fill" style="width:${width}%"></div>
      </div>
    `

    container.appendChild(row)
  })
}

// -------- KPI CARDS --------
function renderKPIs(players) {
  if (!players || players.length === 0) return

  const alive = players.filter(p => p.status === "alive").length
  const eliminated = players.filter(p => p.status === "out").length

  const counts = {}
  players.forEach(p => {
    if (!p.champion) return
    counts[p.champion] = (counts[p.champion] || 0) + 1
  })

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const topTeam = sorted.length > 0 ? sorted[0][0] : "N/A"

  document.getElementById("kpiAlive").innerHTML =
    `<b>${Math.round(alive / players.length * 100)}%</b><br>Still Alive`

  document.getElementById("kpiEliminated").innerHTML =
    `<b>${eliminated}</b><br>Eliminated`

  document.getElementById("kpiTop").innerHTML =
    `<b>${topTeam}</b><br>Top Pick`

  document.getElementById("kpiRisk").innerHTML =
    `<b>${Math.round(eliminated / players.length * 100)}%</b><br>Risk Level`
}

// -------- BAR CHART --------
function renderChart(players) {
  const counts = {}

  players.forEach(p => {
    counts[p.champion] = (counts[p.champion] || 0) + 1
  })

  new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: "Votes",
        data: Object.values(counts),
        backgroundColor: "#0078d4"
      }]
    }
  })
}

// -------- HEATMAP --------
function renderHeatmap(players) {
  const counts = {}

  players.forEach(p => counts[p.champion] = (counts[p.champion] || 0) + 1)

  const max = Math.max(...Object.values(counts))
  const container = document.getElementById("heatmap")

  container.innerHTML = ""

  Object.entries(counts).forEach(([team, val]) => {
    const div = document.createElement("div")
    div.style.background = `rgba(0,120,212,${val/max})`
    div.innerHTML = team

    container.appendChild(div)
  })
}

// -------- REALTIME --------
document.addEventListener("DOMContentLoaded", () => {
  load()

  client.channel("live")
    .on("postgres_changes", { event: "*", table: "predictions" }, load)
    .on("postgres_changes", { event: "*", table: "teams" }, load)
    .subscribe()
})