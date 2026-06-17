
const SUPABASE_URL  = 'https://cqeuabsqjftuagcbiyzq.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZXVhYnNxamZ0dWFnY2JpeXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTg1MDUsImV4cCI6MjA5NjU3NDUwNX0.Od_DYEycWd-7nnTJX3FGPgPJz1y-YhBxVr7hz1yZfII';

/* ─── Supabase client ─────────────────────────────────────── */
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

/* ─── FLAGS MAP ───────────────────────────────────────────── */
const FLAGS = {
  'Argentina':'\u{1F1E6}\u{1F1F7}','Brazil':'\u{1F1E7}\u{1F1F7}','Mexico':'\u{1F1F2}\u{1F1FD}','Spain':'\u{1F1EA}\u{1F1F8}',
  'France':'\u{1F1EB}\u{1F1F7}','Germany':'\u{1F1E9}\u{1F1EA}','Portugal':'\u{1F1F5}\u{1F1F9}','England':'\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F',
  'Morocco':'\u{1F1F2}\u{1F1E6}','Japan':'\u{1F1EF}\u{1F1F5}','Uruguay':'\u{1F1FA}\u{1F1FE}','Colombia':'\u{1F1E8}\u{1F1F4}',
  'Netherlands':'\u{1F1F3}\u{1F1F1}','Croatia':'\u{1F1ED}\u{1F1F7}','Senegal':'\u{1F1F8}\u{1F1F3}','Ecuador':'\u{1F1EA}\u{1F1E8}',
  'USA':'\u{1F1FA}\u{1F1F8}','United States':'\u{1F1FA}\u{1F1F8}','Canada':'\u{1F1E8}\u{1F1E6}','Australia':'\u{1F1E6}\u{1F1FA}','Switzerland':'\u{1F1E8}\u{1F1ED}',
  'Belgium':'\u{1F1E7}\u{1F1EA}','Italy':'\u{1F1EE}\u{1F1F9}','Ghana':'\u{1F1EC}\u{1F1ED}','Serbia':'\u{1F1F7}\u{1F1F8}',
  'Tunisia':'\u{1F1F9}\u{1F1F3}','Costa Rica':'\u{1F1E8}\u{1F1F7}','Cameroon':'\u{1F1E8}\u{1F1F2}','Wales':'\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73\uDB40\uDC7F',
  'Saudi Arabia':'\u{1F1F8}\u{1F1E6}','Qatar':'\u{1F1F6}\u{1F1E6}','Poland':'\u{1F1F5}\u{1F1F1}','Denmark':'\u{1F1E9}\u{1F1F0}',
  'South Korea':'\u{1F1F0}\u{1F1F7}','Korea':'\u{1F1F0}\u{1F1F7}','Iran':'\u{1F1EE}\u{1F1F7}','Nigeria':'\u{1F1F3}\u{1F1EC}',
  'Chile':'\u{1F1E8}\u{1F1F1}','Peru':'\u{1F1F5}\u{1F1EA}','Paraguay':'\u{1F1F5}\u{1F1FE}','Bolivia':'\u{1F1E7}\u{1F1F4}',
  'Honduras':'\u{1F1ED}\u{1F1F3}','Panama':'\u{1F1F5}\u{1F1E6}','Jamaica':'\u{1F1EF}\u{1F1F2}',
  'New Zealand':'\u{1F1F3}\u{1F1FF}','South Africa':'\u{1F1FF}\u{1F1E6}','Algeria':'\u{1F1E9}\u{1F1FF}','Egypt':'\u{1F1EA}\u{1F1EC}',
  'Greece':'\u{1F1EC}\u{1F1F7}','Turkey':'\u{1F1F9}\u{1F1F7}','Ukraine':'\u{1F1FA}\u{1F1E6}','Sweden':'\u{1F1F8}\u{1F1EA}',
  'Norway':'\u{1F1F3}\u{1F1F4}','Scotland':'\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74\uDB40\uDC7F','Austria':'\u{1F1E6}\u{1F1F9}','Czech Republic':'\u{1F1E8}\u{1F1FF}',
};
const flag = n => FLAGS[n] || '\u{1F3F3}';

