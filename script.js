/* ---- DATA ---- */
const organelles = window.location.href.includes('VenusFlytrap')
? [
  {id:'nucleus', title:'Nucleus', boost:11, desc:'Tune gene switches to optimize trap response.'},
  {id:'chlor', title:'Chloroplast', boost:15, desc:'Align chlorophyll panels to catch sunlight efficiently.'},
  {id:'rib', title:'Ribosome', boost:9, desc:'Assemble trap-trigger proteins quickly.'},
  {id:'er', title:'Endoplasmic Reticulum', boost:8, desc:'Route digestive enzymes to the trap.'},
  {id:'golgi', title:'Golgi', boost:8, desc:'Package enzymes into rapid-release vesicles.'},
  {id:'vacuole', title:'Vacuole', boost:12, desc:'Store captured nutrients for months.'},
  {id:'membrane', title:'Membrane', boost:8, desc:'Adjust ion channels to trigger trap movement.'},
  {id:'cellwall', title:'Cell Wall', boost:9, desc:'Strengthen trap edges to hold prey.'},
  {id:'perox', title:'Peroxisome', boost:6, desc:'Detoxify reactive oxygen during digestion.'},
  {id:'cyto', title:'Cytoskeleton', boost:10, desc:'Rapidly contract/relax to close the trap.'}
] : [
  {id:'nucleus', title:'Nucleus', short:'Gene control', desc:'Match 3 DNA segments to activate gene expression. Boost: gene regulation (+12%)', boost:12},
  {id:'mito', title:'Mitochondria', short:'Energy', desc:'Click the core rapidly to charge energy. Boost: energy output (+12%)', boost:12},
  {id:'ribosome', title:'Ribosome', short:'Protein synth', desc:'Drag amino acids into chain in order. Boost: protein versatility (+10%)', boost:10},
  {id:'er', title:'Endoplasmic Reticulum', short:'Transport', desc:'Route packets along the ER conveyor to the right exit. Boost: transport efficiency (+8%)', boost:8},
  {id:'golgi', title:'Golgi', short:'Packaging', desc:'Sort 4 molecules into correct bins. Boost: specialization (+8%)', boost:8},
  {id:'lysosome', title:'Lysosome', short:'Waste cleanup', desc:'Click to pop waste bubbles before they overwhelm. Boost: detox (+10%)', boost:10},
  {id:'vacuole', title:'Vacuole', short:'Storage', desc:'Catch falling nutrient droplets. Boost: storage (+10%)', boost:10},
  {id:'membrane', title:'Cell Membrane', short:'Barrier', desc:'Slide shield to block incoming toxins. Boost: protection (+10%)', boost:10},
  {id:'cytoskel', title:'Cytoskeleton', short:'Structure', desc:'Connect the nodes so the frame stays stable. Boost: mobility/resilience (+10%)', boost:10},
  {id:'perox', title:'Peroxisome', short:'Oxidative defense', desc:'Balance reactive particle levels. Boost: oxidative resistance (+10%)', boost:10}
];

let playerName=''; let adaptation=0; const adaptTarget=100; let current=null; let gameState={};

/* ---- UI references ---- */
const orgList = document.getElementById('org-list');
const currentOrg = document.getElementById('current-org');
const orgDesc = document.getElementById('org-desc');
const openBtn = document.getElementById('open-btn') || document.getElementById('open-btn');
const adaptBtn = document.getElementById('apply-btn') || document.getElementById('adapt-btn');
const feedback = document.getElementById('feedback') || document.getElementById('org-feedback');
const meterFill = document.getElementById('meter-fill');
const meterPercent = document.getElementById('meter-percent');
const log = document.getElementById('log') || document.getElementById('mission-log');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const cellVisual = document.getElementById('cell-visual');

/* ---- build list ---- */
function buildList(){
  orgList.innerHTML='';
  organelles.forEach((o,i)=>{
    const btn = document.createElement('button');
    btn.className='org-btn';
    btn.innerText=o.title;
    btn.onclick=()=>selectOrg(i);
    if(o.done) btn.classList.add('done');
    orgList.appendChild(btn);
  });
}
buildList();

/* ---- select ---- */
function selectOrg(i){
  current = organelles[i];
  currentOrg.innerText=current.title;
  orgDesc.innerText=current.desc;
  openBtn.disabled=false; adaptBtn.disabled=true;
  feedback.innerText='Open the mini-game to play.';
  playerName=document.getElementById('player').value.trim();
}

/* ---- open game ---- */
function openOrg(){
  if(!current) return;
  feedback.innerText='';
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // dispatch by ID
  switch(current.id){
    case 'chlor': gameChlor(); break;
    case 'vacuole': gameVacuole(); break;
    case 'cyto': gameCytoskel(); break;
    case 'nucleus': gameDNA(); break;
    case 'rib': gameRibo(); break;
    case 'er': gameER(); break;
    case 'golgi': gameGolgi(); break;
    case 'membrane': gameMembrane(); break;
    case 'cellwall': gameWall(); break;
    case 'perox': gamePerox(); break;
    case 'mito': gameMito(); break;
    case 'lysosome': gameLys(); break;
    default: ctx.fillText('Game soon',10,20);
  }
}

/* ---- adaptation ---- */
function enablePlantAdapt(){ adaptBtn.disabled=false; feedback.innerText='Game complete. Apply Adaptation.'; }
function applyAdapt(){
  if(!current) return;
  current.done=true;
  adaptation += current.boost;
  if(adaptation>adaptTarget) adaptation=adaptTarget;
  meterFill.style.width=adaptation+'%';
  meterPercent.innerText=adaptation+'%';
  log.innerText += `\n${new Date().toLocaleTimeString()}: ${playerName||'Explorer'} applied ${current.title} (+${current.boost}%)`;
  adaptBtn.disabled=true; openBtn.disabled=true;
  buildList();
  if(adaptation>=adaptTarget) finishPlant();
}

/* ---- evolution finish ---- */
function finishPlant(){
  if(!cellVisual) return;
  for(let i=0;i<30;i++){
    const p=document.createElement('div');
    p.className='particle';
    p.style.width='10px'; p.style.height='10px';
    p.style.left=(30+Math.random()*500)+'px';
    p.style.top=(30+Math.random()*100)+'px';
    p.style.background=(Math.random()>0.5)?'#c6ffb3':'#bfffcf';
    cellVisual.appendChild(p);
    setTimeout(()=>{ p.style.transform='translateY(-80px) scale(0.1)'; p.style.opacity='0'; },50+i*30);
  }
  log.innerText += `\n\n=== EVOLUTION COMPLETE ===\n${playerName||'Explorer'} fully adapted the cell at ${new Date().toLocaleTimeString()}`;
}

/* ---- helpers ---- */
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function resetAll(){ location.reload(); }
