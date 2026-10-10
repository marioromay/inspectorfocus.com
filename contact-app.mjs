import {layoutSheet,fitImage,sortPhotos,makePDF} from './contact-engine.mjs';
const $=id=>document.getElementById(id),controls=['paper','orientation','columns','order','labels'];
let photos=[],page=0,epoch=0,previewEpoch=0,busy=false,pdfURL=null;
const settings=()=>({paper:$('paper').value,orientation:$('orientation').value,columns:Number($('columns').value),labels:$('labels').checked});
const message=(text,error=false)=>{$('message').textContent=text;$('message').classList.toggle('error',error);};
const yieldUI=()=>new Promise(r=>setTimeout(r,0));
function invalidate(){if(pdfURL)URL.revokeObjectURL(pdfURL);pdfURL=null;$('download').hidden=true;$('download').removeAttribute('href');}
function lock(value){busy=value;$('clear').disabled=!value&&!photos.length;for(const id of controls)$(id).disabled=value;$('choose').disabled=value;$('add').disabled=value;$('generate').disabled=value||!photos.length;$('previous').disabled=value||page===0;$('next').disabled=value||page>=Math.ceil(photos.length/layoutSheet(settings()).capacity)-1;}
function loadImage(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Image could not be decoded.'));image.src=url;});}
function canvasBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Browser could not encode the page.')),'image/jpeg',.9));}
function shortLabel(ctx,text,width){text=text.replace(/[\x00-\x1f\x7f]/g,' ');if(ctx.measureText(text).width<=width)return text;let end=text.length;while(end>0&&ctx.measureText(text.slice(0,end)+'…').width>width)end--;return text.slice(0,end)+'…';}
async function drawPage(target,ordered,index,layout,active){
 const scale=2;target.width=Math.round(layout.width*scale);target.height=Math.round(layout.height*scale);const ctx=target.getContext('2d',{alpha:false});ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,layout.width,layout.height);ctx.fillStyle='#111';ctx.font='bold 10px Helvetica, Arial, sans-serif';ctx.fillText('INSPECTOR FOCUS / CONTACT SHEET',layout.margin,26);ctx.strokeStyle='#ccc';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(layout.margin,34);ctx.lineTo(layout.width-layout.margin,34);ctx.stroke();
 const start=index*layout.capacity;
 for(let i=0;i<layout.capacity&&start+i<ordered.length;i++){
   if(!active())return false;const photo=ordered[start+i],image=await loadImage(photo.url);if(!active())return false;
   const x=layout.margin+(i%layout.columns)*(layout.cellWidth+layout.gap),y=layout.top+Math.floor(i/layout.columns)*(layout.cellHeight+layout.gap),boxHeight=layout.cellHeight-layout.labelHeight;
   const fit=fitImage(photo.width,photo.height,layout.cellWidth,boxHeight);ctx.drawImage(image,x+(layout.cellWidth-fit.width)/2,y+(boxHeight-fit.height)/2,fit.width,fit.height);image.src='';
   if(layout.labelHeight){ctx.fillStyle='#333';ctx.font='8px Helvetica, Arial, sans-serif';ctx.fillText(shortLabel(ctx,photo.name,layout.cellWidth),x,y+boxHeight+12);}
 }
 ctx.fillStyle='#555';ctx.font='8px Helvetica, Arial, sans-serif';ctx.fillText(`${ordered.length} photographs`,layout.margin,layout.height-16);ctx.textAlign='right';ctx.fillText(`${index+1} / ${Math.ceil(ordered.length/layout.capacity)}`,layout.width-layout.margin,layout.height-16);return true;
}
async function preview(){
 const version=++previewEpoch,token=epoch,layout=layoutSheet(settings()),ordered=sortPhotos(photos,$('order').value),total=Math.ceil(photos.length/layout.capacity);page=Math.max(0,Math.min(page,total-1));$('empty').hidden=!!photos.length;$('loaded').hidden=!photos.length;$('count').textContent=`${photos.length} ${photos.length===1?'photograph':'photographs'}`;$('page-number').textContent=`Page ${page+1} of ${total}`;lock(busy);if(!photos.length)return;
 const canvas=document.createElement('canvas');try{if(await drawPage(canvas,ordered,page,layout,()=>version===previewEpoch&&token===epoch)){$('page').width=canvas.width;$('page').height=canvas.height;$('page').getContext('2d').drawImage(canvas,0,0);$('page').setAttribute('aria-label',`Contact sheet page ${page+1} of ${total}, ${layout.columns} columns`);}}catch(error){if(token===epoch)message(error.message,true);}finally{canvas.width=canvas.height=1;}
}
async function ingest(files){
 if(busy)return;const token=++epoch;invalidate();lock(true);let skipped=0,added=0;const list=Array.from(files);$('progress').hidden=false;$('progress').max=list.length;$('progress').value=0;
 for(let i=0;i<list.length;i++){
  if(token!==epoch)return;const file=list[i];message(`Reading ${i+1} of ${list.length} photographs…`);let sourceURL=null,canvas=null;
  try{
   if(photos.length>=300||file.size>50*1024*1024||(!['image/jpeg','image/png','image/webp'].includes(file.type)&&! /\.(jpe?g|png|webp)$/i.test(file.name)))throw Error('Unsupported file.');
   sourceURL=URL.createObjectURL(file);const image=await loadImage(sourceURL);if(token!==epoch)return;
   if(image.naturalWidth*image.naturalHeight>60_000_000)throw Error('Image exceeds 60 MP.');
   const fit=fitImage(image.naturalWidth,image.naturalHeight,960,960);canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(fit.width));canvas.height=Math.max(1,Math.round(fit.height));const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);image.src='';
   const blob=await canvasBlob(canvas);if(token!==epoch)return;photos.push({name:file.name,index:photos.length,width:canvas.width,height:canvas.height,url:URL.createObjectURL(blob)});added++;
  }catch{skipped++;}finally{if(sourceURL)URL.revokeObjectURL(sourceURL);if(canvas)canvas.width=canvas.height=1;}
  $('progress').value=i+1;await yieldUI();
 }
 if(token!==epoch)return;$('files').value='';$('progress').hidden=true;lock(false);await preview();message(`${added} photographs added.${skipped?` ${skipped} skipped: unsupported, unreadable, over the size limit, or beyond 300 photographs.`:''} ${photos.length?'Review the pages, then generate your PDF.':''}`,!!skipped&&!photos.length);
}
async function generate(){
 if(busy||!photos.length)return;const token=++epoch;previewEpoch++;invalidate();lock(true);const layout=layoutSheet(settings()),ordered=sortPhotos(photos,$('order').value),total=Math.ceil(ordered.length/layout.capacity),pages=[];const canvas=document.createElement('canvas');$('progress').max=total;$('progress').value=0;$('progress').hidden=false;
 try{for(let i=0;i<total;i++){
  message(`Creating PDF page ${i+1} of ${total}…`);if(!await drawPage(canvas,ordered,i,layout,()=>token===epoch))return;const blob=await canvasBlob(canvas);const bytes=new Uint8Array(await blob.arrayBuffer());if(token!==epoch)return;pages.push({width:canvas.width,height:canvas.height,bytes});$('progress').value=i+1;await yieldUI();
 }const pdf=makePDF(pages,layout.width,layout.height);if(token!==epoch)return;pdfURL=URL.createObjectURL(pdf);$('download').href=pdfURL;$('download').download='inspector-focus-contact-sheet.pdf';$('download').hidden=false;message(`${total} ${total===1?'page':'pages'} ready · ${(pdf.size/1024/1024).toFixed(1)} MB. Download your contact sheet.`);
 }catch(error){if(token===epoch)message(`PDF could not be created. ${error.message}`,true);}finally{canvas.width=canvas.height=1;if(token===epoch){$('progress').hidden=true;lock(false);}}
}
function clear(){epoch++;previewEpoch++;invalidate();for(const photo of photos)URL.revokeObjectURL(photo.url);photos=[];page=0;$('files').value='';$('progress').hidden=true;lock(false);void preview();message('Choose photographs to create your contact sheet.');}
$('choose').onclick=$('add').onclick=()=>$('files').click();$('files').onchange=()=>ingest($('files').files);$('clear').onclick=clear;$('generate').onclick=()=>generate();
for(const id of controls)$(id).onchange=()=>{invalidate();page=0;void preview();message('Page settings changed. Generate a new PDF when ready.');};
$('previous').onclick=()=>{if(page>0){page--;void preview();}};$('next').onclick=()=>{if(page<Math.ceil(photos.length/layoutSheet(settings()).capacity)-1){page++;void preview();}};
$('dropzone').ondragover=event=>{event.preventDefault();$('empty').classList.add('drag');};$('dropzone').ondragleave=()=>$('empty').classList.remove('drag');$('dropzone').ondrop=event=>{event.preventDefault();$('empty').classList.remove('drag');void ingest(event.dataTransfer.files);};
window.addEventListener('beforeunload',()=>{for(const photo of photos)URL.revokeObjectURL(photo.url);if(pdfURL)URL.revokeObjectURL(pdfURL);});
