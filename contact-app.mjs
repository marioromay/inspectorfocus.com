import {captureDate,orderPhotos,movePhoto} from './photo-order.mjs?v=c605cf6d369d';
import {helveticaText} from './helvetica.mjs?v=c130e049416f';
import {loadPhotograph} from './image-loader.mjs?v=306513868313';
import {drawContactPage} from './contact-renderer.mjs?v=aba6ed775478';
import {layoutSheet,fitImage,sortPhotos,makePDF} from './contact-engine.mjs?v=727c9defb781';
const $=id=>document.getElementById(id),controls=['paper','orientation','columns','order','labels','numbers','shoot-title'];
let decoder=null;
let selectionIndex=0,organizing=false,mobileView="organize",dragFrom=null,dragTarget=null;
let photos=[],page=0,epoch=0,previewEpoch=0,busy=false,pdfURL=null;
const settings=()=>({paper:$('paper').value,orientation:$('orientation').value,columns:Number($('columns').value),labels:$('labels').checked,numbers:$('numbers').checked,title:$('shoot-title').value});
const message=(text,error=false)=>{$('message').textContent=text;$('message').classList.toggle('error',error);};
const yieldUI=()=>new Promise(r=>setTimeout(r,0));
function invalidate(){if(pdfURL)URL.revokeObjectURL(pdfURL);pdfURL=null;$('download').hidden=true;$('download').removeAttribute('href');}
function editorView(){
 const active=organizing&&photos.length>0;
 $('dropzone').classList.toggle('organizing',active);$('contact-editor').classList.toggle('is-organizing',active);$('contact-editor').classList.toggle('mobile-preview',active&&mobileView==='preview');
 $('sheet-controls').hidden=active;$('organizer-panel').hidden=!active;$('organize').hidden=active;$('done-organizing').hidden=!active;$('organizing-tabs').hidden=!active;
 $('organize').setAttribute('aria-expanded',String(active));$('organizer-tab').setAttribute('aria-pressed',String(mobileView==='organize'));$('preview-tab').setAttribute('aria-pressed',String(mobileView==='preview'));$('organizer-order').value=$('order').value;
}
function setOrganizing(value){if(busy||!photos.length)return;organizing=value;mobileView='organize';editorView();}
$('organize').onclick=()=>setOrganizing(true);$('done-organizing').onclick=()=>{setOrganizing(false);$('organize').focus?.();};
$('organizer-tab').onclick=()=>{mobileView='organize';editorView();};$('preview-tab').onclick=()=>{mobileView='preview';editorView();};
$('organizer-order').onchange=()=>{if(busy)return;$('order').value=$('organizer-order').value;invalidate();page=0;void preview();message('Photo order changed. Generate a new PDF when ready.');};
function lock(value){busy=value;for(const id of ['organize','done-organizing','organizer-order','organizer-tab','preview-tab'])$(id).disabled=value;$('clear').disabled=!value&&!photos.length;for(const id of controls)$(id).disabled=value;document.querySelectorAll?.('#organizer button').forEach(b=>b.disabled=value||b.dataset.edge==='true');$('choose').disabled=value;$('add').disabled=value;$('generate').disabled=value||!photos.length;$('previous').disabled=value||page===0;$('next').disabled=value||page>=Math.ceil(photos.length/layoutSheet(settings()).capacity)-1;}
function loadImage(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Image could not be decoded.'));image.src=url;});}
function canvasBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Browser could not encode the page.')),'image/jpeg',.9));}
const drawPage=(...args)=>drawContactPage(...args,loadImage);
function changeOrder(next,focusIndex){if(busy)return;photos=next;dragFrom=dragTarget=null;if(focusIndex!==undefined){const position=photos.findIndex(p=>p.index===focusIndex);if(position>=0)page=Math.floor(position/layoutSheet(settings()).capacity);}$('order').value='manual';invalidate();void preview();message('Photo order changed. Generate a new PDF when ready.');if(focusIndex!==undefined)document.querySelector?.(`[data-photo-index="${focusIndex}"] button`)?.focus();}
function renderOrganizer(ordered){
 const list=$('organizer');if(!list.replaceChildren)return;list.replaceChildren();
 for(const [position,photo] of ordered.entries()){
  const item=document.createElement('li');item.className='organizer-photo';item.dataset.photoIndex=photo.index;item.draggable=!busy;
  const image=document.createElement('img');image.src=photo.url;image.alt='';image.loading='lazy';const label=document.createElement('span');label.textContent=String(position+1).padStart(3,'0')+' · '+photo.name;
  const actions=document.createElement('div');
  for(const [caption,delta] of [['←',-1],['→',1],['Remove',0]]){const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent=caption;button.setAttribute('aria-label',(delta<0?'Move earlier: ':delta>0?'Move later: ':'Remove: ')+photo.name);const edge=delta&&(position+delta<0||position+delta>=ordered.length);button.dataset.edge=String(!!edge);button.disabled=busy||!!edge;button.onclick=()=>{if(busy)return;if(delta)changeOrder(movePhoto(ordered,position,position+delta),photo.index);else{URL.revokeObjectURL(photo.url);changeOrder(ordered.filter(p=>p!==photo));}};actions.append(button);}
  item.ondragstart=e=>{if(busy){e.preventDefault();return;}dragFrom=photo.index;dragTarget=null;e.dataTransfer.setData('application/x-inspector-photo',String(photo.index));e.dataTransfer.effectAllowed='move';};
  item.ondragover=e=>{if(!busy&&dragFrom!==null&&Array.from(e.dataTransfer.types).includes('application/x-inspector-photo')){e.preventDefault();if(dragTarget!==photo.index){dragTarget=photo.index;const from=ordered.findIndex(p=>p.index===dragFrom);if(from>=0){page=Math.floor(position/layoutSheet(settings()).capacity);void preview(movePhoto(ordered,from,position),false);}}}};
  item.ondragend=()=>{dragFrom=dragTarget=null;void preview();};
  item.ondrop=e=>{const raw=e.dataTransfer.getData('application/x-inspector-photo');if(!raw||busy)return;e.preventDefault();e.stopPropagation();const from=ordered.findIndex(p=>p.index===Number(raw));if(from>=0)changeOrder(movePhoto(ordered,from,position),Number(raw));};
  item.append(image,label,actions);list.append(item);
 }
}
async function preview(temporaryOrder=null,rebuildOrganizer=true){
 const version=++previewEpoch,token=epoch,layout=layoutSheet(settings()),ordered=temporaryOrder||orderPhotos(photos,$('order').value),total=Math.ceil(photos.length/layout.capacity);page=Math.max(0,Math.min(page,total-1));$('empty').hidden=!!photos.length;$('loaded').hidden=!photos.length;$('count').textContent=`${photos.length} ${photos.length===1?'photograph':'photographs'}`;$('page-number').textContent=`Page ${page+1} of ${total}`;lock(busy);editorView();if(rebuildOrganizer)renderOrganizer(ordered);if(!photos.length)return;
 const canvas=document.createElement('canvas');try{if(await drawPage(canvas,ordered,page,layout,()=>version===previewEpoch&&token===epoch)){$('page').width=canvas.width;$('page').height=canvas.height;$('page').getContext('2d').drawImage(canvas,0,0);$('page').setAttribute('aria-label',`Contact sheet page ${page+1} of ${total}, ${layout.columns} columns`);}}catch(error){if(token===epoch)message(error.message,true);}finally{canvas.width=canvas.height=1;}
}
async function ingest(files){
 if(busy)return;const token=++epoch;invalidate();lock(true);let skipped=0,added=0;const list=Array.from(files);$('progress').hidden=false;$('progress').max=list.length;$('progress').value=0;
 const task=globalThis.processingProgress?.start({title:'Preparing contact sheet',detail:'Reading photographs…',total:list.length,cancel:clear});try{await globalThis.processingProgress?.paint();
 for(let i=0;i<list.length;i++){
  if(token!==epoch)return;const file=list[i];message(`Reading ${i+1} of ${list.length} photographs…`);globalThis.processingProgress?.update(task,`Reading ${i+1} of ${list.length} photographs…`,i,list.length);let sourceURL=null,canvas=null;
  try{
   if(photos.length>=300)throw Error('Maximum 300 photographs.');decoder=new AbortController();const loaded=await loadPhotograph(file,{signal:decoder.signal});sourceURL=loaded.url;const image=loaded.image;if(token!==epoch)return;
   const fit=fitImage(image.naturalWidth,image.naturalHeight,960,960);canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(fit.width));canvas.height=Math.max(1,Math.round(fit.height));const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);image.src='';
   const blob=await canvasBlob(canvas);if(token!==epoch)return;const capture=await captureDate(file);if(token!==epoch)return;photos.push({name:file.name,capture,index:selectionIndex++,width:canvas.width,height:canvas.height,url:URL.createObjectURL(blob)});added++;
  }catch{skipped++;}finally{if(sourceURL)URL.revokeObjectURL(sourceURL);if(canvas)canvas.width=canvas.height=1;}
  $('progress').value=i+1;globalThis.processingProgress?.update(task,'Photographs prepared',i+1,list.length);await yieldUI();
 }
 if(token!==epoch)return;$('files').value='';$('progress').hidden=true;lock(false);await preview();message(`${added} photographs added.${skipped?` ${skipped} skipped: unsupported, unreadable, over the size limit, or beyond 300 photographs.`:''} ${photos.length?'Review the pages, then generate your PDF.':''}`,!!skipped&&!photos.length);
 }finally{globalThis.processingProgress?.finish(task);}
}
async function generate(){
 if(busy||!photos.length)return;const token=++epoch;previewEpoch++;invalidate();lock(true);const layout=layoutSheet(settings()),ordered=orderPhotos(photos,$('order').value),total=Math.ceil(ordered.length/layout.capacity),pages=[];const canvas=document.createElement('canvas');$('progress').max=total;$('progress').value=0;$('progress').hidden=false;
 const task=globalThis.processingProgress?.start({title:'Creating contact sheet PDF',detail:'Preparing pages…',total,cancel:clear});
 try{await globalThis.processingProgress?.paint();for(let i=0;i<total;i++){
  message(`Creating PDF page ${i+1} of ${total}…`);globalThis.processingProgress?.update(task,`Creating page ${i+1} of ${total}…`,i,total);if(!await drawPage(canvas,ordered,i,{...layout,renderScale:300/72,pdfText:true},()=>token===epoch))return;const blob=await canvasBlob(canvas);const bytes=new Uint8Array(await blob.arrayBuffer());if(token!==epoch)return;pages.push({width:canvas.width,height:canvas.height,bytes,text:canvas.sheetText});globalThis.processingProgress?.update(task,'Pages created',i+1,total);$('progress').value=i+1;await yieldUI();
 }const pdf=makePDF(pages,layout.width,layout.height);if(token!==epoch)return;pdfURL=URL.createObjectURL(pdf);$('download').href=pdfURL;$('download').download=(layout.title?layout.title.replace(/[\x00-\x1f<>:"/\\|?*]/g,'_').slice(0,80)+'-':'inspector-focus-')+'contact-sheet.pdf';$('download').hidden=false;message(`${total} ${total===1?'page':'pages'} ready · ${(pdf.size/1024/1024).toFixed(1)} MB. Download your contact sheet.${[layout.title,...ordered.filter(()=>layout.labelHeight).map(p=>p.name)].some(t=>helveticaText(t)!==t)?' Helvetica replaces unsupported characters with ?.':''}`);
 }catch(error){if(token===epoch)message(`PDF could not be created. ${error.message}`,true);}finally{globalThis.processingProgress?.finish(task);canvas.width=canvas.height=1;if(token===epoch){$('progress').hidden=true;lock(false);}}
}
function clear(){decoder?.abort();globalThis.processingProgress?.reset();epoch++;previewEpoch++;invalidate();for(const photo of photos)URL.revokeObjectURL(photo.url);photos=[];page=0;organizing=false;mobileView='organize';dragFrom=dragTarget=null;$('files').value='';$('progress').hidden=true;lock(false);void preview();message('Choose photographs to create your contact sheet.');}
$('choose').onclick=$('add').onclick=()=>$('files').click();$('files').onchange=()=>ingest($('files').files);$('clear').onclick=clear;$('generate').onclick=()=>generate();
for(const id of controls)$(id).onchange=()=>{invalidate();page=0;void preview();message('Page settings changed. Generate a new PDF when ready.');};
$('previous').onclick=()=>{if(page>0){page--;void preview();}};$('next').onclick=()=>{if(page<Math.ceil(photos.length/layoutSheet(settings()).capacity)-1){page++;void preview();}};
$('dropzone').ondragover=event=>{event.preventDefault();$('empty').classList.add('drag');};$('dropzone').ondragleave=()=>$('empty').classList.remove('drag');$('dropzone').ondrop=event=>{event.preventDefault();$('empty').classList.remove('drag');if(event.dataTransfer.files.length)void ingest(event.dataTransfer.files);};
window.addEventListener('beforeunload',()=>{for(const photo of photos)URL.revokeObjectURL(photo.url);if(pdfURL)URL.revokeObjectURL(pdfURL);});

$('shoot-title').oninput=()=>{invalidate();void preview();message('Title changed. Generate a new PDF when ready.');};
