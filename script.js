/* script.js
   Shared mission engine for animal.html and plant.html
   - initMission(type, organellesArray, options)
   - builds organelle cards, handles mini-games, adaptation meter, canvas visuals, mission log
*/

// ----- Utilities -----
function el(tag, props={}, children=[]){ const n=document.createElement(tag); Object.assign(n, props); (children||[]).forEach(c=>n.appendChild(typeof c==='string'?document.createTextNode(c):c)); return n; }

// ----- Mission state (created per page) -----
let missionState = null;

function initMission(mode, organelles, opts){
  // mode: 'animal' or 'plant'
  // organelles: array of {id,label,points,desc}
  // opts: {environment,visuals}
  missionState = {
    mode, organelles: JSON.parse(JSON.stringify(organelles)),
    points:0, maxPoints: organelles.reduce((s,o)=>s+o.points,0),
    completed: {}, log: [], opts
  };

  // populate organelle grid
  const gridId = mode==='animal' ? 'organelleGrid' : 'organelleGridPlant';
  const canvasId = mode==='animal' ? 'cellCanvas' : 'cellCanvasPlant';
  const meter = mode==='animal' ? 'globalMeter' : 'globalMeterPlant';
  const meterText = mode==='animal' ? 'meterText' : 'meterTextPlant';

  const grid = document.getElementById(gridId);
  grid.innerHTML = '';

  missionState.organelles.forEach(o=>{
    const card = el('div',{className:'organelle-card', id:'card-'+o.id},[]);
    const icon = el('div',{className:'organelle-icon icon-'+o.id},[el('div',{innerText:o.label.charAt(0)})]);
    const info = el('div',{className:'info'},[]);
    info.appendChild(el('h4',{innerText:o.label}));
    info.appendChild(el('p',{innerText:o.desc}));
    const btnRow = el('div',{className:'row'},[]);
    const btnAdapt = el('button',{className:'small-btn', innerText:'Adapt'},[]);
    btnAdapt.onclick = ()=> startMiniGame(o, canvasId, meter, meterText);
    btnRow.appendChild(btnAdapt);
    info.appendChild(btnRow);
    card.appendChild(icon); card.appendChild(info);
    grid.appendChild(card);
  });

  // initial canvas visual draw
  const canvas = document.getElementById(canvasId);
  if(canvas) {
    const ctx=canvas.getContext('2d');
    drawBaseCell(ctx, mode, opts);
  }
}

// ----- Draw base cell (cute realistic-ish shapes) -----
function drawBaseCell(ctx, mode, opts){
  // simple stylized cell background drawing
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  // background soft gradient
  const g = ctx.createRadialGradient(280,180,40,280,180,360);
  g.addColorStop(0, mode==='animal' ? '#fff9f0':'#f0fff4');
  g.addColorStop(1, '#e8f0ff');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);

  // cell membrane: stroked rounded blob (cute realistic)
  ctx.beginPath();
  ctx.ellipse(280,180,200,130,0,0,Math.PI*2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(120,160,255,0.08)';
  ctx.stroke();

  // some organelle placeholders (nucleus/mitochondria/chlor)
  // nucleus center
  drawNucleus(ctx, 280, 160);
  // mitochondria examples
  drawMito(ctx, 200, 230);
  drawMito(ctx, 360, 230);

  if(mode==='plant') drawChloroplast(ctx, 240,100), drawChloroplast(ctx, 330,120);
}

// nucleus draw
function drawNucleus(ctx,x,y){
  ctx.save();
  // outer
  ctx.beginPath();
  ctx.fillStyle = '#fff8f6';
  ctx.strokeStyle = 'rgba(255,195,210,0.6)';
  ctx.lineWidth = 2;
  ctx.ellipse(x,y,60,48,0,0,Math.PI*2);
  ctx.fill(); ctx.stroke();
  // internal DNA swirl
  ctx.beginPath();
  for(let i=0;i<6;i++){
    ctx.moveTo(x-40+i*12,y-6);
    ctx.quadraticCurveTo(x,y-40+i*6, x+40-i*12, y+4);
  }
  ctx.strokeStyle='rgba(250,160,200,0.8)';
  ctx.lineWidth=2;
  ctx.stroke();
  ctx.restore();
}

