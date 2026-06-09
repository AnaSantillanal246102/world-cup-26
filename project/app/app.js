const supabaseUrl = "https://cqeuabsqjftuagcbiyzq.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZXVhYnNxamZ0dWFnY2JpeXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTg1MDUsImV4cCI6MjA5NjU3NDUwNX0.Od_DYEycWd-7nnTJX3FGPgPJz1y-YhBxVr7hz1yZfII"
const client = supabase.createClient(supabaseUrl, supabaseKey)

async function fetchLeaderboard() {
  const { data, error } = await client
    .from("leaderboard")
    .select("*")
    .order("points", { ascending: false })

  if (error) {
    console.error("Leaderboard error:", error)
    return
  }

  console.log("Leaderboard data:", data)

  renderLeaderboard(data)
}

async function renderChart() {
  const { data } = await client.from("predictions").select("*")

  const counts = {}

  data.forEach(p => {
    counts[p.champion] = (counts[p.champion] || 0) + 1
  })

  const labels = Object.keys(counts)
  const values = Object.values(counts)

  new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Votes",
        data: values
      }]
    }
  })
}

function renderLeaderboard(data) {
  if (!data || data.length === 0) return

  const max = Math.max(...data.map(p => p.points || 0))

  const container = document.getElementById("leaderboard")
  container.innerHTML = ""

  data.forEach((p, i) => {
    const width = max ? (p.points / max) * 100 : 0

    const row = document.createElement("div")
    row.innerHTML = `
      <div style="margin-bottom:10px">
        <strong>#${i+1} ${p.name}</strong> - ${p.points || 0} pts
        <div style="background:#eee; height:8px; border-radius:10px">
          <div style="width:${width}%; background:#0070f3; height:8px"></div>
        </div>
      </div>
    `

    container.appendChild(row)
  })
}

async function getEliminatedPlayers() {
  const { data: predictions } = await client.from("predictions").select("*")
  const { data: teams } = await client.from("teams").select("*")

  const eliminated = []

  predictions.forEach(p => {
    const champ = teams.find(t => t.name === p.champion)
    const runner = teams.find(t => t.name === p.runnerup)

    if (champ?.is_eliminated && runner?.is_eliminated) {
      eliminated.push(p.name)
    }
  })

  console.log("💀 Eliminated players:", eliminated)
}

function renderEliminated(players) {
  const div = document.getElementById("eliminatedPlayers")
  div.innerHTML = players.map(p => `<div>❌ ${p}</div>`).join("")
}


async function renderHeatmap() {
  const { data } = await client.from("predictions").select("*")

  const counts = {}

  data.forEach(p => {
    counts[p.champion] = (counts[p.champion] || 0) + 1
  })

  const max = Math.max(...Object.values(counts))

  const container = document.getElementById("heatmap")
  container.innerHTML = ""

  Object.entries(counts).forEach(([team, value]) => {
    const intensity = value / max

    const div = document.createElement("div")
    div.style.background = `rgba(255,0,0,${intensity})`
    div.style.padding = "10px"
    div.innerHTML = `${team} (${value})`

    container.appendChild(div)
  })
}

function renderLeaderboard(data) {
  const max = Math.max(...data.map(p => p.points))

  const container = document.getElementById("leaderboard")
  container.innerHTML = ""

  data.forEach((p, i) => {
    const width = (p.points / max) * 100

    const row = document.createElement("div")
    row.innerHTML = `
      <div style="margin-bottom:10px">
        <strong>#${i+1} ${p.name}</strong> - ${p.points} pts
        <div style="background:#eee; height:8px; border-radius:10px">
          <div style="width:${width}%; background:#0070f3; height:8px"></div>
        </div>
      </div>
    `

    container.appendChild(row)
  })
}

function animateUpdate(element) {
  element.style.transform = "scale(1.1)"
  element.style.transition = "0.3s"

  setTimeout(() => {
    element.style.transform = "scale(1)"
  }, 300)
}

document.addEventListener("DOMContentLoaded", async () => {
  await fetchLeaderboard()

  const eliminated = await getEliminatedPlayers()
  renderEliminated(eliminated)

  renderChart()
  renderHeatmap()
})

