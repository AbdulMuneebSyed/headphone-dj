import { FREQUENCIES, PRESETS, normalize } from './settings.mjs';
// A Chrome action popup starts with a narrow measuring viewport. Fix its root
// width so responsive styles cannot cause it to settle at its minimum width.
if(chrome.extension.getViews({type:'popup'}).includes(window)) document.documentElement.classList.add('action-popup');
const $=id=>document.getElementById(id);
let settings=normalize(),running=false,targetTabId=null,busy=false,saving=false,pending=null,ready=false;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const db=value=>`${value>0?'+':''}${value} dB`;
const hz=f=>f>=1000?`${f/1000}k`:`${f}`;
async function command(type,data={}) {
  const result=await chrome.runtime.sendMessage({target:'worker',type,...data});
  if(!result?.ok) throw new Error(result?.error||'Chrome did not respond. Reopen the mixer and try again.');
  return result;
}
function error(message) { $('error').textContent=message; $('error').hidden=!message; }
function presetName(){return Object.keys(PRESETS).find(name=>{
  const p=PRESETS[name];
  return settings.bass===p.bass&&settings.treble===p.treble&&settings.bands.every((v,i)=>v===p.bands[i]);
})||'Custom';}
function renderControls() {
  for(const key of ['volume','bass','treble','balance']) $(key).value=settings[key];
  $('volume-value').textContent=`${settings.volume}%`;
  $('bass-value').textContent=db(settings.bass); $('treble-value').textContent=db(settings.treble);
  const balance=settings.balance===0?'Center':`${Math.round(Math.abs(settings.balance)*100)}% ${settings.balance<0?'L':'R'}`;
  $('balance-value').textContent=balance;
  $('balance').setAttribute('aria-valuetext',balance);
  for(const key of ['bass','treble']) $(key).setAttribute('aria-valuetext',db(settings[key]));
  $('volume').setAttribute('aria-valuetext',`${settings.volume} percent`);
  settings.bands.forEach((v,i)=>{
    $(`band-${i}`).value=v; $(`value-${i}`).textContent=v>0?`+${v}`:`${v}`;
    $(`band-${i}`).setAttribute('aria-valuetext',db(v));
  });
  $('preset').value=presetName();
  $('bypass').setAttribute('aria-pressed',String(!settings.enabled));
  $('bypass').textContent=settings.enabled?'Bypass':'Bypass on';
}
function renderState(state) {
  running=!!state.running;
  document.body.classList.toggle('running',running);
  $('capture').textContent=busy?'Connecting…':running?'Stop mixer':'Start mixer';
  $('capture').disabled=busy||!ready;
  $('status').textContent=running?(settings.enabled?'Mixer is on':'Original audio'): 'Ready to mix';
  $('source').textContent=running?(state.tabId===targetTabId?'Processing this tab':'Processing another Chrome tab'):'One tab. Your sound.';
  $('hint').textContent=running?'Keep watching. Your mix keeps playing when this panel closes.':'Play a YouTube video, then start the mixer.';
  if(!running||reducedMotion.matches) {
    document.querySelectorAll('#spectrum i').forEach(el=>el.style.transform='scaleY(0)');
    $('peak').textContent=running?'Meter paused':'No signal';
  } else {
    document.querySelectorAll('#spectrum i').forEach((el,i)=>el.style.transform=`scaleY(${state.spectrum?.[i]||0})`);
    $('peak').textContent=state.peak>-90?`${state.peak.toFixed(1)} dBFS`:'Silent';
  }
}
async function save() {
  pending=normalize(settings);
  if(saving)return;
  saving=true;
  try {
    while(pending) {
      const snapshot=pending; pending=null;
      await command('SET',{settings:snapshot});
    }
    error('');
  } catch(e){error(`Could not save your mix: ${e.message}`);}
  finally {saving=false;}
}
FREQUENCIES.forEach((frequency,i)=>{
  const container=document.createElement('div');container.className='band';
  const output=document.createElement('output');output.id=`value-${i}`;output.htmlFor=`band-${i}`;output.textContent='0';
  const input=document.createElement('input');Object.assign(input,{type:'range',id:`band-${i}`,min:'-12',max:'12',step:'0.5',value:'0'});
  input.setAttribute('aria-label',`${frequency} Hz equalizer`);
  const label=document.createElement('label');label.htmlFor=input.id;label.textContent=hz(frequency);
  input.addEventListener('input',()=>{settings.bands[i]=Number(input.value);renderControls();save();});
  container.append(output,input,label);$('bands').append(container);
  $('spectrum').append(document.createElement('i'));
});
for(const name of Object.keys(PRESETS)) {
  const option=document.createElement('option');option.textContent=name;$('preset').append(option);
}
$('preset-label').textContent=`${Object.keys(PRESETS).length} presets`;
for(const key of ['volume','bass','treble','balance']) $(key).addEventListener('input',()=>{
  settings[key]=Number($(key).value);renderControls();save();
});
$('preset').addEventListener('change',()=>{
  const preset=PRESETS[$('preset').value];
  if(preset){settings=normalize({...settings,...preset});renderControls();save();}
});
$('bypass').addEventListener('click',()=>{settings.enabled=!settings.enabled;renderControls();save();});
$('reset').addEventListener('click',()=>{settings=normalize();renderControls();save();});
$('capture').addEventListener('click',async()=>{
  if(busy)return;
  busy=true;$('capture').disabled=true;$('capture').textContent=running?'Stopping…':'Connecting…';error('');
  try {
    const state=await command(running?'STOP':'START',{tabId:targetTabId});
    busy=false;renderState(state);
  } catch(e){
    busy=false;error(`Could not connect: ${e.message} Open a normal YouTube tab, click this extension’s toolbar icon, and try again.`);
    renderState({running:false});
  }
});
async function init(){
  try {
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});targetTabId=tab?.id;
    const state=await command('GET'); settings=normalize(state.settings);ready=true;
    renderControls();renderState(state);
  }catch(e){error(e.message);$('status').textContent='Connection unavailable';}
}
await init();
// Poll measured audio only. Never overwrite a user's slider edit with an older snapshot.
setInterval(async()=>{
  if(!ready||busy||saving||document.hidden)return;
  try {renderState(await command('GET'));}catch(e){error(e.message);}
},reducedMotion.matches?1500:200);
