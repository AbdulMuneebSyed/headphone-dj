import { normalize } from './settings.mjs';

async function hasOffscreen() {
  return (await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT']})).length>0;
}
async function audio(type, data={}) {
  const result=await chrome.runtime.sendMessage({target:'audio',type,...data});
  if(!result?.ok) throw new Error(result?.error||'The audio processor did not respond. Try opening the panel again.');
  return result;
}
async function badge(running) {
  await chrome.action.setBadgeText({text:running?'ON':''});
  await chrome.action.setBadgeBackgroundColor({color:'#a44518'});
}
async function handle(msg) {
  const {settings}=await chrome.storage.local.get('settings');
  const config=normalize(settings);
  if(msg.type==='GET') {
    const state=await hasOffscreen()?await audio('STATUS'):{running:false};
    await badge(state.running);
    return {...state,settings:config};
  }
  if(msg.type==='SET') {
    const updated=normalize(msg.settings);
    if(await hasOffscreen()) await audio('UPDATE',{settings:updated});
    await chrome.storage.local.set({settings:updated});
    return {settings:updated};
  }
  if(msg.type==='START') {
    if(await hasOffscreen()) {
      const state=await audio('STATUS');
      if(state.running) return state;
    } else {
      await chrome.offscreen.createDocument({url:'offscreen.html',reasons:['USER_MEDIA'],justification:'Process the selected tab audio locally with an equalizer and play it back.'});
    }
    try {
      const streamId=await chrome.tabCapture.getMediaStreamId({targetTabId:msg.tabId});
      const state=await audio('START',{streamId,tabId:msg.tabId,settings:config});
      await badge(true);
      return state;
    } catch(error) {
      if(await hasOffscreen()) await chrome.offscreen.closeDocument();
      await badge(false);
      throw error;
    }
  }
  if(msg.type==='STOP') {
    if(await hasOffscreen()) {
      await audio('STOP');
      await chrome.offscreen.closeDocument();
    }
    await badge(false);
    return {running:false};
  }
  throw new Error('Unknown mixer command.');
}
chrome.runtime.onMessage.addListener((msg,sender,respond)=>{
  if(sender.id!==chrome.runtime.id||msg.target!=='worker') return;
  (async()=>{
    try {
      const result=await navigator.locks.request('headphone-dj-operation',()=>handle(msg));
      respond({ok:true,...result});
    } catch(error) {respond({ok:false,error:error.message});}
  })();
  return true;
});
chrome.tabCapture.onStatusChanged.addListener(info=>{
  if(info.status==='stopped'||info.status==='error') {
    badge(false).catch(console.error);
  }
});
