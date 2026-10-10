globalThis.processingProgress={start:()=>1,update(){},finish(){},paint:async()=>{}};
import test from 'node:test';
import assert from 'node:assert/strict';
// Lightweight DOM harness for batch controls; visual browser QA is separate.
function element(){return {textContent:'',value:'',hidden:true,disabled:false,open:false,style:{},children:[],handlers:{},classList:{toggle(){},add(){},remove(){}},append(...nodes){this.children.push(...nodes);},replaceChildren(...nodes){this.children=nodes;},setAttribute(){},addEventListener(type,fn){this.handlers[type]=fn;},click(){},remove(){}};}
const elements=new Map();
globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,body:element()};
await import('../stats-app.mjs');
const $=id=>document.getElementById(id);
const jpeg=new Uint8Array([255,216,255,192,0,11,8,0,100,0,200,1,1,17,0,255,217]);
const file=(name='photo.jpg')=>({name,type:'image/jpeg',size:jpeg.length,arrayBuffer:async()=>jpeg.buffer});
test('Batch continues after invalid file; clear resets results',async()=>{
  $('files').files=[file(),{name:'broken.jpg',type:'image/jpeg',size:10,arrayBuffer:async()=>new ArrayBuffer(10)}];
  await $('files').onchange();assert.equal($('count').textContent,'1');assert.equal($('skipped').textContent,'1');assert.equal($('no-exif').textContent,'1');assert.equal($('choose').disabled,false);assert.equal($('export').disabled,false);assert.equal($('issues').hidden,false);
  $('clear').onclick();assert.equal($('results').hidden,true);
});
test('Stop during a read excludes unfinished photograph and re-enables controls',async()=>{
  const pending={...file(),arrayBuffer:async()=>{$('cancel').onclick();return jpeg.buffer;}};
  $('files').files=[pending,file()];await $('files').onchange();assert.equal($('count').textContent,'0');assert.equal($('collection-label').textContent,'Partial collection / Stopped');assert.equal($('choose').disabled,false);assert.equal($('export').disabled,true);assert.match($('message').textContent,/Stopped/);
});
test('Oversized collection is rejected before any file read',async()=>{
  $('files').files=Array(2001).fill(file());await $('files').onchange();assert.match($('message').textContent,/up to 2,000/);assert.equal($('count').textContent,'0');
});
