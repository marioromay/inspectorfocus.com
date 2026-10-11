(() => {
 let serial=0,current=null,previousFocus=null;
 const popup=document.createElement('dialog');popup.className='processing-popup';popup.setAttribute('aria-labelledby','processing-title');popup.setAttribute('aria-describedby','processing-detail');
 popup.innerHTML='<div class="processing-heading"><span class="processing-mascot" aria-hidden="true"><img src="/brand/inspector-focus.png" alt="" width="88" height="88"></span><h2 id="processing-title">Processing</h2></div><p id="processing-detail" role="status" aria-live="polite"></p><progress aria-label="Processing progress"></progress><p class="processing-count" aria-live="off"></p><p class="processing-local">Working on your device. Your photographs stay local.</p><button class="secondary" type="button" hidden>Cancel</button><a class="processing-download download-button" hidden>Download</a><a class="processing-browser-download secondary" hidden>Use browser download ↘</a><a class="processing-preview secondary" target="_blank" rel="noopener" hidden>Open preview ↗</a><button class="processing-close secondary" type="button" hidden>Back to tool</button>';
 document.body.append(popup);const title=popup.querySelector('h2'),detail=popup.querySelector('#processing-detail'),bar=popup.querySelector('progress'),count=popup.querySelector('.processing-count'),button=popup.querySelector('button'),download=popup.querySelector('.processing-download'),fallback=popup.querySelector('.processing-browser-download'),preview=popup.querySelector('.processing-preview'),close=popup.querySelector('.processing-close');
 function cancel(){if(!current?.cancel)return;const action=current.cancel;current.cancel=null;button.disabled=true;detail.textContent='Stopping…';action();}
 button.onclick=cancel;popup.addEventListener('cancel',e=>{e.preventDefault();if(current?.completed)dismiss();else cancel();});
 function update(id,text,done,total){if(current?.id!==id)return;detail.textContent=text;if(Number.isFinite(total)&&total>0){bar.max=total;bar.value=Math.min(total,Math.max(0,done||0));count.textContent=(done||0)+' / '+total;}else{bar.removeAttribute('value');count.textContent='';}}
 function dismiss(){current=null;if(popup.open)popup.close();previousFocus?.focus?.();previousFocus=null;}
 close.onclick=dismiss;
 // Transfer bytes to a top-level save page; no cross-tab blob URL fetch is required.
 function openSavePage(event,output,report=()=>{}){
  event?.preventDefault?.();
  const token=window.crypto.randomUUID(),origin=window.location.origin;
  let tab;try{tab=window.open('/save-file.html#'+token,'_blank');}catch(error){report('Could not open the download tab: '+error.message);return false;}
  if(!tab){report('Your browser blocked the download tab. Allow this tab to open, then choose Download again.');return false;}
  let disposed=false,receiving=false;
  const cleanup=()=>{disposed=true;window.removeEventListener('message',ready);clearTimeout(timeout);clearInterval(probe);};
  const bytes=output.blob?Promise.resolve(output.blob):fetch(output.href).then(r=>{if(!r.ok)throw Error('Generated file could not be read.');return r.blob();});
  // Attach the rejection handler immediately, even if the child tab has not loaded yet.
  const payload=bytes.then(blob=>({blob}),error=>({error}));
  const ready=async e=>{
   if(disposed||receiving||e.origin!==origin||e.source!==tab||e.data?.type!=='inspector-save-ready'||e.data.token!==token)return;
   receiving=true;const result=await payload;if(disposed)return;
   if(result.error){tab.postMessage({type:'inspector-save-error',token,message:result.error.message},origin);report('Could not prepare download: '+result.error.message);}
   else{tab.postMessage({type:'inspector-save-file',token,blob:result.blob,name:output.name},origin);report('Your file is ready in the download tab. Choose Save file there.');}
   cleanup();
  };
  window.addEventListener('message',ready);
  const probe=setInterval(()=>{try{tab.postMessage({type:'inspector-save-connect',token},origin);}catch{}},250);
  const timeout=setTimeout(()=>{cleanup();report('The download tab did not connect. Keep the tool open and try Download again.');},60000);
  report('Opening the download tab…');return false;
 }
 // Call the picker within the click itself, before fetching or writing the generated blob.
 function saveFile(event,output,report=()=>{}){
  if(window.top&&window.top!==window)return openSavePage(event,output,report);
  if(typeof window.showSaveFilePicker!=='function'){report('Use your browser’s downloads to find '+output.name+'.');return;}
  event?.preventDefault?.();
  let picker;
  try{picker=window.showSaveFilePicker({suggestedName:output.name});}catch(error){report('Save dialog unavailable: '+error.message+'. Choose Open download tab below.');return false;}
  void (async()=>{let writer;try{
   const handle=await picker;report('Saving '+output.name+'…');
   const blob=output.blob||await (await fetch(output.href)).blob();
   writer=await handle.createWritable();await writer.write(blob);await writer.close();writer=null;
   report('Saved '+output.name+'.');
  }catch(error){if(writer)await writer.abort?.().catch(()=>{});report(error.name==='AbortError'?'Save cancelled. Choose Download to try again.':'Could not save: '+error.message+'. Choose Open download tab below.');}})();
  return false;
 }
 function complete(id,{title:heading='Your file is ready',detail:text='Download your file, then return to the tool.',download:output,preview:viewer}={}){if(current?.id!==id)return;current.completed=true;current.cancel=null;title.textContent=heading;detail.textContent=text;bar.hidden=count.hidden=button.hidden=true;close.hidden=false;close.textContent=output?'Back to tool':'View results';download.hidden=!output;fallback.hidden=!output;preview.hidden=!viewer;if(output){download.href=output.href;download.download=output.name;download.textContent=output.label||'Download '+output.name;fallback.href=output.href;fallback.download=output.name;fallback.textContent='Open download tab ↗';fallback.onclick=e=>openSavePage(e,output,message=>{if(current?.id===id)detail.textContent=text+' '+message;});download.onclick=e=>saveFile(e,output,message=>{if(current?.id===id)detail.textContent=text+' '+message;});download.focus?.();}if(viewer){preview.href=viewer.href;preview.textContent=viewer.label||'Open preview ↗';}}
 function finish(id){if(current?.id!==id||current.completed)return;current=null;if(popup.open)popup.close();previousFocus?.focus?.();previousFocus=null;}
 window.processingProgress={saveFile,openSavePage,start({title:heading='Processing',detail:text='Working locally…',total,cancel:action,cancelLabel='Cancel'}={}){const id=++serial;current={id,cancel:action};download.hidden=fallback.hidden=preview.hidden=close.hidden=true;download.removeAttribute('href');preview.removeAttribute('href');bar.hidden=count.hidden=false;title.textContent=heading;button.hidden=!action;button.disabled=false;button.textContent=cancelLabel;update(id,text,0,total);if(!popup.open){previousFocus=document.activeElement;popup.showModal();}return id;},update,complete,ready(options){const id=this.start();complete(id,options);return id;},clearReady(){if(current?.completed)dismiss();},finish,reset(){dismiss();},paint:()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)))};
 window.addEventListener('pagehide',()=>window.processingProgress.reset());
})();
