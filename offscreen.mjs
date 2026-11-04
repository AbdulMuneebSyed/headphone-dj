import {createMixer} from './engine.mjs';
let session=null;
async function stop() {
  if(!session) return;
  const previous=session; session=null;
  for(const track of previous.stream.getTracks()) {track.onended=null; track.stop();}
  await previous.context.close();
}
async function handle(msg) {
  if(msg.type==='START') {
    if(session) return {running:true,tabId:session.tabId};
    let stream,context;
    try {
      stream=await navigator.mediaDevices.getUserMedia({audio:{mandatory:{chromeMediaSource:'tab',chromeMediaSourceId:msg.streamId}},video:false});
      context=new AudioContext({latencyHint:'interactive'});
      const source=context.createMediaStreamSource(stream);
      const mixer=createMixer(context,source,msg.settings);
      await context.resume();
      session={stream,context,mixer,tabId:msg.tabId};
      for(const track of stream.getTracks()) track.onended=()=>{stop().catch(console.error);};
    } catch(error) {
      for(const track of stream?.getTracks()||[]) track.stop();
      if(context&&context.state!=='closed') await context.close();
      throw error;
    }
  } else if(msg.type==='UPDATE') session?.mixer.update(msg.settings);
  else if(msg.type==='STOP') await stop();
  return {running:!!session,tabId:session?.tabId,contextState:session?.context.state,...(session?.mixer.read()||{})};
}
chrome.runtime.onMessage.addListener((msg,sender,respond)=>{
  if(sender.id!==chrome.runtime.id||msg.target!=='audio') return;
  (async()=>{
    try {respond({ok:true,...await handle(msg)});}
    catch(error){respond({ok:false,error:error.message});}
  })();
  return true;
});
