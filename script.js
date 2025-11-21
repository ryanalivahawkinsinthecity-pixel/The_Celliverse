/* Celliverse Mission Levels
   - 10 organelle mini-games (simple, classroom-friendly)
   - Mission Hub tracks progress and score
   - Two final simulations (Plant & Animal)
   - Put these 3 files in GitHub as index.html, style.css, script.js
*/

/* -----------------------
   Data & initial setup
   ----------------------- */
const MISSIONS = [
  { id: 'nucleus',      title: 'Nucleus — DNA Assembly', hint: 'Put the DNA fragments back in order.' },
  { id: 'mitochondria', title: 'Mitochondria — ATP Generator', hint: 'Generate ATP energy by clicking energy beads.' },
  { id: 'ribosomes',    title: 'Ribosomes — Protein Builder', hint: 'Match codons to amino acids.' },
  { id: 'er',           title: 'Endoplasmic Reticulum — Conveyor', hint: 'Route proteins along the ER without errors.' },
  { id: 'golgi',        title: 'Golgi — Packaging Relay', hint: 'Sort packages to the right destinations.' },
  { id: 'vacuole',      title: 'Vacuole — Storage Balance', hint: 'Maintain water & ion balance.' },
  { id: 'membrane',     title: 'Cell Membrane — Selective Gate', hint: 'Accept needed molecules and reject toxins.' },
  { id: 'cytoplasm',    title: 'Cytoplasm — Diffusion', hint: 'Evenly distribute molecules.' },
  { id: 'cell-wall',    title: 'Cell Wall — Structural Strength', hint: 'Reinforce wall to withstand pressure.' },
  { id: 'chloroplast',  title: 'Chloroplast — Photon Catch', hint: 'Catch photons to power the cell.' },
];

const app = document.getElementById('app');
const menuButtons = document.querySelectorAll('.menu button');
const statusEl = document.getElementById('status');

// store progress in localStorage (teacher-friendly)
const STORE_KEY = 'celliverse_progress_v1';
let progress = loadProgress(); // { missionScores: {id:score}, completed: {...}, totalScore: N }

function loadProgress(){
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return { missionScores: {}, completed: {}, totalScore: 0 };
    return JSON.parse(raw);
  } catch(e){
    return { missionScores: {}, completed: {}, totalScore: 0 };
  }
}
function saveProgress(){ localStorage.setItem(STORE_KEY, JSON.stringify(progress)); updateStatus(); }

/* initial UI wiring */
menuButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    menuButtons.forEach(b=>b.classList.toggle('active', b===btn));
    routeTo(btn.dataset.route);
  });
});

// entry route
routeTo('hub');

/* -----------------------
   Routing & Pages
   ----------------------- */
function routeTo(route){
  if(route==='hub') renderHub();
  if(route==='missions') renderMissionsList();
  if(route==='simulations') renderSimulations();
  if(route==='resources') renderResources();
}