/* ─── COLOR UTILS ─────────────────────────────────────────── */
const PALETTE = [
  '#1a5c2e','#2563eb','#7c3aed','#c9a227',
  '#ea580c','#0891b2','#be123c','#065f46',
];
let _pc = 0;
const colorMap = {};
function avColor(name){
  if(!colorMap[name]) colorMap[name] = PALETTE[(_pc++)%PALETTE.length];
  return colorMap[name];
}
function initials(name){
  return (name||'').split(' ').filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2);
}

/* ─── STATE ───────────────────────────────────────────────── */
let state = { leaderboard:[], teams:[], bracket:[] };

/* ─── STATUS LOGIC ────────────────────────────────────────── */
function participantStatus(row, teamsMap){
  // Prefer teamsMap (from teams table), fall back to fields on the row itself
  const ce = teamsMap[row.champion]
    ? teamsMap[row.champion].is_eliminated
    : (row.champion_eliminated ?? false);
  const se = teamsMap[row.runnerup]
    ? teamsMap[row.runnerup].is_eliminated
    : (row.runnerup_eliminated ?? false);
  if(!ce && !se) return 'active';
  if(ce && se)   return 'out';
  return 'risk';
}

/* ─── BUILD TEAMS MAP (also from leaderboard rows when teams table empty) ── */
function buildTeamsMap(){
  const map = {};
  // Primary: from teams table
  state.teams.forEach(t => map[t.name] = t);
  // Fallback: synthesize from leaderboard rows using champion_eliminated / runnerup_eliminated
  if (state.teams.length === 0) {
    state.leaderboard.forEach(r => {
      if (!map[r.champion]) map[r.champion] = { name: r.champion, is_eliminated: r.champion_eliminated ?? false };
      if (!map[r.runnerup]) map[r.runnerup] = { name: r.runnerup, is_eliminated: r.runnerup_eliminated ?? false };
    });
  }
  return map;
}

/* ─── FETCH ───────────────────────────────────────────────── */
async function fetchAll(){
  const [{ data: lb }, { data: teams }, { data: bracket }] = await Promise.all([
    db.from('leaderboard').select('*').order('points', {ascending:false}),
    db.from('teams').select('*').order('name'),
    db.from('bracket_matches').select('*').order('id'),   // optional, see below
  ]);

  state.leaderboard = lb ?? [];
  state.teams       = teams ?? [];
  state.bracket     = bracket ?? [];

  renderAll();
}

async function fetchAllSafe(){
  const [lbRes, teamsRes] = await Promise.all([
    db.from('leaderboard').select('*').order('points', {ascending:false}),
    db.from('teams').select('*').order('name'),
  ]);

  const { data: bracketData } = await db.from('bracket_matches').select('*').order('id');

  state.leaderboard = lbRes.data ?? [];
  state.teams       = teamsRes.data ?? [];
  state.bracket     = bracketData ?? [];

  // If teams table is empty, build a synthetic teamsMap from leaderboard data
  // by joining with the leaderboard view which already has is_eliminated via points=0
  // We fix this properly: re-fetch with explicit join info
  if (state.teams.length === 0 && state.leaderboard.length > 0) {
    // Build teams list from unique champion/runnerup names in leaderboard
    const names = new Set();
    state.leaderboard.forEach(r => { names.add(r.champion); names.add(r.runnerup); });
    // Fetch elimination status for these teams
    const { data: teamsFromDB } = await db.from('teams').select('*').in('name', [...names]);
    if (teamsFromDB && teamsFromDB.length > 0) {
      state.teams = teamsFromDB;
    }
  }

  renderAll();
}

/* ─── RENDER ALL ──────────────────────────────────────────── */
function renderAll(){
  const teamsMap = buildTeamsMap();
  renderHero(teamsMap);
  renderLeaderboard(teamsMap);
  renderTeams(teamsMap);
  renderInsights(teamsMap);
  renderBracket();
}

