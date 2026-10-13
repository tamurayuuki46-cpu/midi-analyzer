import { noteEventsToMidi } from '../audio/noteEventsToMidi.js';
import { generate12KeyVariants, transposeNotesChromatic, transposeNotesDegreePreserve } from '../midi/transpose.js';

const root = document.querySelector('#audio-note-tools-root');
let state = null;

function safeName(value) {
  return String(value || 'audio').replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 70) || 'audio';
}
function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
function download(file) {
  const url=URL.createObjectURL(file); const a=document.createElement('a'); a.href=url; a.download=file.name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),500);
}
function makeMidi(notes, suffix) {
  const bytes=noteEventsToMidi(notes,{bpm:state.bpm,ppq:480,trackName:`Basic Pitch ${safeName(state.fileName)}`});
  return new File([bytes],`${safeName(state.fileName)}_${suffix}.mid`,{type:'audio/midi'});
}
function sendToAnalyzer(notes, suffix='edited') {
  const input=document.querySelector('#midi-file'); const form=document.querySelector('#import-form'); const origin=document.querySelector('#midi-origin');
  if (!input || !form || typeof DataTransfer !== 'function') return false;
  const file=makeMidi(notes,suffix); const transfer=new DataTransfer(); transfer.items.add(file); input.files=transfer.files;
  if (origin?.querySelector('option[value="basic-pitch"]')) origin.value='basic-pitch';
  form.requestSubmit(); return true;
}
function quantize(notes, division=16) {
  const beat=60/state.bpm; const step=beat*(4/division);
  return notes.map(note=>({
    ...note,
    startTimeSeconds:Math.max(0,Math.round(note.startTimeSeconds/step)*step),
    durationSeconds:Math.max(step,Math.round(note.durationSeconds/step)*step),
  }));
}
function render() {
  if (!root) return;
  if (!state) { root.replaceChildren(); return; }
  const options=state.notes.slice(0,500).map((n,i)=>`<option value="${i}">#${i+1} MIDI ${n.pitchMidi} · ${n.startTimeSeconds.toFixed(2)}s · ${n.durationSeconds.toFixed(2)}s</option>`).join('');
  root.innerHTML=`<section class="panel" aria-labelledby="bp-tools-title">
    <div class="panel-heading"><div><p class="eyebrow">BASIC PITCH NOTE TOOLS</p><h2 id="bp-tools-title">変換後MIDIを整える</h2></div></div>
    <p class="helper-note">高度なDAW編集ではなく、誤検出Noteの削除・Pitch/開始/長さ修正・Quantize・Key変更に限定します。現在 ${state.notes.length} notes。</p>
    <div class="field"><label>Note（先頭500件）</label><select data-note-select>${options}</select></div>
    <div class="controls-row">
      <label class="field"><span>Pitch</span><input data-note-pitch type="number" min="0" max="127"></label>
      <label class="field"><span>Start sec</span><input data-note-start type="number" min="0" step="0.01"></label>
      <label class="field"><span>Length sec</span><input data-note-length type="number" min="0.01" step="0.01"></label>
    </div>
    <div class="button-row"><button data-note-apply type="button">Noteを適用</button><button data-note-delete type="button">Noteを削除</button><button data-quantize type="button">1/16 Quantize</button><button data-apply-analyzer class="primary-button" type="button">編集MIDIをAnalyzerへ反映</button></div>
    <hr>
    <div class="controls-row">
      <label class="field"><span>Source Key</span><input data-source-key value="C major" placeholder="E major"></label>
      <label class="field"><span>Target Key</span><input data-target-key value="D major" placeholder="C major"></label>
      <label class="field"><span>Mode</span><select data-transpose-mode><option value="degree">Degree Preserve</option><option value="chromatic">Chromatic Key Shift</option></select></label>
    </div>
    <div class="button-row"><button data-transpose type="button">Target Keyへ変更</button><button data-12keys type="button">12 Key MIDIを生成</button></div>
    <p data-tools-status class="storage-status" aria-live="polite"></p>
  </section>`;
  const select=root.querySelector('[data-note-select]'); const pitch=root.querySelector('[data-note-pitch]'); const start=root.querySelector('[data-note-start]'); const length=root.querySelector('[data-note-length]'); const status=root.querySelector('[data-tools-status]');
  const load=()=>{const n=state.notes[Number(select.value)||0]; if(!n)return; pitch.value=n.pitchMidi; start.value=n.startTimeSeconds.toFixed(3); length.value=n.durationSeconds.toFixed(3);}; select.addEventListener('change',load); load();
  root.querySelector('[data-note-apply]').onclick=()=>{const i=Number(select.value)||0; if(!state.notes[i])return; state.notes[i]={...state.notes[i],pitchMidi:clamp(Number(pitch.value)||0,0,127),startTimeSeconds:Math.max(0,Number(start.value)||0),durationSeconds:Math.max(.01,Number(length.value)||.01)}; status.textContent='Noteを更新しました。'; render();};
  root.querySelector('[data-note-delete]').onclick=()=>{const i=Number(select.value)||0; state.notes.splice(i,1); status.textContent='Noteを削除しました。'; render();};
  root.querySelector('[data-quantize]').onclick=()=>{state.notes=quantize(state.notes,16); status.textContent='1/16へQuantizeしました。'; render();};
  root.querySelector('[data-apply-analyzer]').onclick=()=>{status.textContent=sendToAnalyzer(state.notes)?'編集MIDIを既存Analyzerへ渡しました。':'このブラウザでは自動受け渡しできません。';};
  root.querySelector('[data-transpose]').onclick=()=>{try{const source=root.querySelector('[data-source-key]').value;const target=root.querySelector('[data-target-key]').value;const mode=root.querySelector('[data-transpose-mode]').value;state.notes=mode==='degree'?transposeNotesDegreePreserve(state.notes,source,target):(()=>{const variants=generate12KeyVariants(state.notes,source,'chromatic');return variants.find(v=>v.key.toLowerCase()===target.trim().toLowerCase())?.notes||state.notes;})();status.textContent=`${target}へ移調しました。`;render();}catch(error){status.textContent=error.message;status.dataset.tone='error';}};
  root.querySelector('[data-12keys]').onclick=()=>{try{const source=root.querySelector('[data-source-key]').value;const mode=root.querySelector('[data-transpose-mode]').value;const variants=generate12KeyVariants(state.notes,source,mode);variants.forEach((variant,index)=>setTimeout(()=>download(makeMidi(variant.notes,variant.key.replace(/\s+/g,'_'))),index*120));status.textContent='12 Key MIDIの保存を開始しました。ブラウザが複数ダウンロードの許可を求める場合があります。';}catch(error){status.textContent=error.message;status.dataset.tone='error';}};
}

window.addEventListener('basic-pitch-notes-ready',(event)=>{
  const detail=event.detail||{};
  state={notes:(detail.notes||[]).map(n=>({...n})),bpm:clamp(Number(detail.bpm)||120,20,300),fileName:detail.fileName||'audio'};
  render();
});