/* Hub: shows progress and quick mission access */
function renderHub(){
  const scores = Object.keys(progress.missionScores).length;
  const max = MISSIONS.length;
  app.innerHTML = `
    <section class="panel">
      <h1>Mission Hub</h1>
      <p class="small">Welcome, Cell Technician. Complete missions to unlock the final simulations. Each mission gives a score (0–100).</p>
      <div class="hub-grid" style="margin-top:12px">
        <div>
          <div class="panel">
            <h3>Your Progress</h3>
            <p class="small">Missions completed: <strong>${scores}/${max}</strong></p>
            <p class="small">Total Score: <strong>${progress.totalScore || 0}</strong></p>
            <div style="margin-top:10px">
              <button class="btn" onclick="routeTo('missions')">Go to Missions</button>
              <button class="btn-ghost" onclick="resetProgress()">Reset Progress</button>
            </div>
          </div>

          <div class="panel" style="margin-top:12px">
            <h3>Quick Access</h3>
            <div class="missions-list">
              ${MISSIONS.map(m => {
                const s = progress.missionScores[m.id];
                return `<div class="mission-card">
                  <div class="left"><div class="mission-icon">${m.title.split(' ')[0].charAt(0)}</div>
                    <div class="mission-meta"><strong>${m.title}</strong><span class="small">${m.hint}</span></div></div>
                  <div>
                    ${s ? `<div class="small">Score: <strong>${s}</strong></div>` : `<button class="btn" onclick="startMission('${m.id}')">Start</button>`}
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        <aside class="panel">
          <h3>Teacher / Player Notes</h3>
          <ul class="small">
            <li>Each mission is short (30–90 seconds) and test core organelle function.</li>
            <li>Final simulations use mission scores to weight outcomes for plant vs animal cells.</li>
            <li>Export progress by copying localStorage or using browser DevTools → Application → Local Storage.</li>
          </ul>
          <div style="margin-top:12px">
            <button class="btn" onclick="exportProgress()">Export Progress</button>
          </div>
        </aside>
      </div>
    </section>
  `;
  updateStatus();
}

/* Missions List page */
function renderMissionsList(){
  app.innerHTML = `
    <section class="panel">
      <h1>Missions</h1>
      <p class="small">Pick a mission to play. Complete all to unlock the final simulations.</p>
      <div class="missions-list" style="margin-top:12px">
        ${MISSIONS.map(m => {
          const s = progress.missionScores[m.id] || '';
          return `<div class="mission-card">
            <div class="left"><div class="mission-icon">${m.title.split(' ')[0].charAt(0)}</div>
              <div class="mission-meta"><strong>${m.title}</strong><span class="small">${m.hint}</span></div></div>
            <div>
              <div class="small">Score: <strong>${s}</strong></div>
              <div style="margin-top:6px"><button class="btn" onclick="startMission('${m.id}')">Start</button></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </section>
  `;
}

/* Simulations page (Plant vs Animal) */
function renderSimulations(){
  // require enough missions completed? we'll allow access but outcomes depend on scores
  app.innerHTML = `
    <section class="panel">
      <h1>Final Simulations</h1>
      <p class="small">Use your mission performance to run the full Plant (Venus Flytrap) and Animal (Arctic Fox) simulations.</p>
      <div class="sim-grid" style="margin-top:12px">
        <div class="panel">
          <h3>Plant Cell — Venus Flytrap</h3>
          <p class="small">The simulation uses your Chloroplast, Vacuole, Cell Wall, and other mission scores to grow a trap and capture prey.</p>
          <div id="plantSimArea"></div>
          <div style="margin-top:10px"><button class="btn" onclick="runPlantSim()">Run Plant Simulation</button></div>
        </div>
        <div class="panel">
          <h3>Animal Cell — Arctic Fox</h3>
          <p class="small">This sim uses your Mitochondria, Membrane, Vacuole, and Cytoplasm mission scores to maintain heat, energy, and hydration.</p>
          <div id="animalSimArea"></div>
          <div style="margin-top:10px"><button class="btn" onclick="runAnimalSim()">Run Animal Simulation</button></div>
        </div>
      </div>
      <div style="margin-top:12px" class="panel">
        <h4>Simulation Notes</h4>
        <p class="small">Higher mission scores weigh the simulation towards success. Use the missions to improve outcomes.</p>
      </div>
    </section>
  `;
}

/* Resources page */
function renderResources(){
  app.innerHTML = `
    <section class="panel">
      <h1>Resources</h1>
      <p class="small">Teaching guide, printable diagrams, and mission rubrics to help grade student projects.</p>
      <ul class="small">
        <li>Printable organelle sheet (teacher supplies images)</li>
        <li>Rubric: Content Accuracy (25), Understanding (25), Design (20), Presentation (15), Effort (15)</li>
        <li>Tip: Encourage students to replay missions to improve scores.</li>
      </ul>
    </section>
  `;
}

/* -----------------------
   Mission launcher
   ----------------------- */
function startMission(missionId){
  const mission = MISSIONS.find(m=>m.id===missionId);
  if(!mission) return;
  // dispatch to mission-specific renderer
  if(missionId==='nucleus') renderNucleusMission(mission);
  if(missionId==='mitochondria') renderMitochondriaMission(mission);
  if(missionId==='ribosomes') renderRibosomesMission(mission);
  if(missionId==='er') renderERMission(mission);
  if(missionId==='golgi') renderGolgiMission(mission);
  if(missionId==='vacuole') renderVacuoleMission(mission);
  if(missionId==='membrane') renderMembraneMission(mission);
  if(missionId==='cytoplasm') renderCytoplasmMission(mission);
  if(missionId==='cell-wall') renderCellWallMission(mission);
  if(missionId==='chloroplast') renderChloroplastMission(mission);
}

/* utility: finish a mission and save score */
function finishMission(id, score){
  // score is 0-100
  progress.missionScores[id] = Math.max(0, Math.min(100, Math.round(score)));
  progress.completed[id] = true;
  // recompute totalScore as average of completed missions (scaled to 100)
  const scores = Object.values(progress.missionScores);
  progress.totalScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
  saveProgress();
  // return to hub automatically
  routeTo('hub');
}

/* -----------------------
   Individual mission implementations
   Each mission returns a simple short game with scoring
   ----------------------- */

/* 1) Nucleus — DNA Assembly (jigsaw style) */
function renderNucleusMission(m){
  app.innerHTML = `
    <section class="panel mission-area">
      <h2>${m.title}</h2>
      <p class="small">${m.hint}</p>
      <div style="display:flex; gap:12px; margin-top:12px; align-items:flex-start;">
        <div style="flex:1">
          <div id="dnaCanvas" class="panel" style="min-height:220px; display:flex; gap:6px; flex-wrap:wrap; align-content:flex-start"></div>
        </div>
        <aside style="width:240px">
          <div class="panel">
            <h4>Shuffled Fragments</h4>
            <div id="dnaPool" class="pool"></div>
            <div style="margin-top:10px">
              <button class="btn" id="checkDNA">Check</button>
              <button class="btn-ghost" onclick="routeTo('missions')">Exit</button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;
  // DNA sequence: simple letters A,T,C,G groups
  const correct = ['ATG','GCC','TAA','CGA','TTC','GGA']; // example fragments in correct order
  const shuffled = shuffle([...correct]);
  const dnaCanvas = document.getElementById('dnaCanvas');
  const dnaPool = document.getElementById('dnaPool');

  // fill pool draggable
  shuffled.forEach((frag, i) => {
    const el = document.createElement('div');
    el.textContent = frag;
    el.className = 'pool-item';
    el.draggable = true;
    el.dataset.frag = frag;
    el.addEventListener('dragstart', (e)=> e.dataTransfer.setData('text/plain', frag));
    dnaPool.appendChild(el);
  });

  // canvas accepts drops and appends fragments in order
  dnaCanvas.addEventListener('dragover', e=> e.preventDefault());
  dnaCanvas.addEventListener('drop', e=>{
    e.preventDefault();
    const frag = e.dataTransfer.getData('text/plain');
    if(!frag) return;
    // allow remove by clicking
    const chip = document.createElement('div');
    chip.textContent = frag;
    chip.className = 'pool-item';
    chip.style.display='inline-block';
    chip.style.margin='4px';
    chip.style.cursor='pointer';
    chip.addEventListener('click', ()=> chip.remove());
    dnaCanvas.appendChild(chip);
  });

  document.getElementById('checkDNA').onclick = ()=>{
    const placed = Array.from(dnaCanvas.querySelectorAll('.pool-item')).map(n=>n.textContent);
    // compare to correct order (allow partial credit)
    let matches = 0;
    for(let i=0;i<Math.min(placed.length, correct.length); i++){
      if(placed[i] === correct[i]) matches++;
    }
    const baseScore = Math.round((matches / correct.length) * 100);
    // penalty for extra/missing fragments
    const penalty = Math.max(0, Math.abs(placed.length - correct.length)) * 5;
    const final = Math.max(0, baseScore - penalty);
    finishMission('nucleus', final);
    alert(`Nucleus mission complete — score: ${final}`);
  };
}

/* 2) Mitochondria — ATP Generator (click/tap energy beads) */
function renderMitochondriaMission(m){
  app.innerHTML = `
    <section class="panel mission-area">
      <h2>${m.title}</h2>
      <p class="small">${m.hint}</p>
      <div style="display:flex; gap:12px; align-items:center; margin-top:12px">
        <div style="flex:1">
          <div id="mitoMeter" class="panel" style="height:180px; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:700">ATP: 0</div>
          <div style="margin-top:10px" class="small">Click the glowing substrate beads to create ATP. Generate at least 50 ATP for a perfect score.</div>
        </div>
        <aside style="width:260px" class="panel">
          <div id="beadPool"></div>
          <div style="margin-top:10px">
            <button class="btn" id="startMito">Start</button>
            <button class="btn-ghost" onclick="routeTo('missions')">Exit</button>
          </div>
        </aside>
      </div>
    </section>
  `;
  const meter = document.getElementById('mitoMeter');
  const pool = document.getElementById('beadPool');
  let atp = 0, running=false, intervalId=null, timeLeft=20;

  function spawnBead(){
    const b = document.createElement('div');
    b.textContent = '⚪';
    b.style.display='inline-block';
    b.style.padding='8px';
    b.style.margin='6px';
    b.style.cursor='pointer';
    b.addEventListener('click', ()=>{
      atp += 1 + Math.floor(Math.random()*2); // 1-3 ATP per click
      meter.textContent = `ATP: ${atp}`;
      b.remove();
    });
    pool.appendChild(b);
    // auto remove bead after 3-4s
    setTimeout(()=> b.remove(), 3500 + Math.random()*1000);
  }

  document.getElementById('startMito').onclick = ()=>{
    if(running) return;
    running=true;
    atp=0;
    meter.textContent = `ATP: ${atp}`;
    pool.innerHTML='';
    timeLeft = 20; // seconds
    intervalId = setInterval(()=>{
      if(timeLeft<=0){
        clearInterval(intervalId);
        running=false;
        // compute score: target 50 ATP -> 100 pts
        const final = Math.min(100, Math.round((atp/50)*100));
        finishMission('mitochondria', final);
        alert(`Mitochondria mission complete — ATP ${atp}, score: ${final}`);
        return;
      }
      // spawn 1-3 beads each second
      const n = 1 + Math.floor(Math.random()*3);
      for(let i=0;i<n;i++) spawnBead();
      timeLeft--;
    }, 1000);
  };
}

/* 3) Ribosomes — match codons to amino acids */
function renderRibosomesMission(m){
  app.innerHTML = `
    <section class="panel mission-area">
      <h2>${m.title}</h2>
      <p class="small">${m.hint}</p>
      <div style="display:flex; gap:12px; margin-top:12px">
        <div style="flex:1">
          <div class="panel" id="codonStrip" style="min-height:160px; display:flex; gap:8px; align-items:center; justify-content:flex-start; flex-wrap:wrap"></div>
        </div>
        <aside style="width:260px" class="panel">
          <h4>Options</h4>
          <div id="aminoPool" class="pool"></div>
          <div style="margin-top:10px">
            <button class="btn" id="checkRibo">Check</button>
            <button class="btn-ghost" onclick="routeTo('missions')">Exit</button>
          </div>
        </aside>
      </div>
    </section>
  `;
  // simple codon -> amino mapping
  const mapping = { 'AUG':'Met', 'GCU':'Ala', 'UUU':'Phe', 'GGA':'Gly', 'UAA':'Stop' };
  const codons = Object.keys(mapping);
  // generate target sequence of 4 codons
  const target = [codons[0], codons[1], codons[2], codons[3]]; // AUG, GCU, UUU, GGA
  // show codon slots
  const codonStrip = document.getElementById('codonStrip');
  target.forEach((c, i)=>{
    const slot = document.createElement('div');
    slot.className='pool-item';
    slot.style.minWidth='90px';
    slot.style.cursor='pointer';
    slot.dataset.index=i;
    slot.textContent = '---';
    slot.dataset.codon = '';
    slot.addEventListener('click', ()=> {
      // cycle through amino choices if clicked
      const current = slot.dataset.codon;
      const options = [...new Set(Object.values(mapping))];
      let nextIndex = 0;
      if(current){
        nextIndex = (options.indexOf(current)+1) % options.length;
      }
      slot.dataset.codon = options[nextIndex];
      slot.textContent = options[nextIndex];
    });
    codonStrip.appendChild(slot);
  });
  // pool shows amino acids to choose (click to assign to selected slot)
  const pool = document.getElementById('aminoPool');
  const aminoOptions = [...new Set(Object.values(mapping))];
  aminoOptions.forEach(a=>{
    const el = document.createElement('div');
    el.className='pool-item';
    el.textContent = a;
    el.addEventListener('click', ()=> {
      // find first empty slot or replace last clicked (simple logic)
      const empty = Array.from(codonStrip.children).find(n=>!n.dataset.codon);
      if(empty){
        empty.dataset.codon = a;
        empty.textContent = a;
      } else {
        // rotate: replace first
        const first = codonStrip.children[0];
        first.dataset.codon = a;
        first.textContent = a;
      }
    });
    pool.appendChild(el);
  });

  document.getElementById('checkRibo').onclick = ()=>{
    // map back the chosen amino sequences to codons by matching mapping values
    const chosenAmino = Array.from(codonStrip.children).map(n=>n.dataset.codon || '');
    let correct = 0;
    for(let i=0;i<chosenAmino.length; i++){
      const codon = target[i];
      if(mapping[codon] === chosenAmino[i]) correct++;
    }
    const final = Math.round((correct / target.length) * 100);
    finishMission('ribosomes', final);
    alert(`Ribosomes mission complete — matched ${correct}/${target.length}, score: ${final}`);
  };
}
/* 4) Endoplasmic Reticulum — Drag-the-Protein Maze */
function renderERMission(m){
  app.innerHTML = `
    <section class="panel mission-area">
      <h2>${m.title}</h2>
      <p class="small">${m.hint}</p>
      <div id="erGame" 
           style="position:relative; width:100%; height:300px; background:var(--panel); overflow:hidden; border:2px solid var(--accent); border-radius:8px;">
      </div>

      <div style="margin-top:12px; display:flex; gap:12px">
        <button class="btn" id="erStart">Start ER Mission</button>
        <button class="btn-ghost" onclick="routeTo('missions')">Exit</button>
      </div>

      <p class="small" style="margin-top:6px">Drag all proteins through the shifting ER channels. Avoid touching any wall for 8 seconds.</p>
    </section>
  `;

  const game = document.getElementById("erGame");
  let proteins = [];
  let walls = [];
  let running = false;
  let timer = 8;
  let timerInterval;

  // Create proteins
  function spawnProteins(){
    for(let i=0;i<3;i++){
      const p = document.createElement("div");
      p.className = "er-protein";
      p.style.position = "absolute";
      p.style.width = "26px";
      p.style.height = "26px";
      p.style.borderRadius = "50%";
      p.style.background = "var(--accent)";
      p.style.left = "20px";
      p.style.top = (40 + i*60) + "px";
      p.style.cursor = "grab";
      game.appendChild(p);

      makeDraggable(p);
      proteins.push(p);
    }
  }

  // Create ER walls (scrolling)
  function spawnWalls(){
    for(let i=0;i<5;i++){
      const w = document.createElement("div");
      w.className = "er-wall";
      w.style.position = "absolute";
      w.style.width = "100%";
      w.style.height = "40px";
      w.style.background = "rgba(0,0,0,0.5)";
      w.style.top = (i*60)+"px";
      w.style.left = (Math.random()*-100)+"px";
      w.speed = 1 + Math.random()*1.5;
      game.appendChild(w);
      walls.push(w);
    }
  }

  // Drag function
  function makeDraggable(el){
    let isDragging = false, offsetX=0, offsetY=0;

    el.addEventListener("pointerdown",(e)=>{
      isDragging=true;
      el.setPointerCapture(e.pointerId);
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
      el.style.cursor="grabbing";
    });

    el.addEventListener("pointermove",(e)=>{
      if(!isDragging) return;
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      el.style.left = x+"px";
      el.style.top = y+"px";
    });

    el.addEventListener("pointerup",(e)=>{
      isDragging=false;
      el.style.cursor="grab";
    });
  }

  function startGame(){
    if(running) return;
    running = true;

    game.innerHTML="";
    proteins=[];
    walls=[];
    timer = 8;

    spawnProteins();
    spawnWalls();

    timerInterval = setInterval(()=>{
      timer--;
      if(timer <= 0){
        clearInterval(timerInterval);
        finish(true);
      }
    },1000);

    requestAnimationFrame(loop);
  }

  function loop(){
    if(!running) return;

    // move walls
    walls.forEach(w=>{
      w.style.left = (parseFloat(w.style.left) + w.speed) + "px";
      if(parseFloat(w.style.left) > 400){
        w.style.left = (Math.random()*-200)+"px";
      }
    });

    // collision detection
    for(const p of proteins){
      const pr = p.getBoundingClientRect();
      for(const w of walls){
        const wr = w.getBoundingClientRect();
        if(!(pr.right < wr.left || pr.left > wr.right || pr.bottom < wr.top || pr.top > wr.bottom)){
          finish(false);
          return;
        }
      }
    }

    requestAnimationFrame(loop);
  }

  function finish(win){
    running=false;
    clearInterval(timerInterval);
    finishMission("er", win ? 100 : 0);
    alert(win ? "ER Mission Success! (Protein delivered)" : "ER Mission Failed (Protein hit wall)");
  }

  document.getElementById("erStart").onclick = startGame;
}
/* 5) Golgi — sort packages into destinations (drag-drop) */
function renderGolgiMission(m){
  app.innerHTML = `
    <section class="panel mission-area">
      <h2>${m.title}</h2>
      <p class="small">${m.hint}</p>
      <div style="display:flex; gap:12px; margin-top:12px">
        <div style="flex:1">
          <div style="display:flex; gap:8px; align-items:flex-start">
            <div class="panel" style="width:220px">
              <h4>Packages</h4>
              <div id="packages" class="pool"></div>
            </div>
            <div class="panel" style="flex:1">
              <h4>Destinations</h4>
              <div style="display:flex; gap:8px;">
                <div id="destA" class="cell-canvas" data-type="A">Membrane</div>
                <div id="destB" class="cell-canvas" data-type="B">Lysosome</div>
                <div id="destC" class="cell-canvas" data-type="C">Secretion</div>
              </div>
            </div>
          </div>
        </div>
        <aside style="width:220px" class="panel">
          <h4>Goal</h4>
          <p class="small">Drag each package to the correct destination. Packages are labeled by tag (A/B/C).</p>
          <div style="margin-top:12px"><button class="btn" id="checkGolgi">Check</button></div>
        </aside>
      </div>
    </section>
  `;
  const pk = document.getElementById('packages');
  const types = ['A','B','C'];
  // create 6 packages random types
  const packages = Array.from({length:6}, (_,i)=> types[Math.floor(Math.random()*types.length)]);
  packages.forEach((t,i)=>{
    const el = document.createElement('div');
    el.className='pool-item';
    el.draggable = true;
    el.dataset.type = t;
    el.textContent = `Pkg ${i+1} (${t})`;
    el.addEventListener('dragstart', e=> e.dataTransfer.setData('text/plain', JSON.stringify({type:t, name:el.textContent})));
    pk.appendChild(el);
  });
  // destinations accept drop and append labels
  ['destA','destB','destC'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('dragover', e=> e.preventDefault());
    el.addEventListener('drop', e=>{
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const label = document.createElement('div');
      label.className='pool-item';
      label.textContent = data.name;
      el.appendChild(label);
    });
  });

  document.getElementById('checkGolgi').onclick = ()=>{
    const dests = {A:document.getElementById('destA'), B:document.getElementById('destB'), C:document.getElementById('destC')};
    let correct=0, total=0;
    ['A','B','C'].forEach(t=>{
      const childLabels = Array.from(dests[t].querySelectorAll('.pool-item'));
      childLabels.forEach(lbl=>{
        total++;
        if(lbl.textContent.includes(`(${t})`)) correct++;
      });
    });
    // packages in wrong places reduce score, missing reduce more
    const final = Math.round((correct / (packages.length || 1)) * 100);
    finishMission('golgi', final);
    alert(`Golgi mission complete — correct: ${correct}/${packages.length}, score: ${final}`);
  };
}

/* 6) Vacuole — storage balance slider */
function renderVacuoleMission(m){
  app.innerHTML = `
    <section class="panel mission-area">
      <h2>${m.title}</h2>
      <p class="small">${m.hint}</p>

      <div style="display:flex; gap:12px; margin-top:12px">
        <div style="flex:1">
          <div class="panel">
            <h4>Vacuole Volume</h4>
            <input id="vacuoleRange" type="range" min="0" max="100" value="50" style="width:100%">
            <div class="small" style="margin-top:8px">Adjust to keep turgor pressure stable under changing environment.</div>
            <div style="margin-top:8px" class="small">Environmental dryness slider: <span id="dryness">50</span></div>
            <input id="envRange" type="range" min="0" max="100" value="50" style="width:100%;">
            <div style="margin-top:10px"><button class="btn" id="checkVacuole">Submit</button></div>
          </div>
        </div>
      </div>
    </section>
  `;
  const vacRange = document.getElementById('vacuoleRange');
  const envRange = document.getElementById('envRange');
  const dryness = document.getElementById('dryness');
  envRange.oninput = ()=> dryness.textContent = envRange.value;
  document.getElementById('checkVacuole').onclick = ()=>{
    // ideal vacuole roughly matches environment inversely: when dryness high, vacuole value should be high
    const env = Number(envRange.value);
    const vac = Number(vacRange.value);
    const ideal = Math.min(100, Math.round(env * 1.1)); // simple model
    const diff = Math.abs(ideal - vac);
    const final = Math.max(0, 100 - Math.round((diff / 100) * 100)); // penalty
    finishMission('vacuole', final);
    alert(`Vacuole mission scored ${final} (ideal ${ideal}, your ${vac})`);
  };
}

/* 7) Membrane — accept/reject molecules */
function renderMembraneMission(m){
  app.innerHTML = `
    <section class="panel mission-area">
      <h2>${m.title}</h2>
      <p class="small">${m.hint}</p>
      <div style="display:flex; gap:12px; margin-top:12px">
        <div style="flex:1">
          <div class="panel">
            <h4>Molecules arriving</h4>
            <div id="moleculeStream" style="min-height:160px; display:flex; flex-wrap:wrap; gap:8px; align-items:center"></div>
            <div style="margin-top:8px" class="small">Click Accept to let through good molecules, or Reject to block toxins.</div>
          </div>
        </div>
        <aside style="width:260px" class="panel">
          <h4>Controls</h4>
          <button class="btn" id="startMembrane">Start</button>
          <button class="btn-ghost" onclick="routeTo('missions')">Exit</button>
        </aside>
      </div>
    </section>
  `;
  const stream = document.getElementById('moleculeStream');
  let running=false, intervalId=null;
  const molecules = [
    {name:'Glucose', good:true},
    {name:'Na+', good:true},
    {name:'Pathogen', good:false},
    {name:'HeavyMetal', good:false},
    {name:'Oxygen', good:true},
    {name:'Toxin', good:false}
  ];
  let correct=0, total=0;

  function spawnMol(){
    const mol = molecules[Math.floor(Math.random()*molecules.length)];
    const el = document.createElement('div');
    el.className='pool-item';
    el.textContent = mol.name;
    el.dataset.good = mol.good ? '1':'0';
    const acceptBtn = document.createElement('button'); acceptBtn.textContent='Accept'; acceptBtn.className='btn'; acceptBtn.style.marginLeft='8px';
    const rejectBtn = document.createElement('button'); rejectBtn.textContent='Reject'; rejectBtn.className='btn-ghost';
    el.appendChild(acceptBtn); el.appendChild(rejectBtn);
    // attach actions
    acceptBtn.addEventListener('click', ()=>{
      total++;
      if(el.dataset.good==='1') correct++; // good accepted
      el.remove();
    });
    rejectBtn.addEventListener('click', ()=>{
      total++;
      if(el.dataset.good==='0') correct++; // toxin rejected
      el.remove();
    });
    stream.appendChild(el);
    setTimeout(()=> el.remove(), 5000);
  }

  document.getElementById('startMembrane').onclick = ()=>{
    if(running) return;
    running=true; correct=0; total=0; stream.innerHTML='';
    let timeLeft=18;
    intervalId = setInterval(()=>{
      if(timeLeft<=0){ clearInterval(intervalId); running=false; const final = Math.round((correct/(total||1))*100); finishMission('membrane', final); alert(`Membrane mission score: ${final}`); return; }
      // spawn 1-2 molecules
      spawnMol();
      if(Math.random()>0.6) spawnMol();
      // cleanup old items occasionally
      timeLeft--;
    }, 1000);
  };
}

/* 8) Cytoplasm — diffusion (even distribution) */
function renderCytoplasmMission(m){
  app.innerHTML = `
    <section class="panel mission-area">
      <h2>${m.title}</h2>
      <p class="small">${m.hint}</p>
      <div style="margin-top:12px">
        <div id="cytoGrid" class="panel" style="display:grid; grid-template-columns:repeat(8,1fr); gap:6px; padding:8px; min-height:220px"></div>
        <div style="margin-top:8px" class="small">Click a cell to add molecule. Goal: evenly spread molecules across the grid using simple diffusion steps.</div>
        <div style="margin-top:8px"><button class="btn" id="diffuse">Diffuse Step</button><button class="btn-ghost" onclick="routeTo('missions')">Exit</button></div>
      </div>
    </section>
  `;
  const grid = document.getElementById('cytoGrid');
  const size=8*3; // 8 columns x 3 rows
  for(let i=0;i<size;i++){
    const c = document.createElement('div');
    c.className='pool-item';
    c.style.height='40px';
    c.textContent='0';
    c.dataset.count = '0';
    c.addEventListener('click', ()=> {
      c.dataset.count = String(Number(c.dataset.count)+1);
      c.textContent = c.dataset.count;
    });
    grid.appendChild(c);
  }
  document.getElementById('diffuse').onclick = ()=>{
    // simple diffusion: each cell gives half of its molecules rounded down to random neighbor(s)
    const cells = Array.from(grid.children);
    const counts = cells.map(c=>Number(c.dataset.count));
    const newCounts = new Array(counts.length).fill(0);
    for(let i=0;i<counts.length;i++){
      const amount = counts[i];
      const stay = Math.floor(amount/2);
      const give = amount - stay;
      newCounts[i] += stay;
      // distribute give across up to 2 neighbors: left/right if exist
      const neighbors = [];
      if(i % 8 !== 0) neighbors.push(i-1);
      if((i % 8) !== 7) neighbors.push(i+1);
      if(neighbors.length === 0) { newCounts[i]+=give; continue; }
      // split give among neighbors
      for(let k=0;k<give;k++){
        const idx = neighbors[Math.floor(Math.random()*neighbors.length)];
        newCounts[idx] += 1;
      }
    }
    // write back
    cells.forEach((c,i)=>{ c.dataset.count = String(newCounts[i]); c.textContent = c.dataset.count; });
    // check evenness score (lower stdev is better)
    const vals = newCounts;
    const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
    const variance = vals.reduce((a,b)=>a+(b-avg)*(b-avg),0)/vals.length;
    const stdev = Math.sqrt(variance);
    // map stdev to score (0 stdev => 100, big stdev => lower)
    const score = Math.max(0, Math.round(100 - stdev*20));
    // allow finish when average molecules >=1 (i.e., user seeded)
    const totalMoles = vals.reduce((a,b)=>a+b,0);
    if(totalMoles > 0 && stdev < 1.5){
      finishMission('cytoplasm', score);
      alert(`Cytoplasm mission complete — score: ${score}`);
    } else if(totalMoles > 30){
      // if too many but uneven, still finish with lower score
      finishMission('cytoplasm', score);
      alert(`Cytoplasm mission auto-complete — score: ${score}`);
    } else {
      // allow more diffusion steps
      alert(`Diffusion step applied. Current spread stdev: ${stdev.toFixed(2)}. Keep diffusing or seed more molecules.`);
    }
  };
}

/* 9) Cell Wall — structural strength quick game */
function renderCellWallMission(m){
  app.innerHTML = `
    <section class="panel mission-area">
      <h2>${m.title}</h2>
      <p class="small">${m.hint}</p>
      <div style="margin-top:12px; display:flex; gap:12px">
        <div style="flex:1">
          <div class="panel">
            <h4>Reinforce Wall</h4>
            <div style="display:flex; gap:8px; margin-bottom:8px">
              <button class="btn" onclick="addRebar()">Add Fiber</button>
              <button class="btn" onclick="addCrosslink()">Add Crosslink</button>
              <button class="btn-ghost" onclick="routeTo('missions')">Exit</button>
            </div>
            <div id="wallStatus" class="small">Strength: 0</div>
            <div style="height:140px; margin-top:8px; border-radius:8px; border:1px solid rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center;">
              <div id="wallVisual" style="width:80%; height:60%; background:linear-gradient(90deg, rgba(154,123,255,0.06), rgba(75,227,200,0.03));"></div>
            </div>
          </div>
        </div>
        <aside style="width:260px" class="panel">
          <h4>Force Test</h4>
          <div style="margin-top:8px"><button class="btn" id="testWall">Apply Pressure</button></div>
          <div class="small" style="margin-top:8px">If strength exceeds pressure threshold, wall holds.</div>
        </aside>
      </div>
    </section>
  `;
  let strength = 0;
  const status = document.getElementById('wallStatus');
  const visual = document.getElementById('wallVisual');

  window.addRebar = function(){ strength += 8; updateWall(); };
  window.addCrosslink = function(){ strength += 12; updateWall(); };
  function updateWall(){ status.textContent = `Strength: ${strength}`; visual.style.transform = `scaleX(${0.6 + (strength/200)})`; }

  document.getElementById('testWall').onclick = ()=>{
    const pressure = 30 + Math.floor(Math.random()*80); // 30-110
    const success = strength >= pressure;
    const score = success ? 100 : Math.max(0, Math.round((strength/pressure)*100));
    finishMission('cell-wall', score);
    alert(`Applied pressure: ${pressure}. Wall strength: ${strength}. ${success ? 'Wall held!' : 'Wall failed.'} Score: ${score}`);
  };
}

/* 10) Chloroplast — photon catch (click falling photons) */
function renderChloroplastMission(m){
  app.innerHTML = `
    <section class="panel mission-area">
      <h2>${m.title}</h2>
      <p class="small">${m.hint}</p>
      <div style="display:flex; gap:12px; margin-top:12px">
        <div style="flex:1">
          <div id="photoField" class="panel" style="min-height:240px; position:relative; overflow:hidden;"></div>
          <div style="margin-top:8px" class="small">Catch photons (click them) to build energy for photosynthesis. Target: 40 photons.</div>
        </div>
        <aside style="width:240px" class="panel">
          <h4>Controls</h4>
          <button class="btn" id="startChl">Start</button>
          <button class="btn-ghost" onclick="routeTo('missions')">Exit</button>
          <div style="margin-top:10px" class="small">Photons appear and drift downward. Click them to collect.</div>
        </aside>
      </div>
    </section>
  `;
  const field = document.getElementById('photoField');
  let running=false, collected=0, timer=null;

  function spawnPhoton(){
    const p = document.createElement('div');
    p.textContent = '☀️';
    p.style.position='absolute';
    p.style.left = Math.random()*80 + '%';
    p.style.top = '-10%';
    p.style.fontSize = '22px';
    p.style.cursor = 'pointer';
    field.appendChild(p);
    // animate down
    let top = -10;
    const id = setInterval(()=>{
      top += 1 + Math.random()*2;
      p.style.top = top + '%';
      if(top > 110){ clearInterval(id); p.remove(); }
    }, 80);
    p.addEventListener('click', ()=>{
      collected++;
      p.remove();
    });
  }

  document.getElementById('startChl').onclick = ()=>{
    if(running) return;
    running=true; collected=0; field.innerHTML='';
    let t=18;
    timer = setInterval(()=>{
      if(t<=0){ clearInterval(timer); running=false; const final = Math.min(100, Math.round((collected/40)*100)); finishMission('chloroplast', final); alert(`Chloroplast mission complete — collected ${collected} photons, score: ${final}`); return; }
      // spawn 1-3 photons
      const n = 1 + Math.floor(Math.random()*3);
      for(let i=0;i<n;i++) spawnPhoton();
      t--;
    }, 900);
  };
}

/* -----------------------
   Simulations (plant and animal)
   Use collected mission scores to compute outcomes
   ----------------------- */

function runPlantSim(){
  // relevant missions: chloroplast, vacuole, cell-wall, golgi (packaging), membrane (uptake), nucleus (control)
  const weights = {
    chloroplast: 0.28,
    vacuole: 0.20,
    'cell-wall': 0.18,
    golgi: 0.12,
    membrane: 0.12,
    nucleus: 0.10
  };
  // ensure all keys exist
  const score = computeWeightedScore(weights);
  const area = document.getElementById('plantSimArea');
  area.innerHTML = `<div class="panel"><h4>Plant Simulation Result</h4>
    <p class="small">Derived fitness score: <strong>${score}</strong>/100</p>
    <p class="small">Interpretation: ${interpretPlant(score)}</p>
    <div style="margin-top:8px"><button class="btn" onclick="animatePlant(${score})">Visualize</button></div>
  </div>`;
}

function runAnimalSim(){
  // relevant missions: mitochondria, membrane, vacuole, cytoplasm, ribosomes
  const weights = {
    mitochondria: 0.30,
    membrane: 0.20,
    vacuole: 0.12,
    cytoplasm: 0.14,
    ribosomes: 0.14,
    nucleus: 0.10
  };
  const score = computeWeightedScore(weights);
  const area = document.getElementById('animalSimArea');
  area.innerHTML = `<div class="panel"><h4>Animal Simulation Result</h4>
    <p class="small">Derived fitness score: <strong>${score}</strong>/100</p>
    <p class="small">Interpretation: ${interpretAnimal(score)}</p>
    <div style="margin-top:8px"><button class="btn" onclick="animateAnimal(${score})">Visualize</button></div>
  </div>`;
}

function computeWeightedScore(weights){
  let total=0, weightSum=0;
  for(const k in weights){
    const w = weights[k];
    weightSum += w;
    const s = progress.missionScores[k] || 40; // give a baseline if not completed
    total += s * w;
  }
  const final = Math.round(total / weightSum);
  return Math.max(0, Math.min(100, final));
}

function interpretPlant(score){
  if(score >= 85) return 'Highly adaptive Venus Flytrap — trap forms quickly and efficiently, photosynthesis strong.';
  if(score >= 65) return 'Moderately adaptive — trap works but may fail in extreme drought or low light.';
  if(score >= 40) return 'Low adaptation — trap forms slowly, energy limited; student should replay Chloroplast & Vacuole missions.';
  return 'Poor — plant cannot sustain trap action; study Chloroplast and Vacuole missions to improve.';
}

function interpretAnimal(score){
  if(score >= 85) return 'Arctic Fox cell functions well: high metabolism and good membrane stability for cold.';
  if(score >= 65) return 'Reasonably adaptive — maintains heat under moderate cold, but risk under extreme cold.';
  if(score >= 40) return 'Low adaptation — energy/insulation insufficient; improve Mitochondria & Membrane missions.';
  return 'Poor — animal cell fails to maintain heat or hydration; replay key missions.';
}

/* Simple visualizers (tiny animations) */
function animatePlant(score){
  const area = document.getElementById('plantSimArea');
  area.innerHTML = `<div class="panel" style="text-align:center; padding:22px"><div id="plantVis" style="font-size:48px">🌱</div><div class="small" style="margin-top:8px">Turgor: -- • Energy: --</div></div>`;
  const vis = document.getElementById('plantVis');
  let growth = 0;
  const interval = setInterval(()=>{
    growth += Math.max(1, Math.round(score / 30));
    vis.style.transform = `scale(${1 + growth/100})`;
    if(growth >= 60){ clearInterval(interval); vis.textContent = '🌿'; }
  }, 180);
}

function animateAnimal(score){
  const area = document.getElementById('animalSimArea');
  area.innerHTML = `<div class="panel" style="text-align:center; padding:22px"><div id="animalVis" style="font-size:48px">🦊</div><div class="small" style="margin-top:8px">Heat: -- • Energy: --</div></div>`;
  const vis = document.getElementById('animalVis');
  let warmth = 0;
  const interval = setInterval(()=>{
    warmth += Math.max(2, Math.round(score/25));
    vis.style.filter = `drop-shadow(0 0 ${Math.min(20, warmth/2)}px rgba(255, 150, 60, 0.6))`;
    if(warmth >= 60){ clearInterval(interval); vis.textContent = '🦊'; }
  }, 180);
}

/* -----------------------
   Utility functions
   ----------------------- */
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr; }

function resetProgress(){
  if(!confirm('Reset all progress?')) return;
  progress = { missionScores: {}, completed: {}, totalScore: 0 };
  saveProgress();
  routeTo('hub');
}

function exportProgress(){
  const blob = new Blob([JSON.stringify(progress, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'celliverse_progress.json'; a.click();
  URL.revokeObjectURL(url);
}

function updateStatus(){
  const completedCount = Object.keys(progress.completed || {}).length;
  statusEl.textContent = `Status: ${completedCount}/${MISSIONS.length} missions complete • Score: ${progress.totalScore || 0}`;
}

/* make functions available to window for some inline buttons */
window.routeTo = routeTo;
window.startMission = startMission;
window.resetProgress = resetProgress;
window.exportProgress = exportProgress;
window.runPlantSim = runPlantSim;
window.runAnimalSim = runAnimalSim;
