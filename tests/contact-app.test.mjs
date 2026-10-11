import test from 'node:test';import assert from 'node:assert/strict';
const elements=new Map();const ctx={scale(){},fillRect(){},drawImage(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},measureText(text){return {width:text.length*4};}};
function element(){return {dataset:{},children:[],append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;},value:'',checked:true,disabled:false,hidden:true,files:[],classList:{toggle(){},add(){},remove(){}},setAttribute(){},removeAttribute(key){delete this[key];},click(){},getContext(){return ctx;}};}
let pause=false,pending;
globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement(){return {...element(),width:0,height:0,getContext(){return ctx;},toBlob(cb){if(pause)pending=cb;else cb(new Blob([new Uint8Array([255,216,255,217])],{type:'image/jpeg'}));}};}};
globalThis.window={addEventListener(){}};let progressSerial=0;const activeTasks=new Set(),updates=[];globalThis.processingProgress={start(options){const id=++progressSerial;activeTasks.add(id);return id;},update(...args){updates.push(args);},finish(id){activeTasks.delete(id);},reset(){activeTasks.clear();},paint:async()=>{}};globalThis.Image=class{naturalWidth=2400;naturalHeight=1600;set src(value){if(value)queueMicrotask(()=>this.onload());}};
let serial=0;const revoked=[];globalThis.URL={createObjectURL(){return `blob:test-${++serial}`;},revokeObjectURL(url){revoked.push(url);}};
const $=id=>document.getElementById(id);$('paper').value='letter';$('orientation').value='portrait';$('columns').value='4';$('order').value='filename';
await import('../contact-app.mjs');
const photo={name:'frame1.jpg',type:'image/jpeg',size:1000,slice(){return {arrayBuffer:async()=>new Uint8Array([255,216]).buffer};}};
test('batch skips unsupported files, produces a PDF, invalidates download on settings change',async()=>{$('files').files=[photo,{name:'bad.raw',type:'',size:1000}];await $('files').onchange();assert.equal($('count').textContent,'1 photograph');assert.match($('message').textContent,/1 skipped/);await $('generate').onclick();assert.equal($('download').hidden,false);assert.equal($('download').download,'inspector-focus-contact-sheet.pdf');assert.equal(activeTasks.size,0);assert.ok(updates.some(row=>row[1]==='Pages created'));assert.match($('message').textContent,/ready/);const url=$('download').href;$('labels').checked=false;$('labels').onchange();assert.equal($('download').hidden,true);assert.ok(revoked.includes(url));});
test('clear while loading prevents old images from reappearing',async()=>{$('clear').onclick();pause=true;$('files').files=[photo];const reading=$('files').onchange();await new Promise(r=>setImmediate(r));assert.ok(pending);$('clear').onclick();pending(new Blob(['jpeg']));await reading;pause=false;assert.equal($('loaded').hidden,true);assert.equal($('generate').disabled,true);assert.equal($('progress').hidden,true);});
test('clear during PDF encoding prevents stale download',async()=>{$('files').files=[photo];await $('files').onchange();pause=true;const generating=$('generate').onclick();await new Promise(r=>setImmediate(r));$('clear').onclick();pending(new Blob(['jpeg']));await generating;pause=false;assert.equal($('download').hidden,true);assert.equal($('generate').disabled,true);assert.equal(activeTasks.size,0);});
test('editing shoot title invalidates the PDF and uses a safe export filename',async()=>{
 $('files').files=[photo];await $('files').onchange();$('shoot-title').value='October / Humboldt Park';$('shoot-title').oninput();await new Promise(r=>setImmediate(r));await $('generate').onclick();assert.equal($('download').download,'October _ Humboldt Park-contact-sheet.pdf');assert.equal($('download').hidden,false);$('shoot-title').value='Another shoot';$('shoot-title').oninput();assert.equal($('download').hidden,true);
});

