function ascii(text){return [...text].map(c=>c.charCodeAt(0));}
function u32(v){return[(v>>>24)&255,(v>>>16)&255,(v>>>8)&255,v&255];}
function vlq(value){let buffer=Math.max(0,Math.floor(value))&0x7f;const out=[];let rest=Math.max(0,Math.floor(value))>>7;while(rest){buffer<<=8;buffer|=(rest&0x7f)|0x80;rest>>=7;}while(true){out.push(buffer&255);if(buffer&0x80)buffer>>=8;else break;}return out;}
function textMeta(type,text){const bytes=[...new TextEncoder().encode(String(text||''))];return[0xff,type,...vlq(bytes.length),...bytes];}
function trackChunk(events){const sorted=[...events].sort((a,b)=>a.tick-b.tick||a.order-b.order);const body=[];let last=0;for(const event of sorted){body.push(...vlq(Math.max(0,event.tick-last)),...event.bytes);last=event.tick;}body.push(0,0xff,0x2f,0);return[...ascii('MTrk'),...u32(body.length),...body];}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

export function normalizedSongToMidi(song,{notes=song?.notes||[],trackNameSuffix=''}={}){
  if(!song?.ppq||!Array.isArray(song?.tracks)) throw new Error('Analyzer Songが不正です。');
  const ppq=clamp(Math.round(Number(song.ppq)||480),1,0x7fff);
  const meta=[];
  for(const tempo of song.tempoMap||[]){const micros=Math.round(Number(tempo.microsecondsPerBeat)||60000000/(Number(tempo.bpm)||120));meta.push({tick:Math.max(0,Math.round(tempo.tick||0)),order:-3,bytes:[0xff,0x51,3,(micros>>16)&255,(micros>>8)&255,micros&255]});}
  for(const meter of song.timeSignatures||[]){const den=Number(meter.denominator)||4;const pow=Number.isInteger(Math.log2(den))?Math.log2(den):2;meta.push({tick:Math.max(0,Math.round(meter.tick||0)),order:-2,bytes:[0xff,0x58,4,clamp(Number(meter.numerator)||4,1,255),pow,24,8]});}
  if(!meta.some(e=>e.bytes[1]===0x51)) meta.push({tick:0,order:-3,bytes:[0xff,0x51,3,7,161,32]});
  if(!meta.some(e=>e.bytes[1]===0x58)) meta.push({tick:0,order:-2,bytes:[0xff,0x58,4,4,2,24,8]});
  const chunks=[trackChunk([{tick:0,order:-4,bytes:textMeta(0x03,`MIDI Analyzer ${trackNameSuffix}`)},...meta])];
  const byTrack=new Map(song.tracks.map(track=>[track.id,[]]));
  for(const note of notes){if(!byTrack.has(note.trackId))byTrack.set(note.trackId,[]);byTrack.get(note.trackId).push(note);}
  for(const track of song.tracks){const events=[{tick:0,order:-4,bytes:textMeta(0x03,`${track.name||track.id}${trackNameSuffix?` ${trackNameSuffix}`:''}`)}];for(const note of byTrack.get(track.id)||[]){const pitch=clamp(Math.round(Number(note.pitch)??0),0,127);const channel=clamp(Math.round(Number(note.channel)||0),0,15);const velocity=clamp(Math.round(Number(note.velocity)||96),1,127);const start=Math.max(0,Math.round(Number(note.startTick)||0));const end=Math.max(start+1,start+Math.max(1,Math.round(Number(note.durationTick)||1)));events.push({tick:start,order:1,bytes:[0x90|channel,pitch,velocity]},{tick:end,order:0,bytes:[0x80|channel,pitch,0]});}chunks.push(trackChunk(events));}
  return new Uint8Array([...ascii('MThd'),0,0,0,6,0,1,((chunks.length>>8)&255),chunks.length&255,(ppq>>8)&255,ppq&255,...chunks.flat()]);
}
