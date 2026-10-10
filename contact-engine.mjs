export function layoutSheet({paper='letter',orientation='portrait',columns=4,labels=true}={}){
  if(!['letter','a4'].includes(paper)||!['portrait','landscape'].includes(orientation)||![2,3,4,5,6].includes(Number(columns)))throw Error('Invalid page settings.');
  let [width,height]=paper==='a4'?[595.28,841.89]:[612,792];
  if(orientation==='landscape')[width,height]=[height,width];
  columns=Number(columns);const margin=30,gap=10,top=46,bottom=32,labelHeight=labels?18:0;
  const cellWidth=(width-2*margin-gap*(columns-1))/columns;
  const rows=Math.max(1,Math.floor((height-top-bottom+gap)/(cellWidth*.78+labelHeight+gap)));
  const cellHeight=(height-top-bottom-gap*(rows-1))/rows;
  return {width,height,margin,gap,top,columns,rows,capacity:columns*rows,cellWidth,cellHeight,labelHeight};
}
export function fitImage(width,height,boxWidth,boxHeight){
  if(![width,height,boxWidth,boxHeight].every(n=>Number.isFinite(n)&&n>0))throw Error('Invalid image dimensions.');
  const scale=Math.min(boxWidth/width,boxHeight/height);return {width:width*scale,height:height*scale};
}
export function sortPhotos(photos,order){return order==='filename'?[...photos].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'})||a.index-b.index):[...photos];}
// A small image-only PDF writer. Page artwork is rendered locally on canvas,
// including labels, so filenames never require PDF text escaping or font uploads.
export function makePDF(pages,width,height){
  if(!pages.length)throw Error('No pages to export.');
  const enc=new TextEncoder(),chunks=[],offsets=[0];let length=0;
  const append=value=>{const bytes=typeof value==='string'?enc.encode(value):value;chunks.push(bytes);length+=bytes.length;};
  const obj=(id,body)=>{offsets[id]=length;append(`${id} 0 obj\n`);append(body);append('\nendobj\n');};
  append('%PDF-1.4\n% Inspector Focus\n');
  obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
  obj(2,`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
  for(let i=0;i<pages.length;i++){
    const p=pages[i],id=3+i*3;
    obj(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);
    offsets[id+1]=length;append(`${id+1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`);append(p.bytes);append('\nendstream\nendobj\n');
    const content=`q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
    obj(id+2,`<< /Length ${enc.encode(content).length} >>\nstream\n${content}endstream`);
  }
  const start=length;append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for(const offset of offsets.slice(1))append(`${String(offset).padStart(10,'0')} 00000 n \n`);
  append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`);
  return new Blob(chunks,{type:'application/pdf'});
}