// mitochondria draw
function drawMito(ctx,x,y){
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(-0.3);
  ctx.beginPath();
  ctx.ellipse(0,0,28,14,0,0,2*Math.PI);
  ctx.fillStyle='#fff7e5'; ctx.fill();
  ctx.strokeStyle='rgba(255,170,90,0.5)'; ctx.lineWidth=2; ctx.stroke();
  // inner cristae
  ctx.beginPath();
  ctx.strokeStyle='rgba(255,140,80,0.6)';
  for(let i=-8;i<=8;i+=4) ctx.moveTo(i*1.5,-8), ctx.quadraticCurveTo(6,0,-i*1.2,8);
  ctx.stroke();
  ctx.restore();
}

// chloroplast (for plant)
function drawChloroplast(ctx,x,y){
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x,y,28,18,0,0,Math.PI*2);
  ctx.fillStyle='#f2fff6'; ctx.fill();
  ctx.lineWidth=2; ctx.strokeStyle='rgba(100,200,140,0.18)'; ctx.stroke();
  // internal stacks (thylakoid stylized circles)
  ctx.fillStyle='rgba(130,200,120,0.12)';
  for(let i=-2;i<=2;i++) ctx.fillRect(x-14+i*6, y-6, 22,6);
  ctx.restore();
}

// ----- Mini-games per organelle -----
// Each mini-game is short, clickable/drag interaction and returns points to the mission on success.

function startMiniGame(organelle, canvasId, meterId, meterTextId){
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  // disable adapt button to avoid duplicate runs
  const btn = document.querySelector('#card-' + organelle.id + ' .small-btn');
  btn.disabled = true; btn.innerText='Working...';

  // basic gameloop for different organelles by id type
  if(organelle.id === 'mito' || organelle.id === 'perox'){ // click energy build
    miniClickEnergy(ctx, organelle, canvasId, meterId, meterTextId, ()=>{
      btn.innerText='Adapted ✓';
    });
  } else if(organelle.id === 'mem'){ // membrane slider: keep fluidity bar in sweet spot
    miniMembrane(ctx, organelle, canvasId, meterId, meterTextId, ()=>{
      btn.innerText='Membrane Adapted ✓';
    });
  } else if(organelle.id === 'chloro'){ // sun capture for plant
    miniSunCapture(ctx, organelle, canvasId, meterId, meterTextId, ()=>{
      btn.innerText='Chloroplasts Optimized ✓';
    });
  } else if(organelle.id === 'rib'){ // assemble protein chain drag
    miniDragAssemble(ctx, organelle, canvasId, meterId, meterTextId, ()=>{
      btn.innerText='Proteins Built ✓';
    });
  } else if(organelle.id === 'lys'){ // click to degrade waste items (fast reflex)
    miniClickWaste(ctx, organelle, canvasId, meterId, meterTextId, ()=>{
      btn.innerText='Clean ✓';
    });
  } else if(organelle.id === 'vacuole' || organelle.id === 'vac'){ // catch falling nutrients
    miniCatchNutrients(ctx, organelle, canvasId, meterId, meterTextId, ()=>{
      btn.innerText='Stored ✓';
    });
  } else if(organelle.id === 'nucleus'){ // dna match puzzle
    miniDNAMatch(ctx, organelle, canvasId, meterId, meterTextId, ()=>{
      btn.innerText='Genome Toggled ✓';
    });
  } else if(organelle.id === 'er' || organelle.id === 'golgi' || organelle.id==='plasmodesm' || organelle.id==='cyto'){
    // simple conveyor/drag/sort placeholder but interactive
    miniConveyorSort(ctx, organelle, canvasId, meterId, meterTextId, ()=>{
      btn.innerText='Processed ✓';
    });
  } else {
    // fallback quick award
    setTimeout(()=> {
      awardAdaptation(organelle.points, meterId, meterTextId);
      missionState.log.push(`${organelle.label} quick-adapted (+${organelle.points})`);
      btn.innerText='Adapted ✓';
    }, 700);
  }
}

// ----- Mini-game implementations (short, tuned for classroom) -----

