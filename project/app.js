const supabaseUrl = "https://cqeuabsqjftuagcbiyzq.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZXVhYnNxamZ0dWFnY2JpeXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTg1MDUsImV4cCI6MjA5NjU3NDUwNX0.Od_DYEycWd-7nnTJX3FGPgPJz1y-YhBxVr7hz1yZfII"


const client = supabase.createClient(supabaseUrl, supabaseKey)

function getInitials(name) {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
}

async function fetchData() {
  const { data: teams } = await client.from("teams").select("*")
  const { data: predictions } = await client.from("predictions").select("*")

  const map = {}

  teams.forEach(t => {
    map[t.name] = {
      ...t,
      voters: []
    }
  })

  predictions.forEach(p => {
    if (map[p.champion]) {
      map[p.champion].voters.push(p.name)
    }
  })

  render(Object.values(map))
}

function render(teams) {
  const activeDiv = document.getElementById("active")
  const eliminatedDiv = document.getElementById("eliminated")

  activeDiv.innerHTML = ""
  eliminatedDiv.innerHTML = ""

  teams.forEach(team => {
    const card = document.createElement("div")
    card.className = "card"

    if (team.is_eliminated) {
      card.classList.add("eliminated")
    }

    card.innerHTML = `
      <h3>${team.flag} ${team.name}</h3>
      <p>${team.voters.length} votes</p>
      <div class="bubbles">
        ${team.voters
          .map(v => `<div class="bubble">${getInitials(v)}</div>`)
          .join("")}
      </div>
    `

    if (team.is_eliminated) {
      eliminatedDiv.appendChild(card)
    } else {
      activeDiv.appendChild(card)
    }
  })
  renderBracket(teams)
}

function renderBracket(teams) {
  const bracket = document.getElementById("bracket")
  bracket.innerHTML = ""

  const active = teams.filter(t => !t.is_eliminated)

  for (let i = 0; i < active.length; i += 2) {
    const teamA = active[i]
    const teamB = active[i + 1]

    if (!teamB) continue

    const match = document.createElement("div")
    match.className = "card"

    match.innerHTML = `
      <div>${teamA.flag} ${teamA.name} (${teamA.voters.length})</div>
      <div>${teamB.flag} ${teamB.name} (${teamB.voters.length})</div>
    `

    bracket.appendChild(match)
  }
}

supabase.from("leaderboard").select("*").order("points", { ascending: false })

async function fetchLeaderboard() {
  const { data, error } = await client
    .from("leaderboard")
    .select("*")
    .order("points", { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  renderLeaderboard(data)
}

function getMedal(index) {
  if (index === 0) return "🥇"
  if (index === 1) return "🥈"
  if (index === 2) return "🥉"
  return `#${index + 1}`
}

function getClass(index) {
  if (index === 0) return "top1"
  if (index === 1) return "top2"
  if (index === 2) return "top3"
  return ""
}

function renderLeaderboard(data) {
  const container = document.getElementById("leaderboard")
  container.innerHTML = ""

  data.forEach((player, index) => {
    const row = document.createElement("div")
    row.className = `row ${getClass(index)}`

    row.innerHTML = `
      <div>
        ${getMedal(index)} 
        <span class="name">${player.name}</span>
      </div>

      <div class="points">
        ${player.points} pts
      </div>
    `

    container.appendChild(row)
  })
}

fetchLeaderboard()

fetchData()

client
  .channel("realtime-leaderboard")
  .on("postgres_changes", { event: "*", schema: "public", table: "predictions" }, fetchLeaderboard)
  .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, fetchLeaderboard)
  .subscribe()
  
client
  .channel("realtime")
  .on("postgres_changes", { event: "*", table: "predictions" }, fetchData)
  .on("postgres_changes", { event: "*", table: "teams" }, fetchData)
  .subscribe()