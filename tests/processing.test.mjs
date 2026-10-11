import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';
const nodes=new Map();function node(){return {hidden:false,disabled:false,attrs:{},textContent:'',setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,fn){this[k]=fn;},querySelector(k){if(!nodes.has(k))nodes.set(k,node());return nodes.get(k);},showModal(){this.open=true;},close(){this.open=false;}};}
let popup,focusRestored=0;const context={window:{addEventListener(){}},document:{activeElement:{focus(){focusRestored++;}},body:{append(){}},createElement(){popup=node();return popup;}},requestAnimationFrame:fn=>fn(),setTimeout:fn=>fn()};vm.runInNewContext(await readFile(new URL('../processing.js',import.meta.url),'utf8'),context);const progress=context.window.processingProgress;
test('progress popup shows real counts and restores focus on completion',()=>{const id=progress.start({title:'Creating PDF',detail:'Page one',total:3});assert.equal(popup.open,true);assert.equal(nodes.get('h2').textContent,'Creating PDF');progress.update(id,'Page two',2,3);assert.equal(nodes.get('progress').value,2);assert.equal(nodes.get('.processing-count').textContent,'2 / 3');progress.finish(id);assert.equal(popup.open,false);assert.equal(focusRestored,1);});
test('completion from an old operation cannot close a newer popup',()=>{const old=progress.start({title:'Old'}),current=progress.start({title:'New'});progress.finish(old);assert.equal(popup.open,true);progress.update(old,'Stale',1,2);assert.equal(nodes.get('h2').textContent,'New');progress.finish(current);assert.equal(popup.open,false);});
test('cancel invokes the processing action once and reset closes the popup',()=>{let cancellations=0;progress.start({cancel:()=>cancellations++,cancelLabel:'Stop'});assert.equal(nodes.get('button').hidden,false);nodes.get('button').onclick();nodes.get('button').onclick();assert.equal(cancellations,1);assert.equal(nodes.get('button').disabled,true);progress.reset();assert.equal(popup.open,false);});
test('completed exports keep a real download link visible after finish, with next steps and preview',()=>{const id=progress.start({title:'Creating viewer'});progress.complete(id,{title:'Your offline viewer is ready',detail:'Download, extract, open index.htm.',download:{href:'blob:zip',name:'viewer.zip',label:'Download viewer ZIP'},preview:{href:'blob:preview'}});progress.finish(id);assert.equal(popup.open,true);assert.equal(nodes.get('.processing-download').href,'blob:zip');assert.equal(nodes.get('.processing-download').download,'viewer.zip');assert.equal(nodes.get('.processing-download').hidden,false);assert.equal(nodes.get('.processing-preview').href,'blob:preview');assert.equal(nodes.get('button').hidden,true);assert.equal(nodes.get('progress').hidden,true);assert.equal(nodes.get('.processing-download').onclick(),undefined);assert.match(nodes.get('#processing-detail').textContent,/index.htm/);nodes.get('.processing-close').onclick();assert.equal(popup.open,false);});
test('stale completion is ignored, invalidation closes ready popup, read-only tools offer results',()=>{const old=progress.start(),id=progress.start();progress.complete(old,{download:{href:'blob:old'}});assert.equal(nodes.get('.processing-download').hidden,true);progress.complete(id,{title:'Print estimates ready'});assert.equal(nodes.get('.processing-download').hidden,true);assert.equal(nodes.get('.processing-close').textContent,'View results');progress.finish(id);assert.equal(popup.open,true);progress.clearReady();assert.equal(popup.open,false);progress.ready({download:{href:'blob:new',name:'new.pdf'}});assert.equal(popup.open,true);progress.reset();assert.equal(popup.open,false);});


test('save opens the picker in the click, writes the actual ZIP, and only then reports saved',async()=>{
 const events=[],blob=new Blob(['ZIP bytes']);let resolvePicker;
 context.window.showSaveFilePicker=options=>{events.push(options.suggestedName);return new Promise(r=>resolvePicker=r);};
 let prevented=false;const messages=[];
 assert.equal(progress.saveFile({preventDefault(){prevented=true;}},{href:'blob:zip',blob,name:'viewer.zip'},m=>messages.push(m)),false);
 assert.ok(prevented);assert.deepEqual(events,['viewer.zip']);assert.equal(messages.length,0);
 resolvePicker({createWritable:async()=>({write:async value=>{assert.equal(value,blob);events.push('write');},close:async()=>events.push('close')})});
 await new Promise(r=>setImmediate(r));assert.deepEqual(events,['viewer.zip','write','close']);assert.equal(messages.at(-1),'Saved viewer.zip.');
 delete context.window.showSaveFilePicker;
});
test('cancelled or failed saves are reported and retain a browser download fallback',async()=>{
 for(const name of ['AbortError','SecurityError']){
  context.window.showSaveFilePicker=()=>Promise.reject(Object.assign(new Error('Blocked'),{name}));
  const id=progress.start();progress.complete(id,{download:{href:'blob:ready',name:'ready.zip'}});
  assert.equal(nodes.get('.processing-browser-download').hidden,false);assert.equal(nodes.get('.processing-browser-download').href,'blob:ready');
  nodes.get('.processing-download').onclick({preventDefault(){}});await new Promise(r=>setImmediate(r));
  assert.match(nodes.get('#processing-detail').textContent,name==='AbortError'?/Save cancelled/:/Could not save/);assert.ok(!nodes.get('.processing-download').hidden);progress.reset();
 }
 delete context.window.showSaveFilePicker;
 let prevented=false;assert.equal(progress.saveFile({preventDefault(){prevented=true;}},{name:'ready.zip'}),undefined);assert.equal(prevented,false);
});
