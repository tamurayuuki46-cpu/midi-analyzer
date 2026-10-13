import assert from 'node:assert/strict';
import test from 'node:test';
import { indexedDB } from 'fake-indexeddb';
import { getStem, listStemMetadata, saveStemFile, stemToReferenceMetadata, updateStemStatus } from '../src/storage/stemStore.js';

globalThis.indexedDB=indexedDB;
if(!globalThis.crypto)globalThis.crypto={randomUUID:()=>`test-${Date.now()}`};

test('stem store keeps Blob separately and exposes metadata-only reference',async()=>{
 const file=new Blob(['audio-bytes'],{type:'audio/wav'});Object.defineProperty(file,'name',{value:'bass.wav'});
 const saved=await saveStemFile(file,{type:'bass',name:'Bass Stem',duration:12.5});
 assert.equal(saved.type,'bass');
 assert.equal(saved.blob,undefined);
 const list=await listStemMetadata();
 const item=list.find(entry=>entry.id===saved.id);
 assert.ok(item);
 assert.equal(item.blob,undefined);
 const full=await getStem(saved.id);
 assert.ok(full.blob instanceof Blob);
 const reference=stemToReferenceMetadata(item);
 assert.equal(reference.type,'stem');
 assert.equal(reference.storage.kind,'indexeddb');
 assert.equal('blob' in reference,false);
});

test('stem conversion status updates preserve the stored Blob',async()=>{
 const file=new Blob(['more-audio'],{type:'audio/wav'});Object.defineProperty(file,'name',{value:'vocal.wav'});
 const saved=await saveStemFile(file,{type:'vocal',name:'Vocal Stem'});
 const updated=await updateStemStatus(saved.id,{conversionStatus:'converted',analysisStatus:'midi-generated'});
 assert.equal(updated.conversionStatus,'converted');
 assert.equal(updated.analysisStatus,'midi-generated');
 assert.equal(updated.blob,undefined);
 const full=await getStem(saved.id);
 assert.ok(full.blob instanceof Blob);
 assert.equal(await full.blob.text(),'more-audio');
});