// energy click — click to charge up energy (mitochondria/peroxisome)
function miniClickEnergy(ctx, organelle, canvasId, meterId, meterTextId, onDone){
  let energy=0;
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  function draw(){
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    // big glowing core
    ctx.beginPath();
    ctx.arc(280,180,80,0,Math.PI*2);
    const g = ctx.createRadialGradient(280,180,10,280,180,100);
    g.addColorStop(0,'rgba(255,240,220,' + (0.6 + energy/250) + ')');
    g.addColorStop(1,'rgba(255,160,100,0.06)');
    ctx.fillStyle = g; ctx.fill();
    // energy ring
    ctx.lineWidth = 12;
    ctx.strokeStyle = `rgba(255,140,60,${0.15+energy/900})`;
    ctx.beginPath();
    ctx.arc(280,180,110, -Math.PI/2, -Math.PI/2 + (Math.PI*2)*(energy/100));
    ctx.stroke();

    ctx.fillStyle='#333'; ctx.font='16px Inter';
    ctx.fillText('Click the core to generate heat energy', 140, 320);
    ctx.fillText('Energy: '+energy+'%', 240, 200);
  }
  draw();
  function onClick(){
    energy += 8 + Math.round(Math.random()*6);
    if(energy>100) energy=100;
    draw();
    if(energy>=100){
      canvasClickOff();
      // award points scaled by organelle.points
      awardAdaptation(organelle.points, meterId, meterTextId);
      missionState.log.push(`${organelle.label} energized (+${organelle.points})`);
      if(onDone) onDone();
    }
  }
  const canvas = document.getElementById(canvasId);
  canvas.onclick = onClick;
  function canvasClickOff(){ canvas.onclick=null; }
}

// membrane fluidity slider — keep slider in sweet spot for time
function miniMembrane(ctx, organelle, canvasId, meterId, meterTextId, onDone){
  let slider = 120; // x pos
  let sweet = {min:180, max:260}; // sweet spot
  let timer = 0, score = 0;
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  function draw(){
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    // bar
    ctx.fillStyle='#eef'; ctx.fillRect(60,160,380,36);
    // sweet zone
    ctx.fillStyle='rgba(120,200,255,0.16)'; ctx.fillRect(sweet.min,160,sweet.max-sweet.min,36);
    // slider
    ctx.fillStyle='rgba(100,100,220,0.9)'; ctx.fillRect(slider,150,16,56);
    ctx.fillStyle='#333'; ctx.font='14px Inter';
    ctx.fillText('Balance membrane fluidity (drag left/right). Keep slider inside the blue zone to adapt.', 80, 140);
    ctx.fillText(`Time in sweet spot: ${score}s`, 220, 240);
  }
  draw();

  let dragging=false;
  const canvas = document.getElementById(canvasId);
  canvas.onmousedown = (e)=>{ if(e.offsetX>=slider && e.offsetX<=slider+16) dragging=true; };
  canvas.onmousemove = (e)=>{ if(dragging){ slider = Math.max(60, Math.min(420, e.offsetX-8)); draw(); }};
  canvas.onmouseup = ()=>{ dragging=false; };
  // timer loop
  const interval = setInterval(()=>{
    timer++;
    if(slider > sweet.min && slider < sweet.max) score++;
    if(score>=5){
      clearInterval(interval);
      canvas.onmousedown = canvas.onmousemove = canvas.onmouseup = null;
      awardAdaptation(organelle.points, meterId, meterTextId);
      missionState.log.push(`${organelle.label} membrane balanced (+${organelle.points})`);
      if(onDone) onDone();
    }
  }, 800);
}

// sun capture mini (chloroplast)
function miniSunCapture(ctx, organelle, canvasId, meterId, meterTextId, onDone){
  let beams=0;
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  function draw(){
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.fillStyle='#e8fff2'; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.fillStyle='#333'; ctx.font='16px Inter';
    ctx.fillText('Click the falling sunlight beams into the chloroplast to capture energy.', 70, 30);
    // chloroplast
    ctx.beginPath(); ctx.ellipse(440,220,48,32,0,0,Math.PI*2); ctx.fillStyle='#f8fff8'; ctx.fill();
    // beam indicator
    ctx.fillStyle='rgba(255,220,80,0.95)'; ctx.fillRect(80 + beams*40 % 360, 30 + (beams*18)%200, 12, 60);
    ctx.fillText('Captured: '+beams, 20, 340);
  }
  draw();
  const canvas = document.getElementById(canvasId);
  canvas.onclick = (e)=>{
    // simple hit test to see if click near chloroplast
    if(Math.hypot(e.offsetX-440, e.offsetY-220) < 60) beams++;
    else beams = Math.max(0, beams - 1);
    draw();
    if(beams >= 5){
      canvas.onclick = null;
      awardAdaptation(organelle.points, meterId, meterTextId);
      missionState.log.push(`${organelle.label} captured sunlight (+${organelle.points})`);
      if(onDone) onDone();
    }
  };
}