/* ─── HERO ────────────────────────────────────────────────── */
function renderHero(teamsMap){
  const lb = state.leaderboard;
  const allTeams = state.teams.length > 0
    ? state.teams
    : Object.values(teamsMap);
  const elim   = allTeams.filter(t=> t.is_eliminated);
  const total = lb.length;
  const activeCount = lb.filter(r=>participantStatus(r,teamsMap)==='active').length;
  const outCount    = lb.filter(r=>participantStatus(r,teamsMap)==='out').length;
  const leader      = lb[0];

  document.getElementById('hs-total').textContent  = total;
  document.getElementById('hs-elim').textContent   = outCount;
  document.getElementById('hs-alive').textContent  = activeCount;
  document.getElementById('hs-leader').textContent = leader ? `${leader.points}pts` : '—';
  document.getElementById('hero-sub').textContent  =
    `${total} participants · ${elim.length} eliminated teams`;
}

/* ─── LEADERBOARD ─────────────────────────────────────────── */
function renderLeaderboard(teamsMap){
  const lb = state.leaderboard;
  if(!lb.length){
    document.getElementById('lb-body').innerHTML =
      '<tr><td colspan="6"><div class="loading-state">No participants registered yet.</div></td></tr>';
    return;
  }

  const active = lb.filter(r => participantStatus(r,teamsMap) !== 'out');
  const out    = lb.filter(r => participantStatus(r,teamsMap) === 'out');

  let rank = 1;
  const rowHtml = r => {
    const st   = participantStatus(r, teamsMap);
    const isOut = st === 'out';
    const ce   = teamsMap[r.champion]?.is_eliminated;
    const se   = teamsMap[r.runnerup]?.is_eliminated;
    const rk   = isOut ? '—' : rank;
    const rkCls = rank===1?'r1':rank===2?'r2':rank===3?'r3':'';
    if(!isOut) rank++;

    const statusBadge = {
      active: '<span class="status-badge sb-active">Still in</span>',
      risk:   '<span class="status-badge sb-risk">At risk</span>',
      out:    '<span class="status-badge sb-out">Eliminated</span>',
    }[st];

    const campPill = `<span class="pick-pill ${ce?'pill-dead':'pill-ok'}">${flag(r.champion)} ${r.champion}</span>`;
    const subPill  = `<span class="pick-pill ${se?'pill-dead':ce?'pill-warn':'pill-ok'}">${flag(r.runnerup)} ${r.runnerup}</span>`;

    const ptsCls = rank-1===1 && !isOut ? 'pts-top' : '';
    const color  = avColor(r.name);

    return `<tr class="${isOut?'row-disabled':''}">
      <td class="rank-cell ${isOut?'':rkCls}">${typeof rk==='number'&&rk<=3?['🥇','🥈','🥉'][rk-1]:rk}</td>
      <td><div class="name-cell">
        <div class="av ${isOut?'av-gray':'av-green'}" style="background:${color}">${initials(r.name)}</div>
        <div><div class="pname">${r.name}</div><div class="parea">${r.area||''}</div></div>
      </div></td>
      <td class="pick-cell col-hide">${campPill}</td>
      <td class="pick-cell col-hide">${subPill}</td>
      <td>${statusBadge}</td>
      <td class="pts-cell ${ptsCls}">${r.points}</td>
    </tr>`;
  };

  let html = active.map(rowHtml).join('');
  if(out.length){
    html += `<tr class="lb-divider"><td colspan="6">Eliminated participants · ${out.length}</td></tr>`;
    html += out.map(rowHtml).join('');
  }

  document.getElementById('lb-body').innerHTML = html;
}

