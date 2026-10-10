import {printSizes,printFit,resolutionGuide,sizeLabel} from './print-engine.mjs';
const $=id=>document.getElementById(id);let image=null,url=null,selected='8x10',generation=0;
const say=(text,error=false)=>{$('message').textContent=text;$('message').classList.toggle('error',error);};
function currentFit(){return printFit(image.width,image.height,printSizes.find(s=>s.id===selected),$('orientation').value,+$('position').value/100);}
function pct(n,total){return n/total*100;}
function box(id,left,top,width,height){Object.assign($(id).style,{left:left+'%',top:top+'%',width:Math.max(0,width)+'%',height:Math.max(0,height)+'%'});}
function lostText(f){return f.lost*100<.1?'<0.1%':(f.lost*100).toFixed(1)+'%';}
function render(){
  const container=$('sizes');container.replaceChildren();
  for(const size of printSizes){
    const button=document.createElement('button');button.className='size-choice'+(size.id===selected?' selected':'');button.disabled=!image;button.setAttribute('aria-pressed',String(size.id===selected));
    const f=image?printFit(image.width,image.height,size,$('orientation').value):null,guide=f?resolutionGuide(f.ppi):null;
    for(const [text,cls]of [[sizeLabel(size,$('units').value),'size-name'],[f?Math.floor(f.ppi)+' PPI':'—','size-ppi'],[f?f.cropRequired?'Crop required · '+lostText(f)+' removed':'No crop required':'Select a photograph','size-crop'],[guide?guide.label:'Resolution pending','size-guide'+(guide?' '+guide.tone:'')]]){const span=document.createElement('span');span.textContent=text;span.className=cls;button.append(span);}
    button.onclick=()=>{selected=size.id;$('position').value=50;render();};container.append(button);
  }
  if(!image)return;
  const f=currentFit(),guide=resolutionGuide(f.ppi),x=pct(f.x,image.width),y=pct(f.y,image.height),w=pct(f.cropWidth,image.width),h=pct(f.cropHeight,image.height);
  box('crop-outline',x,y,w,h);box('mask-top',0,0,100,y);box('mask-bottom',0,y+h,100,100-y-h);box('mask-left',0,y,x,h);box('mask-right',x+w,y,100-x-w,h);
  $('selected-size').textContent=sizeLabel(printSizes.find(s=>s.id===selected),$('units').value);$('selected-ppi').textContent=Math.floor(f.ppi)+' PPI';$('selected-guide').textContent=guide.label;
  $('crop-description').textContent=f.cropRequired?lostText(f)+' of the image area falls outside this print. Approx. '+Math.floor(f.cropWidth).toLocaleString()+' × '+Math.floor(f.cropHeight).toLocaleString()+' pixels retained.':'The photograph fits this print ratio without cropping.';
  $('position-control').hidden=!f.axis;$('position-label').textContent='Crop position · '+(f.axis||'');$('start-label').textContent=f.axis==='vertical'?'Top':'Left';$('end-label').textContent=f.axis==='vertical'?'Bottom':'Right';
}
function clear(){generation++;if(url)URL.revokeObjectURL(url);url=null;image=null;$('photo').removeAttribute('src');$('file').value='';$('image-view').hidden=true;$('empty').hidden=false;$('position').value=50;render();say('Choose a photograph to calculate print resolution.');}
async function load(file){
  const run=++generation;let pendingURL=null;
  try{
    if(file.size>50*1024*1024)throw new Error('Choose an image up to 50 MB.');
    // Verify format signatures, rather than relying on an extension or MIME label.
    const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());if(run!==generation)return;
    const jpeg=bytes[0]===255&&bytes[1]===216,png=[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n),webp=new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
    if(!jpeg&&!png&&!webp)throw new Error('Choose a JPEG, PNG or WebP photograph.');
    say('Reading image locally…');pendingURL=URL.createObjectURL(file);const preview=new Image();preview.src=pendingURL;await preview.decode();
    if(run!==generation){URL.revokeObjectURL(pendingURL);return;}
    if(!preview.naturalWidth||!preview.naturalHeight)throw new Error('The browser could not read image dimensions.');
    if(url)URL.revokeObjectURL(url);url=pendingURL;pendingURL=null;image={width:preview.naturalWidth,height:preview.naturalHeight};
    $('photo').src=url;$('stage').style.width='min(100%, '+Math.min(650,560*image.width/image.height)+'px)';$('filename').textContent=file.name;
    $('image-facts').textContent=image.width.toLocaleString()+' × '+image.height.toLocaleString()+' pixels · '+(image.width*image.height/1e6).toFixed(2)+' MP · '+(file.size/1024/1024).toFixed(2)+' MB';
    $('image-view').hidden=false;$('empty').hidden=true;$('position').value=50;render();say('Print estimates ready. Select a size to preview the crop. Your original file is unchanged.');
  }catch(error){if(pendingURL)URL.revokeObjectURL(pendingURL);if(run!==generation)return;say(error.message||'The browser could not open this image. Try a standard JPEG.',true);}
}
$('choose').onclick=$('replace').onclick=()=>$('file').click();$('file').onchange=()=>{if($('file').files[0])return load($('file').files[0]);};$('clear').onclick=clear;
$('orientation').onchange=()=>{$('position').value=50;render();};$('units').onchange=render;$('position').oninput=render;$('center').onclick=()=>{$('position').value=50;render();};
for(const event of ['dragenter','dragover'])$('dropzone').addEventListener(event,e=>{e.preventDefault();$('empty').classList.add('drag');});for(const event of ['dragleave','drop'])$('dropzone').addEventListener(event,e=>{e.preventDefault();$('empty').classList.remove('drag');});
$('dropzone').addEventListener('drop',e=>{if(e.dataTransfer.files.length!==1){say('Choose one photograph at a time.',true);return;}load(e.dataTransfer.files[0]);});
window.addEventListener('pagehide',()=>{if(url)URL.revokeObjectURL(url);});render();