// drag assemble (ribosome)
function miniDragAssemble(ctx, organelle, canvasId, meterId, meterTextId, onDone){
  let parts = [{x:40,y:80},{x:110,y:120},{x:60,y:200}], assembled=false;
  let dragging = null, offset={x:0,y:0};
  function draw(){
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.fillStyle='#333'; ctx.fillText('Drag amino blocks into the ribosome (target at center).', 60, 30);
    // target
    ctx.strokeStyle='rgba(120,200,180,0.4)'; ctx.strokeRect(240,130,80,60);
    parts.forEach((p,i)=>{
      ctx.fillStyle='rgba(255,170,200,0.9)';
      ctx.fillRect(p.x,p.y,40,30);
      ctx.fillStyle='#000'; ctx.fillText('AA', p.x+8, p.y+20);
    });
    if(assembled) ctx.fillText('Protein Assembled!',220,280);
  }
  draw();

  const canvas = document.getElementById(canvasId);
  canvas.onmousedown = e=>{
    parts.forEach((p,i)=>{
      if(e.offsetX >= p.x && e.offsetX <= p.x+40 && e.offsetY >= p.y && e.offsetY <= p.y+30){
        dragging = i; offset.x = e.offsetX - p.x; offset.y = e.offsetY - p.y;
      }
    });
  };
  canvas.onmousemove = e=>{
    if(dragging !== null){ parts[dragging].x = e.offsetX - offset.x; parts[dragging].y = e.offsetY - offset.y; draw(); }
  };
  canvas.onmouseup = e=>{
    if(dragging !== null){
      // if all parts are inside target area
      const allInside = parts.every(p => p.x > 240 && p.x+40 < 320 && p.y > 130 && p.y+30 < 190);
      if(allInside){
        assembled = true;
        awardAdaptation(organelle.points, meterId, meterTextId);
        missionState.log.push(`${organelle.label} synthesized protein (+${organelle.points})`);
        if(onDone) onDone();
      }
      dragging = null;
    }
  };
}

// click waste (lysosome)
function miniClickWaste(ctx, organelle, canvasId, meterId, meterTextId, onDone){
  let objects = [];
  for(let i=0;i<6;i++) objects.push({x:50+Math.random()*440, y:30+Math.random()*260, r:12});
  function draw(){
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.fillStyle='#333'; ctx.fillText('Click glowing waste particles to digest them quickly.', 60, 30);
    objects.forEach(o=>{
      ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fillStyle='rgba(220,100,120,0.9)'; ctx.fill();
    });
  }
  draw();
  const canvas = document.getElementById(canvasId);
  canvas.onclick = (e)=>{
    for(let i=objects.length-1;i>=0;i--){
      if(Math.hypot(e.offsetX-objects[i].x, e.offsetY-objects[i].y) < objects[i].r+4){
        objects.splice(i,1);
      }
    }
    draw();
    if(objects.length===0){
      canvas.onclick=null;
      awardAdaptation(organelle.points, meterId, meterTextId);
      missionState.log.push(`${organelle.label} digested waste (+${organelle.points})`);
      if(onDone) onDone();
    }
  };
}

