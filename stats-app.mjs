import {inspectJPEG} from './exif-reader.mjs';
import {createStats,addPhoto,metrics,entries,label,exportCSV} from './stats-engine.mjs';
const $=id=>document.getElementById(id);
let stats=createStats(),running=false,stop=false,skipped=0,issues=[];
function say(s,error=false){$('message').textContent=s;$('message').classList.toggle('error',error);}
function node(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
function render(){
  $('results').hidden=false;$('count').textContent=stats.count.toLocaleString();$('with-settings').textContent=stats.withSettings.toLocaleString();$('no-exif').textContent=stats.noEXIF.toLocaleString();$('skipped').textContent=skipped.toLocaleString();
  $('date-range').textContent=stats.first?'Recorded capture dates: '+stats.first+(stats.first!==stats.last?' → '+stats.last:''):'No valid capture dates found.';
  $('charts').replaceChildren();
  for(const m of metrics){
    const g=stats.groups[m.id],section=node('section',undefined,'chart');section.append(node('h2',m.title),node('p',g.known.toLocaleString()+' known · '+(stats.count-g.known).toLocaleString()+' missing','coverage'));
    const list=node('div',undefined,'chart-list');
    if(!g.known)list.append(node('p','No values available in the supported EXIF fields.','chart-empty'));
    for(const [key,count]of entries(stats,m.id)){
      const pct=count/g.known*100,row=node('div',undefined,'chart-row'),line=node('div',undefined,'chart-label');line.append(node('span',label(m.id,key),'category'),node('span',count.toLocaleString()+' · '+pct.toFixed(1)+'%','quantity'));
      const track=node('div',undefined,'bar-track'),fill=node('div',undefined,'bar-fill');fill.style.width=pct+'%';track.setAttribute('aria-hidden','true');track.append(fill);row.append(line,track);list.append(row);
    }
    section.append(list,node('p',m.note,'chart-note'));$('charts').append(section);
  }
  $('issues').hidden=!issues.length;$('issues-label').textContent=issues.length+' file'+(issues.length===1?'':'s')+' needing attention';$('issues-list').replaceChildren(...issues.map(s=>node('li',s)));
  $('export').disabled=running||!stats.count;$('clear').disabled=running;
}
async function analyze(selection){
  if(running)return;const files=Array.from(selection);$('files').value='';
  if(!files.length)return;
  if(files.length>2000){say('Choose up to 2,000 photographs per collection. Your current results are unchanged.',true);return;}
  stats=createStats();skipped=0;issues=[];stop=false;running=true;$('choose').disabled=true;$('processing').hidden=false;$('results').hidden=true;$('issues').open=false;$('progress').max=files.length;$('progress').value=0;
  $('export').disabled=true;$('clear').disabled=true;say('Reading files locally. Nothing is uploaded.');
  let processed=0;
  try{
    for(const file of files){
      if(stop)break;
      $('progress-label').textContent='Reading '+(processed+1).toLocaleString()+' of '+files.length.toLocaleString();
      try{
        if(file.size>50*1024*1024)throw new Error('Exceeds the 50 MB per-file limit.');
        if(!/\.jpe?g$/i.test(file.name)&&file.type!=='image/jpeg')throw new Error('JPEG files only in this version.');
        const data=inspectJPEG(await file.arrayBuffer());
        if(stop)break;
        addPhoto(stats,data,file.size);if(data.warnings.length)issues.push(file.name+' — Some EXIF fields could not be read.');
      }catch(error){skipped++;issues.push(file.name+' — '+(error.message||'Could not read this file.'));}
      processed++;$('progress').value=processed;
      // Yield between files to keep Stop and the rest of the page responsive.
      await new Promise(resolve=>setTimeout(resolve,0));
    }
  }finally{
    running=false;$('choose').disabled=false;$('choose').textContent='Replace collection';$('processing').hidden=true;$('collection-label').textContent=stop?'Partial collection / Stopped':'Your collection';render();
    const incomplete=stats.partial?stats.partial+' file(s) had unreadable EXIF fields. ':'';
    say((stop?'Stopped. Results cover completed files only. ':'Analysis complete. ')+stats.count.toLocaleString()+' read · '+skipped.toLocaleString()+' skipped. '+incomplete+(stats.count&&!stats.withSettings?'No supported shooting settings were found. Orientation still comes from image dimensions. Try camera originals or exports that retain metadata.':'Percentages exclude missing values.'));
  }
}
$('choose').onclick=()=>$('files').click();$('files').onchange=()=>analyze($('files').files);
$('cancel').onclick=()=>{stop=true;$('progress-label').textContent='Stopping after the current read…';};
for(const event of ['dragenter','dragover'])$('dropzone').addEventListener(event,e=>{e.preventDefault();if(!running)$('dropzone').classList.add('drag');});
for(const event of ['dragleave','drop'])$('dropzone').addEventListener(event,e=>{e.preventDefault();$('dropzone').classList.remove('drag');});
$('dropzone').addEventListener('drop',e=>{if(!running)analyze(e.dataTransfer.files);});
$('clear').onclick=()=>{if(running)return;stats=createStats();issues=[];skipped=0;$('results').hidden=true;$('choose').textContent='Choose photographs';say('Collection cleared. Choose photographs to begin.');};
$('export').onclick=()=>{
  if(running||!stats.count)return;
  const url=URL.createObjectURL(new Blob(['\ufeff'+exportCSV(stats)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='inspector-focus-photo-stats.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  say('Statistics downloaded. The report contains aggregates only, with no filenames or GPS coordinates.');
};
