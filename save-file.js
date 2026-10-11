(() => {
 const token=location.hash.slice(1),origin=location.origin,$=id=>document.getElementById(id);
 let source=null,blob=null,url=null,name='',received=false;
 const status=text=>{$('save-status').textContent=text;};
 const timeout=setTimeout(()=>{if(!received)status('No file arrived. Return to the tool and choose Open download tab again.');},60000);
 const message=e=>{
  if(e.origin!==origin||!token||e.data?.token!==token)return;
  if(e.data.type==='inspector-save-connect'&&!received){source=e.source;source?.postMessage({type:'inspector-save-ready',token},origin);return;}
  if(!source||e.source!==source||received)return;
  if(e.data.type==='inspector-save-error'){received=true;clearTimeout(timeout);status('Could not prepare file: '+e.data.message);window.removeEventListener('message',message);return;}
  if(e.data.type!=='inspector-save-file'||!(e.data.blob instanceof Blob)||typeof e.data.name!=='string')return;
  received=true;clearTimeout(timeout);blob=e.data.blob;name=e.data.name;url=URL.createObjectURL(blob);
  $('file-name').textContent=name+' · '+(blob.size/1024/1024).toFixed(1)+' MB';
  $('browser-download').href=url;$('browser-download').download=name;$('browser-download').hidden=false;
  $('instructions').hidden=name!=='inspector-focus-photo-viewer.zip';$('save').disabled=false;
  if(typeof window.showSaveFilePicker!=='function'){$('save').hidden=true;$('browser-download').className='download';}
  status('Ready. Choose Save file or Browser download.');
  history.replaceState(null,'',location.pathname);window.removeEventListener('message',message);window.opener=null;source=null;
 };
 window.addEventListener('message',message);
 $('save').onclick=()=>{
  if(!blob||$('save').disabled)return;
  let picker;try{picker=window.showSaveFilePicker({suggestedName:name});}catch(error){status('Save unavailable: '+error.message+'. Choose Browser download.');return;}
  $('save').disabled=true;
  void (async()=>{let writer;try{const handle=await picker;status('Saving…');writer=await handle.createWritable();await writer.write(blob);await writer.close();writer=null;status('Saved '+name+'.');}catch(error){if(writer)await writer.abort?.().catch(()=>{});status(error.name==='AbortError'?'Save cancelled. You can try again.':'Could not save: '+error.message+'. Choose Browser download.');}finally{$('save').disabled=false;}})();
 };
 $('browser-download').onclick=()=>status('Check your browser’s downloads for '+name+'.');
 window.addEventListener('pagehide',()=>{clearTimeout(timeout);if(url)URL.revokeObjectURL(url);});
})();