/* ─── TEAMS TAB ───────────────────────────────────────────── */
function renderTeams(teamsMap){
  const lb = state.leaderboard;

  // Build full teams list: prefer state.teams, else synthesize from teamsMap
  const allTeams = state.teams.length > 0
    ? state.teams
    : Object.values(teamsMap);

  // voterMap: team name → participants who picked it as champion
  const voterMap = {};
  allTeams.forEach(t => voterMap[t.name] = []);
  lb.forEach(r => {
    // champion pick
    if (voterMap[r.champion] !== undefined)
      voterMap[r.champion].push({ name: r.name, area: r.area, status: participantStatus(r, teamsMap), pick: 'champion' });
    // runnerup pick — add to that team's card too if different
    if (voterMap[r.runnerup] !== undefined && r.runnerup !== r.champion)
      voterMap[r.runnerup].push({ name: r.name, area: r.area, status: participantStatus(r, teamsMap), pick: 'runnerup' });
  });

  const active = allTeams.filter(t=>!t.is_eliminated);
  const elim   = allTeams.filter(t=> t.is_eliminated);

  function cardHtml(t, disabled){
    const voters = voterMap[t.name] || [];
    const bubbles = voters.length
      ? voters.map(v=>{
          const isOut = v.status==='out';
          const color = avColor(v.name);
          return `<div class="voter-bbl" title="${v.name}">
            <div class="vav ${isOut?'vav-out':'vav-ok'}" style="${isOut?'':'background:'+color}">${initials(v.name)}</div>
            <div class="vav-name">${v.name.split(' ')[0]}</div>
          </div>`;
        }).join('')
      : '<span class="no-votes">No votes</span>';

    const statusEl = disabled
      ? '<span class="team-status ts-out">Eliminada</span>'
      : '<span class="team-status ts-ok">En juego</span>';

    return `<div class="team-card ${disabled?'disabled':''}">
      <div class="team-header">
        <span class="flag">${flag(t.name)}</span>
        <div class="team-info">
          <div class="team-name">${t.name}</div>
          <div class="team-sub">${voters.length} vote${voters.length!==1?'s':''} for champion</div>
        </div>
        ${statusEl}
      </div>
      <div class="voters-label">Picked this team as champion</div>
      <div class="voters-bubbles">${bubbles}</div>
    </div>`;
  }

  document.getElementById('teams-loading').style.display='none';
  const ag = document.getElementById('teams-active-grid');
  ag.innerHTML = active.map(t=>cardHtml(t,false)).join('');
  ag.style.display='grid';

  if(elim.length){
    document.getElementById('teams-elim-grid').innerHTML = elim.map(t=>cardHtml(t,true)).join('');
    document.getElementById('teams-elim-section').style.display='block';
  }
}