test('manual ordering, removal and selection-order recovery invalidate the PDF',async()=>{
 $('clear').onclick();$('order').value='added';$('files').files=[{...photo,name:'first.jpg'},{...photo,name:'second.jpg'},{...photo,name:'third.jpg'}];await $('files').onchange();await $('generate').onclick();assert.equal($('download').hidden,false);
 const list=$('organizer');assert.equal(list.children.length,3);list.children[0].children[2].children[1].onclick();assert.equal($('order').value,'manual');assert.equal($('download').hidden,true);assert.match(list.children[0].children[1].textContent,/second.jpg/);
 $('order').value='added';$('order').onchange();assert.match(list.children[0].children[1].textContent,/first.jpg/);
 list.children[1].children[2].children[2].onclick();assert.equal(list.children.length,2);assert.equal($('count').textContent,'2 photographs');assert.ok(!list.children.some(row=>row.children[1].textContent.includes('second.jpg')));
});
test('preview-first editor opens side-by-side organization and preserves order and settings on Done',async()=>{
 $('clear').onclick();$('order').value='added';$('columns').value='4';$('shoot-title').value='My shoot';$('files').files=[{...photo,name:'one.jpg'},{...photo,name:'two.jpg'}];await $('files').onchange();
 assert.equal($('organizer-panel').hidden,true);assert.equal($('sheet-controls').hidden,false);assert.equal($('organize').hidden,false);
 $('organize').onclick();assert.equal($('organizer-panel').hidden,false);assert.equal($('sheet-controls').hidden,true);assert.equal($('done-organizing').hidden,false);
 $('preview-tab').onclick();$('organizer-tab').onclick();
 $('organizer').children[0].children[2].children[1].onclick();assert.match($('organizer').children[0].children[1].textContent,/two.jpg/);
 $('done-organizing').onclick();assert.equal($('organizer-panel').hidden,true);assert.equal($('sheet-controls').hidden,false);assert.equal($('shoot-title').value,'My shoot');assert.equal($('columns').value,'4');assert.equal($('order').value,'manual');
 $('organize').onclick();assert.match($('organizer').children[0].children[1].textContent,/two.jpg/);$('clear').onclick();assert.equal($('organizer-panel').hidden,true);
});
test('drag hover previews proposed order without committing; drop commits and invalidates PDF',async()=>{
 $('order').value='added';$('files').files=[{...photo,name:'left.jpg'},{...photo,name:'right.jpg'}];await $('files').onchange();await $('generate').onclick();$('organize').onclick();
 const original=$('organizer').children.slice(),data=new Map(),transfer={types:['application/x-inspector-photo'],setData(k,v){data.set(k,v);},getData(k){return data.get(k)||'';}};
 const event={dataTransfer:transfer,preventDefault(){},stopPropagation(){}};
 original[0].ondragstart(event);original[1].ondragover(event);await new Promise(r=>setImmediate(r));
 assert.equal($('organizer').children[0],original[0]);assert.equal($('order').value,'added');assert.equal($('download').hidden,false);
 original[1].ondrop(event);await new Promise(r=>setImmediate(r));assert.match($('organizer').children[0].children[1].textContent,/right.jpg/);assert.equal($('order').value,'manual');assert.equal($('download').hidden,true);
 $('organizer-order').value='added';$('organizer-order').onchange();assert.match($('organizer').children[0].children[1].textContent,/left.jpg/);$('clear').onclick();
});
test('contact page has separate organizing and preview regions with real controls',async()=>{
 const {readFile}=await import('node:fs/promises');const {URL:FileURL}=await import('node:url');const html=await readFile(new FileURL('../contact-sheet/index.html',import.meta.url),'utf8');
 for(const id of ['sheet-controls','organize','done-organizing','organizing-tabs','organizer-tab','preview-tab','contact-editor','organizer-panel','sheet-preview-panel','organizer-order'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(!html.includes('<details class="photo-organizer"'));
});
