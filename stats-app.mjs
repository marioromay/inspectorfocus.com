import {inspectJPEG} from './exif-reader.mjs?v=3ef6ec3e9ae7';
import {createStats,addPhoto,metrics,entries,label,exportCSV} from './stats-engine.mjs?v=67cc37d32c64';
import {leaders,chartValues} from './stats-visuals.mjs?v=df13ef7946ab';
const $=id=>document.getElementById(id);
let stats=createStats(),running=false,stop=false,skipped=0,issues=[],sample=false;
function say(s,error=false){$('message').textContent=s;$('message').classList.toggle('error',error);}
function node(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
function render(){
  $('results').hidden=false;$('count').textContent=stats.count.toLocaleString();$('with-settings').textContent=stats.withSettings.toLocaleString();$('no-exif').textContent=stats.noEXIF.toLocaleString();$('skipped').textContent=skipped.toLocaleString();
  $('date-range').textContent=stats.first?'Recorded capture dates: '+stats.first+(stats.first!==stats.last?' → '+stats.last:''):'No valid capture dates found.';
  $('stats-insights').replaceChildren();
  for(const [id,title] of [['focal','Most-used focal length'],['aperture','Most-used aperture'],['hour','Busiest recorded hour'],['lens','Most-used lens']]){
    const peak=leaders(stats,id),item=node('div',undefined,'stats-insight');
    item.append(node('span',title,'eyebrow'),node('strong',peak.values[0]||'—'),node('p',peak.known?peak.count.toLocaleString()+' photographs · '+peak.percent.toFixed(1)+'% of '+peak.known.toLocaleString()+' known'+(peak.values.length>1?' · '+peak.values.length+' values tied':''):'No recorded values','muted'));
    if(peak.values.length>1)item.append(node('small','Tied: '+peak.values.join(', '),'muted'));
    $('stats-insights').append(item);
  }
  $('charts').replaceChildren();
  const ordered=['focal','aperture','hour','iso','camera','lens','orientation','shutter','month'].map(id=>metrics.find(m=>m.id===id));
  for(const [index,m] of ordered.entries()){
    const g=stats.groups[m.id],section=node('section',undefined,'chart chart-'+m.id),heading=node('h2');
    heading.append(node('span',String(index+1).padStart(2,'0'),'chart-index'),node('span',m.id==='hour'?'Recorded capture time':m.title));
    section.append(heading,node('p',g.known.toLocaleString()+' known · '+(stats.count-g.known).toLocaleString()+' missing','coverage'));
    if(!g.known){section.append(node('p','No values available in the supported EXIF fields.','chart-empty'),node('p',m.note,'chart-note'));$('charts').append(section);continue;}
    const values=chartValues(stats,m.id),peak=leaders(stats,m.id),numeric=['focal','aperture','iso','hour','month'].includes(m.id),vertical=numeric&&(values.length<=12||m.id==='hour');
    const headline=node('div',undefined,'chart-headline');headline.append(node('strong',peak.values[0]),node('span',peak.values.length>1?'Joint most used · '+peak.count.toLocaleString()+' each':'Most used · '+peak.count.toLocaleString()+' photographs'));section.append(headline);
    const graph=node('div',undefined,vertical?'column-chart'+(m.id==='hour'?' hourly-chart':''):'rank-chart');
    graph.setAttribute('aria-hidden','true');
    for(const v of values){
      if(vertical){const column=node('div',undefined,'chart-column'),track=node('div',undefined,'column-track'),bar=node('div',undefined,'column-bar'+(v.leading?' leading':''));bar.style.height=v.height+'%';bar.title=v.label+' · '+v.count+' photographs';track.append(bar);column.append(track,node('span',m.id==='hour'?(Number(v.key)%6===0?String(v.key).padStart(2,'0'):''):v.label,'column-label'));graph.append(column);}
      else{const row=node('div',undefined,'chart-row'),line=node('div',undefined,'chart-label');line.append(node('span',v.label,'category'),node('span',v.count.toLocaleString()+' · '+v.percent.toFixed(1)+'%','quantity'));const track=node('div',undefined,'bar-track'),fill=node('div',undefined,'bar-fill'+(v.leading?' leading':''));fill.style.width=v.percent+'%';track.append(fill);row.append(line,track);graph.append(row);}
    }
    section.append(graph);
    if(vertical)section.append(node('p','Photographs · bar scale 0–'+peak.count.toLocaleString()+(m.id==='hour'?' · hours 00–23':''),'chart-scale'));
    const details=node('details',undefined,'chart-values'),table=node('table'),thead=node('thead'),tr=node('tr');
    for(const text of [m.title,'Photographs','% of known'])tr.append(node('th',text));thead.append(tr);table.append(thead);const tbody=node('tbody');
    for(const v of values){const row=node('tr');for(const text of [v.label,v.count.toLocaleString(),v.percent.toFixed(1)+'%'])row.append(node('td',text));tbody.append(row);}table.append(tbody);details.append(node('summary','View exact values'),table);section.append(details,node('p',m.note,'chart-note'));$('charts').append(section);
  }
  $('issues').hidden=!issues.length;$('issues-label').textContent=issues.length+' file'+(issues.length===1?'':'s')+' needing attention';$('issues-list').replaceChildren(...issues.map(s=>node('li',s)));
  $('export').disabled=running||!stats.count||sample;$('clear').disabled=running;
}
async function analyze(selection){
  if(running)return;const files=Array.from(selection);$('files').value='';
  if(!files.length)return;
  if(files.length>2000){say('Choose up to 2,000 photographs per collection. Your current results are unchanged.',true);return;}
  stats=createStats();sample=false;skipped=0;issues=[];stop=false;running=true;$('sample').disabled=true;$('choose').disabled=true;$('processing').hidden=false;$('results').hidden=true;$('issues').open=false;$('progress').max=files.length;$('progress').value=0;
  $('export').disabled=true;$('clear').disabled=true;say('Reading files locally. Nothing is uploaded.');
  let processed=0;const task=globalThis.processingProgress?.start({title:'Analyzing photo stats',detail:'Reading camera settings…',total:files.length,cancel:()=>{stop=true;},cancelLabel:'Stop after current read'});
  try{
    await globalThis.processingProgress?.paint();for(const file of files){
      if(stop)break;
      globalThis.processingProgress?.update(task,'Reading '+file.name,processed,files.length);$('progress-label').textContent='Reading '+(processed+1).toLocaleString()+' of '+files.length.toLocaleString();
      try{
        if(file.size>50*1024*1024)throw new Error('Exceeds the 50 MB per-file limit.');
        if(!/\.jpe?g$/i.test(file.name)&&file.type!=='image/jpeg')throw new Error('JPEG files only in this version.');
        const data=inspectJPEG(await file.arrayBuffer());
        if(stop)break;
        addPhoto(stats,data,file.size);if(data.warnings.length)issues.push(file.name+' — Some EXIF fields could not be read.');
      }catch(error){skipped++;issues.push(file.name+' — '+(error.message||'Could not read this file.'));}
      processed++;$('progress').value=processed;globalThis.processingProgress?.update(task,'Photographs read',processed,files.length);
      // Yield between files to keep Stop and the rest of the page responsive.
      await new Promise(resolve=>setTimeout(resolve,0));
    }
  }finally{
    globalThis.processingProgress?.finish(task);running=false;$('sample').disabled=false;$('choose').disabled=false;$('choose').textContent='Replace collection';$('processing').hidden=true;$('collection-label').textContent=stop?'Partial collection / Stopped':'Your collection';render();
    const incomplete=stats.partial?stats.partial+' file(s) had unreadable EXIF fields. ':'';
    say((stop?'Stopped. Results cover completed files only. ':'Analysis complete. ')+stats.count.toLocaleString()+' read · '+skipped.toLocaleString()+' skipped. '+incomplete+(stats.count&&!stats.withSettings?'No supported shooting settings were found. Orientation still comes from image dimensions. Try camera originals or exports that retain metadata.':'Percentages exclude missing values.'));
  }
}
$('choose').onclick=()=>$('files').click();$('files').onchange=()=>analyze($('files').files);
$('cancel').onclick=()=>{stop=true;$('progress-label').textContent='Stopping after the current read…';};
for(const event of ['dragenter','dragover'])$('dropzone').addEventListener(event,e=>{e.preventDefault();if(!running)$('dropzone').classList.add('drag');});
for(const event of ['dragleave','drop'])$('dropzone').addEventListener(event,e=>{e.preventDefault();$('dropzone').classList.remove('drag');});
$('dropzone').addEventListener('drop',e=>{if(!running)analyze(e.dataTransfer.files);});
$('clear').onclick=()=>{if(running)return;stats=createStats();sample=false;issues=[];skipped=0;$('results').hidden=true;$('choose').textContent='Choose photographs';say('Collection cleared. Choose photographs to begin.');};
$('export').onclick=()=>{
  if(running||!stats.count||sample)return;
  const url=URL.createObjectURL(new Blob(['\ufeff'+exportCSV(stats)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='inspector-focus-photo-stats.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  say('Statistics downloaded. The report contains aggregates only, with no filenames or GPS coordinates.');
};

$('sample').onclick=()=>{
 if(running)return;stats=createStats();sample=true;skipped=0;issues=[];
 const focal=[24,28,35,35,35,50,50,85],aperture=[2.8,4,5.6,5.6,8,8],hours=[6,7,8,12,15,16,16,16,17,18];
 for(let i=0;i<120;i++){const tags=i%10===0?{}:{focal:focal[i%focal.length],aperture:aperture[i%aperture.length],iso:[100,200,400,400,800][i%5],exposure:[1/1000,1/500,1/250,1/125][i%4],make:'Sample',model:i%3?'Camera A':'Camera B',lens:i%3?'35 mm prime (sample)':'Standard zoom (sample)',capture:'2026:10:'+String(1+i%3).padStart(2,'0')+' '+String(hours[i%hours.length]).padStart(2,'0')+':00:00'};addPhoto(stats,{width:i%4?6000:4000,height:i%4?4000:6000,tags,exif:i%10!==0,warnings:[]});}
 $('collection-label').textContent='Sample collection / illustrative data';render();say('Sample charts only — these are illustrative values, not your photographs. Choose photographs to analyze your own collection. CSV export is available for your own results.');
};