/* ─── INSIGHTS ────────────────────────────────────────────── */
function renderInsights(teamsMap){
  const lb      = state.leaderboard;
  const teams   = state.teams;
  const total   = lb.length;
  if(!total){ document.getElementById('insights-loading').innerHTML='<div class="loading-state">No data.</div>'; return; }

  /* ── 1. % por selección ── */
  const campCount = {};
  lb.forEach(r=>{ campCount[r.champion]=(campCount[r.champion]||0)+1; });
  const topByPct = Object.entries(campCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxPct   = topByPct[0]?.[1] || 1;
  const pctBars  = topByPct.map(([name,cnt])=>{
    const pct=Math.round(cnt/total*100);
    return `<div class="mini-bar-row">
      <div class="mini-bar-label">${flag(name)} ${name}</div>
      <div class="mini-bar-track"><div class="mini-bar-fill bar-gold" style="width:${Math.round(cnt/maxPct*100)}%"></div></div>
      <div class="mini-bar-count">${pct}%</div>
    </div>`;
  }).join('');

  /* ── 2. Top favorite picks ── */
  const top1 = topByPct[0];
  const topBars = topByPct.slice(0,4).map(([name,cnt])=>`
    <div class="mini-bar-row">
      <div class="mini-bar-label">${flag(name)} ${name}</div>
      <div class="mini-bar-track"><div class="mini-bar-fill" style="width:${Math.round(cnt/maxPct*100)}%"></div></div>
      <div class="mini-bar-count">${cnt}</div>
    </div>`).join('');

  /* ── 3. Probabilidad de ganar del grupo ── */
  const stillAlive  = lb.filter(r=>participantStatus(r,teamsMap)==='active').length;
  const aliveRisk   = lb.filter(r=>participantStatus(r,teamsMap)==='risk').length;
  const pctWin      = total>0 ? Math.round(stillAlive/total*100) : 0;

  /* ── 4. Tournament risk (% at risk or eliminated) ── */
  const riskCount   = lb.filter(r=>participantStatus(r,teamsMap)!=='active').length;
  const riskPct     = total>0 ? Math.round(riskCount/total*100) : 0;
  const riskNeedle  = riskPct;

  /* ── 5. Top picks vs picks únicos ── */
  const uniquePicks = Object.entries(campCount).filter(([,c])=>c===1).length;
  const topPick     = topByPct[0]?.[0] || '—';
  const topPickCnt  = topByPct[0]?.[1] || 0;

  /* ── 6. Caídas de la fase ── */
  const outCount    = lb.filter(r=>participantStatus(r,teamsMap)==='out').length;
  const outBars     = lb.filter(r=>participantStatus(r,teamsMap)==='out').slice(0,4).map(r=>`
    <div class="mini-bar-row">
      <div class="mini-bar-label">${initials(r.name)} ${r.name.split(' ')[0]}</div>
      <div class="mini-bar-track"><div class="mini-bar-fill bar-red" style="width:100%"></div></div>
      <div class="mini-bar-count">0</div>
    </div>`).join('');

  const cards = [
    {
      accent:'accent-gold', icon:'🌍', title:'% of participants per team',
      main: `${topByPct[0]?.[1]||0}`, sub:`of ${total} picked ${topByPct[0]?.[0]||'—'}`,
      detail: pctBars,
    },
    {
      accent:'accent-green', icon:'⭐', title:'Top favorite picks',
      main: `${top1?.[0]||'—'}`, sub:`the favorite with ${top1?.[1]||0} votes`,
      detail: topBars,
    },
    {
      accent:'accent-blue', icon:'🎯', title:'Odds of winning (group)',
      main: `${pctWin}%`, sub:`${stillAlive} of ${total} still fully in contention`,
      detail:`<div style="font-size:12px;color:var(--ink-soft);margin-top:4px">
        <span style="color:var(--ok)">■</span> ${stillAlive} in contention &nbsp;
        <span style="color:var(--warn)">■</span> ${aliveRisk} at risk &nbsp;
        <span style="color:var(--ink-soft)">■</span> ${outCount} eliminated
      </div>`,
    },
    {
      accent:'accent-orange', icon:'⚠️', title:'Tournament risk',
      main: `${riskPct}%`, sub:'of participants at risk or eliminated',
      detail:`<div class="risk-meter">
        <div class="risk-track"><div class="risk-needle" style="left:${riskNeedle}%"></div></div>
        <div class="risk-labels"><span>Low</span><span>Medium</span><span>High</span></div>
      </div>`,
    },
    {
      accent:'accent-purple', icon:'🔮', title:'Top picks vs unique picks',
      main: `${uniquePicks}`, sub:`teams picked by only one person`,
      detail:`<div style="font-size:12px;color:var(--ink-mid);margin-top:6px">
        <strong>${flag(topPick)} ${topPick}</strong> lidera con <strong>${topPickCnt} votes</strong> — the undisputed favorite.<br/>
        <span style="color:var(--ink-soft)">${uniquePicks} teams are backed by only 1 participant.</span>
      </div>`,
    },
    {
      accent:'accent-red', icon:'💥', title:'Phase knockouts',
      main: `${outCount}`, sub:`participants completely eliminated`,
      detail: outCount>0 ? outBars : '<span style="font-size:12px;color:var(--ink-soft)">Nobody eliminated yet!</span>',
    },
  ];

  document.getElementById('insights-grid').innerHTML = cards.map(c=>`
    <div class="ins-card ${c.accent}">
      <div class="ins-icon">${c.icon}</div>
      <div class="ins-title">${c.title}</div>
      <div class="ins-main">${c.main}</div>
      <div class="ins-sub">${c.sub}</div>
      <div class="ins-detail">${c.detail}</div>
    </div>`).join('');

  document.getElementById('insights-loading').style.display='none';
  document.getElementById('insights-content').style.display='block';
}

/* ─── BRACKET ─────────────────────────────────────────────── */
function renderBracket(){
  /* Si tienes una tabla bracket_matches en Supabase con columnas:
       round (QF/SF/F), match_order, team1, team2, score1, score2, winner
     se usa state.bracket. Si no, se muestra placeholder con TBD.
  */
  const matches = state.bracket;

  function getMatch(round, order){
    return matches.find(m=>m.round===round && m.match_order===order) || null;
  }

  function matchHtml(m){
    if(!m) return `
      <div class="bracket-match">
        <div class="bracket-team tbd"><span class="flag">—</span> TBD</div>
        <div class="bracket-team tbd"><span class="flag">—</span> TBD</div>
      </div>`;
    const w1 = m.winner === m.team1;
    const w2 = m.winner === m.team2;
    return `
      <div class="bracket-match">
        <div class="bracket-team ${w1?'winner':''} ${!m.team1?'tbd':''}">
          <span class="flag">${m.team1?flag(m.team1):'—'}</span>
          ${m.team1||'TBD'}
          ${m.score1!=null?`<span class="bracket-score">${m.score1}</span>`:''}
        </div>
        <div class="bracket-team ${w2?'winner':''} ${!m.team2?'tbd':''}">
          <span class="flag">${m.team2?flag(m.team2):'—'}</span>
          ${m.team2||'TBD'}
          ${m.score2!=null?`<span class="bracket-score">${m.score2}</span>`:''}
        </div>
      </div>`;
  }

  const qf1 = matchHtml(getMatch('QF',1));
  const qf2 = matchHtml(getMatch('QF',2));
  const qf3 = matchHtml(getMatch('QF',3));
  const qf4 = matchHtml(getMatch('QF',4));
  const sf1 = matchHtml(getMatch('SF',1));
  const sf2 = matchHtml(getMatch('SF',2));
  const fin = matchHtml(getMatch('F',1));

  document.getElementById('bracket-grid').innerHTML = `
    <!-- Cuartos izq -->
    <div class="bracket-round">
      <div class="round-label">Quarterfinals</div>
      <div class="match-group">${qf1}</div>
      <div class="match-group">${qf2}</div>
    </div>

    <!-- Conector QF→SF izq -->
    <div class="bracket-connector">
      <svg width="28" height="220" viewBox="0 0 28 220" fill="none">
        <path d="M0 55 H14 V165 H0" stroke="var(--border-m)" stroke-width="2" fill="none"/>
        <path d="M14 110 H28" stroke="var(--border-m)" stroke-width="2"/>
      </svg>
    </div>

    <!-- Semis izq -->
    <div class="bracket-round">
      <div class="round-label">Semifinals</div>
      <div class="match-group" style="margin-top:60px">${sf1}</div>
    </div>

    <!-- Conector SF→Final izq -->
    <div class="bracket-connector">
      <svg width="28" height="100" viewBox="0 0 28 100" fill="none">
        <path d="M0 50 H28" stroke="var(--border-m)" stroke-width="2"/>
      </svg>
    </div>

    <!-- FINAL central -->
    <div class="bracket-final">
      <div class="final-label">Final</div>
      <div class="final-trophy">🏆</div>
      <div class="final-match" style="margin-top:10px">${fin}</div>
    </div>

    <!-- Conector Final→SF der -->
    <div class="bracket-connector">
      <svg width="28" height="100" viewBox="0 0 28 100" fill="none">
        <path d="M28 50 H0" stroke="var(--border-m)" stroke-width="2"/>
      </svg>
    </div>

    <!-- Semis der -->
    <div class="bracket-round">
      <div class="round-label">Semifinals</div>
      <div class="match-group" style="margin-top:60px">${sf2}</div>
    </div>

    <!-- Conector SF→QF der -->
    <div class="bracket-connector">
      <svg width="28" height="220" viewBox="0 0 28 220" fill="none">
        <path d="M28 55 H14 V165 H28" stroke="var(--border-m)" stroke-width="2" fill="none"/>
        <path d="M14 110 H0" stroke="var(--border-m)" stroke-width="2"/>
      </svg>
    </div>

    <!-- Cuartos der -->
    <div class="bracket-round">
      <div class="round-label">Quarterfinals</div>
      <div class="match-group">${qf3}</div>
      <div class="match-group">${qf4}</div>
    </div>
  `;
}

/* ─── TABS ────────────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
  });
});

/* ─── REALTIME ────────────────────────────────────────────── */
function setupRealtime(){
  db.channel('mundial-rt')
    .on('postgres_changes',{event:'*',schema:'public',table:'predictions'}, fetchAllSafe)
    .on('postgres_changes',{event:'*',schema:'public',table:'teams'},        fetchAllSafe)
    .subscribe();
}

/* ─── INIT ────────────────────────────────────────────────── */
fetchAllSafe();
setupRealtime();