// catch nutrients (vacuole)
function miniCatchNutrients(ctx, organelle, canvasId, meterId, meterTextId, onDone){
  let bucketX=200, falling = {x:Math.random()*520, y:0}, caught=0;
  function draw(){
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.fillStyle='#333'; ctx.fillText('Move the storage vacuole (mouse) to catch falling nutrients.', 40, 30);
    ctx.fillStyle='#88f'; ctx.fillRect(bucketX,300,80,36);
    ctx.fillStyle='#faa'; ctx.beginPath(); ctx.arc(falling.x, falling.y, 12,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#333'; ctx.fillText('Caught: '+caught, 20, 340);
  }
  draw();
  const canvas = document.getElementById(canvasId);
  canvas.onmousemove = e=>{ bucketX = Math.max(20, Math.min(480, e.offsetX-40)); };
  const loop = setInterval(()=>{
    falling.y += 6;
    if(falling.y > 340){
      // check collision with bucket
      if(falling.x > bucketX && falling.x < bucketX+80){ caught++; falling.y=0; falling.x=Math.random()*520; }
      else { // missed -> reset
        falling.y=0; falling.x=Math.random()*520;
      }
    }
    draw();
    if(caught>=5){ clearInterval(loop); canvas.onmousemove=null; awardAdaptation(organelle.points, meterId, meterTextId); missionState.log.push(`${organelle.label} stored nutrients (+${organelle.points})`); if(onDone) onDone(); }
  }, 80);
}

// DNA match (nucleus)
function miniDNAMatch(ctx, organelle, canvasId, meterId, meterTextId, onDone){
  // simple click-to-flip-match pairs puzzle (3 pairs)
  const pairs = ['A-T','G-C','C-G']; let flipped=[];
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  const positions = [{x:120,y:100},{x:220,y:100},{x:320,y:100}];
  const cards = positions.map((p,i)=>({x:p.x,y:p.y,val:pairs[i],show:false}));
  function draw(){
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.fillStyle='#333'; ctx.fillText('Flip matching DNA tiles (click). Match the base pairs to activate gene expression.', 20, 30);
    cards.forEach((c,i)=>{
      ctx.fillStyle='rgba(200,240,255,0.9)'; ctx.fillRect(c.x,c.y,60,60);
      if(c.show){ ctx.fillStyle='#000'; ctx.fillText(c.val, c.x+10, c.y+35); }
    });
  }
  draw();
  const canvas = document.getElementById(canvasId);
  canvas.onclick = (e)=>{
    cards.forEach((c,i)=>{
      if(e.offsetX >= c.x && e.offsetX <= c.x+60 && e.offsetY >= c.y && e.offsetY <= c.y+60){
        c.show = !c.show;
        if(c.show) flipped.push(i);
      }
    });
    // If two flipped, check
    if(flipped.length >= 2){
      const a = cards[flipped[0]].val, b = cards[flipped[1]].val;
      if((a==='A-T' && b==='T-A') || (a==='T-A' && b==='A-T') || (a==='G-C' && b==='C-G') || (a==='C-G' && b==='G-C') || a===b){
        // treat as match (for our simplified set)
        awardAdaptation(organelle.points, meterId, meterTextId);
        missionState.log.push(`${organelle.label} gene toggled (+${organelle.points})`);
        canvas.onclick=null;
        if(onDone) onDone();
      } else {
        // flip back after a short delay
        setTimeout(()=>{ cards.forEach(c=>c.show=false); draw(); }, 500);
      }
      flipped=[];
    }
    draw();
  };
}

// conveyor/sort (ER, Golgi, cytoskeleton, plasmodesm)
function miniConveyorSort(ctx, organelle, canvasId, meterId, meterTextId, onDone){
  // simple drag target sort: three tokens into the correct bin
  let tokens = [{x:60,y:120,t:'lipid'},{x:120,y:60,t:'protein'},{x:200,y:140,t:'signal'}];
  const bins = [{x:360,y:80,t:'lipid'},{x:360,y:160,t:'protein'},{x:360,y:240,t:'signal'}];
  let dragging=null, off={x:0,y:0};
  function draw(){
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.fillStyle='#333'; ctx.fillText('Drag tokens to the correct processing bins (blue: lipid, purple: protein, teal:signal).', 20, 30);
    bins.forEach(b=>{
      ctx.fillStyle='rgba(200,220,255,0.6)'; ctx.fillRect(b.x,b.y,80,40);
      ctx.fillStyle='#000'; ctx.fillText(b.t, b.x+10, b.y+26);
    });
    tokens.forEach(t=>{
      ctx.fillStyle='rgba(255,200,220,0.9)'; ctx.fillRect(t.x,t.y,44,28);
      ctx.fillStyle='#000'; ctx.fillText(t.t, t.x+6, t.y+18);
    });
  }
  draw();
  const canvas = document.getElementById(canvasId);
  canvas.onmousedown = e=>{
    tokens.forEach((t,i)=>{ if(e.offsetX>=t.x && e.offsetX<=t.x+44 && e.offsetY>=t.y && e.offsetY<=t.y+28){ dragging=i; off.x=e.offsetX-t.x; off.y=e.offsetY-t.y; }});
  };
  canvas.onmousemove = e=>{ if(dragging!==null){ tokens[dragging].x=e.offsetX-off.x; tokens[dragging].y=e.offsetY-off.y; draw(); }};
  canvas.onmouseup = e=>{
    if(dragging!==null){
      const t = tokens[dragging];
      const matched = bins.some(b=> t.x > b.x && t.x < b.x+80 && t.y > b.y && t.y < b.y+40 && b.t===t.t );
      if(matched){
        tokens.splice(dragging,1);
      }
      dragging=null; draw();
      if(tokens.length===0){
        canvas.onmousedown=canvas.onmousemove=canvas.onmouseup=null;
        awardAdaptation(organelle.points, meterId, meterTextId);
        missionState.log.push(`${organelle.label} processed packages (+${organelle.points})`);
        if(onDone) onDone();
      }
    }
  };
}

// ----- Award adaptation and update meter & visuals -----
function awardAdaptation(points, meterId, meterTextId){
  missionState.points += points;
  const percent = Math.round((missionState.points / missionState.maxPoints) * 100);
  const meter = document.getElementById(meterId);
  const meterText = document.getElementById(meterTextId);
  if(meter) meter.style.width = Math.min(100, percent)+'%';
  if(meterText) meterText.innerText = 'Adaptation: ' + Math.min(100, percent) + '%';

  // visual: update canvas to show incremental adaptation (glow, particles)
  const canvasId = (meterId === 'globalMeter') ? 'cellCanvas' : 'cellCanvasPlant';
  const canvas = document.getElementById(canvasId);
  if(canvas) {
    const ctx = canvas.getContext('2d');
    // small glow overlay that scales with percent
    drawBaseCell(ctx, missionState.mode, missionState.opts);
    if(percent >= 30) { ctx.fillStyle = 'rgba(255,230,200,0.04)'; ctx.fill(); }
    if(percent >= 50) { ctx.beginPath(); ctx.ellipse(280,180,140,100,0,0,Math.PI*2); ctx.fillStyle='rgba(200,255,220,0.06)'; ctx.fill(); }
    if(percent >= 80) { ctx.beginPath(); ctx.ellipse(280,180,180,130,0,0,Math.PI*2); ctx.fillStyle='rgba(240,220,255,0.06)'; ctx.fill(); }
  }

  // if 100%, trigger final evolution animation
  if(percent >= 100) {
    triggerEvolution(canvasId);
  }
}

// evolution final animation
function triggerEvolution(canvasId){
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let t=0;
  function frame(){
    t++;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // pulse
    drawBaseCell(ctx, missionState.mode, missionState.opts);
    ctx.save();
    ctx.globalAlpha = 0.08 + Math.abs(Math.sin(t/10))*0.2;
    ctx.fillStyle = 'rgba(255,240,200,0.16)';
    ctx.beginPath(); ctx.ellipse(280,180,80 + t*0.8, 60 + t*0.6,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
    if(t<80) requestAnimationFrame(frame);
    else {
      // final message
      ctx.fillStyle='#222'; ctx.font='20px Inter';
      ctx.fillText('Evolution Achieved — Adaptation Complete!',80,180);
      // log final state
      missionState.log.push('EVOLUTION ACHIEVED: Full adaptation reached.');
      // show modal after small delay
      setTimeout(()=> showFinalLog(),900);
    }
  }
  frame();
}

// show final mission log (pop modal)
function showFinalLog(){
  const logText = (document.getElementById('logText') || document.getElementById('logTextPlant'));
  const modal = document.getElementById('logModal') || document.getElementById('logModalPlant');
  if(!logText || !modal) return;
  logText.textContent = `Explorer: ${localStorage.getItem('celliverse_player') || 'Explorer'}\n\n` +
    missionState.log.join('\n') + `\n\nTotal adaptation: ${missionState.points}/${missionState.maxPoints}\n\nCongratulations — mission complete.`;
  modal.classList.remove('hidden');
}
function showLog(){ const modal=document.getElementById('logModal'); const logText=document.getElementById('logText'); if(!modal) return; logText.textContent = missionState.log.join('\n'); modal.classList.remove('hidden'); }
function showLogPlant(){ const modal=document.getElementById('logModalPlant'); const logText=document.getElementById('logTextPlant'); if(!modal) return; logText.textContent = missionState.log.join('\n'); modal.classList.remove('hidden'); }
function closeLog(){ document.getElementById('logModal').classList.add('hidden'); }
function closeLogPlant(){ document.getElementById('logModalPlant').classList.add('hidden'); }
