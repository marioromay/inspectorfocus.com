import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
const senderCode=await readFile(new URL('../processing.js',import.meta.url),'utf8'),receiverCode=await readFile(new URL('../save-file.js',import.meta.url),'utf8');
function nodes(){const map=new Map();const get=id=>{if(!map.has(id))map.set(id,{hidden:false,disabled:false,textContent:'',querySelector:get,setAttribute(){},removeAttribute(){},addEventListener(){},showModal(){this.open=true;},close(){this.open=false;}});return map.get(id);};return {map,get};}
function timers(){let id=0;const calls=new Map();return {calls,set:(fn)=>{calls.set(++id,fn);return id;},clear:id=>calls.delete(id)};}
test('embedded download transfers the exact Blob into a top-level page and saves it on a fresh click',async()=>{
 const origin='https://example.test',token='test-ticket',senderNodes=nodes(),receiverNodes=nodes(),aEvents=new Map(),bEvents=new Map(),aTimers=timers(),bTimers=timers(),written=[],opened=[],blobs=new Map();
 let source,tab;
 const aWindow={top:{},location:{origin},crypto:{randomUUID:()=>token},addEventListener:(k,f)=>aEvents.set(k,f),removeEventListener:k=>aEvents.delete(k),open:(url,target)=>{opened.push([url,target]);return tab;}};
 const bWindow={addEventListener:(k,f)=>bEvents.set(k,f),removeEventListener:k=>bEvents.delete(k),showSaveFilePicker:options=>{written.push(options.suggestedName);return Promise.resolve({createWritable:async()=>({write:async blob=>written.push(blob),close:async()=>written.push('closed')})});}};
 source={postMessage:data=>aEvents.get('message')?.({origin,source:tab,data})};tab={postMessage:data=>bEvents.get('message')?.({origin,source,data})};
 const sender={window:aWindow,document:{createElement:()=>senderNodes.get('dialog'),body:{append(){}},activeElement:null},setTimeout:aTimers.set,clearTimeout:aTimers.clear,setInterval:aTimers.set,clearInterval:aTimers.clear};
 const receiver={window:bWindow,document:{getElementById:receiverNodes.get},location:{hash:'#'+token,origin,pathname:'/save-file.html'},history:{replaceState(){}},Blob,URL:{createObjectURL:blob=>{blobs.set('blob:child',blob);return 'blob:child';},revokeObjectURL(){}},setTimeout:bTimers.set,clearTimeout:bTimers.clear};
 vm.runInNewContext(senderCode,sender);vm.runInNewContext(receiverCode,receiver);
 const blob=new Blob([new Uint8Array([80,75,3,4,9,7])],{type:'application/zip'}),messages=[];let prevented=false;
 const result=aWindow.processingProgress.saveFile({preventDefault(){prevented=true;}},{blob,href:'blob:parent',name:'inspector-focus-photo-viewer.zip'},s=>messages.push(s));
 assert.equal(result,false);assert.ok(prevented);assert.deepEqual(opened,[['/save-file.html#test-ticket','_blank']]);
 for(const fn of [...aTimers.calls.values()]){fn();break;}await new Promise(r=>setImmediate(r));
 assert.equal(blobs.get('blob:child'),blob);assert.equal(receiverNodes.get('browser-download').download,'inspector-focus-photo-viewer.zip');assert.equal(receiverNodes.get('save').disabled,false);assert.equal(receiverNodes.get('instructions').hidden,false);assert.equal(aTimers.calls.size,0);
 receiverNodes.get('save').onclick();assert.deepEqual(written,['inspector-focus-photo-viewer.zip']);await new Promise(r=>setImmediate(r));assert.equal(written[1],blob);assert.equal(written[2],'closed');assert.match(receiverNodes.get('save-status').textContent,/Saved/);
});
test('save receiver rejects wrong origin, token, source and malformed payloads',()=>{
 const n=nodes(),events=new Map(),t=timers(),origin='https://example.test';let urls=0;const source={postMessage(){}};
 vm.runInNewContext(receiverCode,{window:{addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k)},document:{getElementById:n.get},location:{hash:'#ticket',origin,pathname:'/save-file.html'},history:{replaceState(){}},Blob,URL:{createObjectURL(){urls++;return 'blob:child';}},setTimeout:t.set,clearTimeout:t.clear});
 const deliver=(data,extra={})=>events.get('message')?.({origin,source,data,...extra});
 deliver({type:'inspector-save-connect',token:'ticket'});const blob=new Blob(['secret']);
 for(const extra of [{origin:'https://other.test'},{source:{} }])deliver({type:'inspector-save-file',token:'ticket',name:'a.zip',blob},extra);
 deliver({type:'inspector-save-file',token:'wrong',name:'a.zip',blob});deliver({type:'inspector-save-file',token:'ticket',name:'a.zip',blob:'bad'});assert.equal(urls,0);
 deliver({type:'inspector-save-file',token:'ticket',name:'a.zip',blob});assert.equal(urls,1);assert.equal(n.get('instructions').hidden,true);
});
