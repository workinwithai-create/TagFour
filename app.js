const CDN = "https://cdn.jsdelivr.net/gh/workinwithai-create/PreEight@main/public/samples";
const STEPS = 16;
const CHORUS = 8;
const TAG = 4;
const recipes = [
  { id:"last-line", name:"Last line", blurb:"IV then I under the last lyric. Then stop." },
  { id:"hold-cut", name:"Hold and cut", blurb:"Bass pedal. Hats die. Last word on air." },
  { id:"walk-home", name:"Walk home", blurb:"Upright walks down into tonic." },
  { id:"half-stop", name:"Half stop", blurb:"Half-time pocket. No slam." },
  { id:"stop-tag", name:"Stop tag", blurb:"Two hits. Two bars of air." },
  { id:"call-back", name:"Call back", blurb:"Nylon recalls the last line once." },
  { id:"kit-close", name:"Kit close", blurb:"Ride to hats. No crash." },
  { id:"bass-drop", name:"Bass drop", blurb:"Upright drops an octave and stays." },
  { id:"nylon-last", name:"Nylon last", blurb:"A last figure that is not another chorus." },
  { id:"brass-out", name:"Brass out", blurb:"Trumpet on bar 12. Live out, not a fade." }
];
function bar(symbol, piano, guitar, bass){ return { symbol, piano, guitar, bass }; }
const grooves = [
  { id:"amber", name:"Amber Walk", bpm:98, key:"A minor",
    chorus:[bar("Am",[45,48,52,57],[45,52,57],33),bar("F",[41,45,48,53],[41,48,53],41),bar("C",[48,52,55,60],[48,52,55],36),bar("G",[43,47,50,55],[43,47,50],31),bar("Am",[45,48,52,57],[45,52,57],33),bar("F",[41,45,48,53],[41,48,53],41),bar("C",[48,52,55,60],[48,52,55],36),bar("G",[43,47,50,55],[43,47,50],31)],
    tag:[bar("F",[41,45,48,53],[41,48,53],41),bar("G",[43,47,50,55],[43,47,50],31),bar("Am",[45,48,52,57],[45,52,57],33),bar("Am",[45,48,52,57],[45,52,57],33)] },
  { id:"porch", name:"Porch Climb", bpm:86, key:"E major",
    chorus:[bar("E",[40,44,47,52],[40,47,52],28),bar("B",[35,39,42,47],[35,42,47],23),bar("C#m",[44,47,51,56],[44,51,56],32),bar("A",[33,37,40,45],[33,40,45],33),bar("E",[40,44,47,52],[40,47,52],28),bar("B",[35,39,42,47],[35,42,47],23),bar("C#m",[44,47,51,56],[44,51,56],32),bar("A",[33,37,40,45],[33,40,45],33)],
    tag:[bar("A",[33,37,40,45],[33,40,45],33),bar("B",[35,39,42,47],[35,42,47],23),bar("E",[40,44,47,52],[40,47,52],28),bar("E",[40,44,47,52],[40,47,52],28)] },
  { id:"fold", name:"Fold Radio", bpm:104, key:"D minor",
    chorus:[bar("Dm",[38,41,45,50],[38,45,50],26),bar("Bb",[34,38,41,46],[34,41,46],34),bar("F",[41,45,48,53],[41,48,53],29),bar("C",[36,40,43,48],[36,43,48],24),bar("Dm",[38,41,45,50],[38,45,50],26),bar("Bb",[34,38,41,46],[34,41,46],34),bar("F",[41,45,48,53],[41,48,53],29),bar("C",[36,40,43,48],[36,43,48],24)],
    tag:[bar("Bb",[34,38,41,46],[34,41,46],34),bar("C",[36,40,43,48],[36,43,48],24),bar("Dm",[38,41,45,50],[38,45,50],26),bar("Dm",[38,41,45,50],[38,45,50],26)] }
];
const state = { groove: grooves[0], recipe: recipes[0], playing:false, bar:0, mode:null };
let ctx, bus, buffers = {};
async function load() {
  ctx = new AudioContext();
  bus = ctx.createGain(); bus.gain.value = 0.35; bus.connect(ctx.destination);
  const files = [
    ["kick",`${CDN}/drums/kick.mp3`],["snare",`${CDN}/drums/snare.mp3`],["hat",`${CDN}/drums/hihat.mp3`],["crash",`${CDN}/drums/crash.mp3`],
    ["pC3",`${CDN}/piano/C3.mp3`],["pC4",`${CDN}/piano/C4.mp3`],["pA3",`${CDN}/piano/A3.mp3`],
    ["bE1",`${CDN}/bass/E1.mp3`],["bA1",`${CDN}/bass/A1.mp3`],["bC2",`${CDN}/bass/C2.mp3`],
    ["gE2",`${CDN}/guitar/E2.mp3`],["gA2",`${CDN}/guitar/A2.mp3`],["gE3",`${CDN}/guitar/E3.mp3`],
    ["tC4",`${CDN}/trumpet/C4.mp3`],["vA3",`${CDN}/violin/A3.mp3`]
  ];
  let n=0;
  for (const [k,url] of files) {
    try { const r = await fetch(url); buffers[k] = await ctx.decodeAudioData(await r.arrayBuffer()); } catch (e) { console.warn(k, e); }
    n++; document.getElementById("status").textContent = `Seating chairs ${n}/${files.length}`;
  }
  document.getElementById("status").textContent = "Chairs seated · live FluidR3 + kit";
}
function playBuf(name, when, rate=1, gain=0.4) {
  const b = buffers[name]; if (!b || !ctx) return;
  const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = gain; src.connect(g); g.connect(bus); src.start(when);
}
function rateFromMidi(midi, baseMidi){ return Math.pow(2, (midi-baseMidi)/12); }
function chordAt(i){ return i < CHORUS ? state.groove.chorus[i] : state.groove.tag[i-CHORUS]; }
function scheduleBar(barIndex, t0, stepDur){
  const ch = chordAt(barIndex); const onTag = barIndex >= CHORUS; const rec = state.recipe.id;
  for (let s=0;s<STEPS;s++){
    const when = t0 + s*stepDur;
    if (s%2===0) playBuf("hat", when, 1, onTag && rec==="kit-close" && barIndex>=10 ? 0.04 : 0.07);
    if (s===0) playBuf("kick", when, 1, 0.7);
    if (s===8 && !(onTag && rec==="half-stop")) playBuf("snare", when, 1, 0.45);
    if (s===0) {
      playBuf("pC4", when, rateFromMidi(ch.piano[2]||60, 60), 0.28);
      playBuf("pA3", when, rateFromMidi(ch.piano[1]||57, 57), 0.22);
      playBuf("bA1", when, rateFromMidi(ch.bass, 33), rec==="bass-drop" && barIndex>=10 ? 0.7 : 0.45);
      playBuf("gA2", when, rateFromMidi(ch.guitar[0]||45, 45), 0.22);
    }
    if (onTag && rec==="brass-out" && barIndex===11 && (s===4 || s===12)) playBuf("tC4", when, rateFromMidi(ch.piano[3]||69,60), 0.35);
    if (onTag && rec==="hold-cut" && s===0) playBuf("vA3", when, rateFromMidi(ch.piano[2]||60,57), 0.18);
    if (onTag && rec==="stop-tag" && barIndex>=10) continue;
  }
}
let timer=null;
function stop(){ state.playing=false; state.mode=null; if(timer) clearTimeout(timer); timer=null; paintBars(); }
async function play(mode){
  if (!ctx) await load();
  if (ctx.state==="suspended") await ctx.resume();
  stop(); state.playing=true; state.mode=mode;
  const startBar = mode==="eight" ? CHORUS : 0;
  const endBar = mode==="loop" ? CHORUS : CHORUS+TAG;
  const stepDur = 60/state.groove.bpm/4;
  let barIndex = startBar;
  const tick = () => {
    if (!state.playing) return;
    if (barIndex >= endBar) { if (mode==="loop") barIndex = startBar; else { stop(); return; } }
    state.bar = barIndex; paintBars();
    scheduleBar(barIndex, ctx.currentTime+0.02, stepDur);
    barIndex += 1;
    timer = setTimeout(tick, STEPS*stepDur*1000);
  };
  tick();
}
function punch(){
  const g=state.groove, r=state.recipe;
  return `TagFour punch list\n${g.name} · ${g.bpm} BPM · ${g.key} · ${r.name}\n\nThe problem: last chorus loops or fades. Session players write four live bars after the money chorus, then stop.\nThe move: ${r.blurb}\n\nLast chorus (bars 1-8)\n${g.chorus.map((b,i)=>`  ${i+1}. ${b.symbol}`).join("\n")}\n\nTag (bars 9-12) — ${r.name}\n${g.tag.map((b,i)=>`  ${i+9}. ${b.symbol}`).join("\n")}\n\nLive chairs only. Distinct from PreEight, AfterHook, EndEight, LastHook.\nDrop the WAV on bars 9-12. Do not loop it.`;
}
function paintGrooves(){
  const el=document.getElementById("grooves"); el.innerHTML="";
  grooves.forEach(g=>{ const b=document.createElement("button"); b.className="card"+(state.groove.id===g.id?" on":""); b.innerHTML=`<b>${g.name}</b><span>${g.bpm} BPM · ${g.key}</span>`; b.onclick=()=>{ state.groove=g; render(); }; el.appendChild(b); });
}
function paintRecipes(){
  const el=document.getElementById("recipes"); el.innerHTML="";
  recipes.forEach(r=>{ const b=document.createElement("button"); b.className="card"+(state.recipe.id===r.id?" on":""); b.innerHTML=`<b>${r.name}</b><span>${r.blurb}</span>`; b.onclick=()=>{ state.recipe=r; render(); }; el.appendChild(b); });
}
function paintBars(){
  const el=document.getElementById("bars"); el.innerHTML="";
  for(let i=0;i<12;i++){ const ch=chordAt(i); const d=document.createElement("div"); d.className="bar"+(i>=8?" tag":"")+(state.playing && state.bar===i?" active":""); d.innerHTML=`<div class="n">${i+1} · ${i>=8?"T":"C"}</div><div class="c">${ch.symbol}</div>`; el.appendChild(d); }
}
function render(){ paintGrooves(); paintRecipes(); paintBars(); document.getElementById("punch").textContent = punch(); }
document.getElementById("playA").onclick=()=>play("loop");
document.getElementById("playB").onclick=()=>play("cut");
document.getElementById("play8").onclick=()=>play("eight");
document.getElementById("stop").onclick=stop;
document.getElementById("copy").onclick=()=>navigator.clipboard.writeText(punch());
render();
load();
