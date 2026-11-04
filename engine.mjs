import { FREQUENCIES, normalize } from './settings.mjs';

export function createMixer(context, source, initial) {
  const eq=FREQUENCIES.map(frequency=>{
    const node=context.createBiquadFilter();
    node.type='peaking'; node.frequency.value=frequency; node.Q.value=1.4;
    return node;
  });
  const bass=context.createBiquadFilter(); bass.type='lowshelf'; bass.frequency.value=100;
  const treble=context.createBiquadFilter(); treble.type='highshelf'; treble.frequency.value=8000;
  const volume=context.createGain();
  const balance=context.createStereoPanner();
  const compressor=context.createDynamicsCompressor();
  compressor.threshold.value=-2; compressor.knee.value=2; compressor.ratio.value=20;
  compressor.attack.value=0.003; compressor.release.value=0.15;
  const dry=context.createGain(), wet=context.createGain();
  const analyser=context.createAnalyser(); analyser.fftSize=2048;
  analyser.smoothingTimeConstant=0.7;
  const chain=[source,...eq,bass,treble,volume,balance,compressor,wet,analyser,context.destination];
  for(let i=0;i<chain.length-1;i++) chain[i].connect(chain[i+1]);
  source.connect(dry); dry.connect(analyser);
  function update(config, immediate=false) {
    const s=normalize(config);
    const set=(param,value)=>{
      param.cancelScheduledValues(context.currentTime);
      if(immediate) param.setValueAtTime(value,context.currentTime);
      else param.setTargetAtTime(value,context.currentTime,0.015);
    };
    eq.forEach((node,i)=>set(node.gain,s.bands[i]));
    set(bass.gain,s.bass); set(treble.gain,s.treble);
    set(volume.gain,s.volume/100); set(balance.pan,s.balance);
    set(wet.gain,s.enabled?1:0); set(dry.gain,s.enabled?0:1);
  }
  update(initial,true);
  const spectrum=new Uint8Array(analyser.frequencyBinCount);
  const waveform=new Float32Array(analyser.fftSize);
  return {update,read(){
    analyser.getByteFrequencyData(spectrum);
    analyser.getFloatTimeDomainData(waveform);
    let peak=0;
    for(const sample of waveform) peak=Math.max(peak,Math.abs(sample));
    return {peak:peak?20*Math.log10(peak):-100,
      spectrum:FREQUENCIES.map(f=>spectrum[Math.min(spectrum.length-1,Math.round(f*analyser.fftSize/context.sampleRate))]/255)};
  }};
}
