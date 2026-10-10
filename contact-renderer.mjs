import {fitImage} from './contact-engine.mjs?v=c19cef89cb37';
const logos=new WeakMap();
function shortLabel(ctx,text,width){text=text.replace(/[\x00-\x1f\x7f]/g,' ');if(ctx.measureText(text).width<=width)return text;let end=text.length;while(end>0&&ctx.measureText(text.slice(0,end)+'…').width>width)end--;return text.slice(0,end)+'…';}
export async function drawContactPage(target,ordered,index,layout,active,loadImage){
 const scale=2;target.width=Math.round(layout.width*scale);target.height=Math.round(layout.height*scale);const ctx=target.getContext('2d',{alpha:false});ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,layout.width,layout.height);
 if(!logos.has(loadImage))logos.set(loadImage,loadImage('/brand/inspector-focus.png').catch(error=>{logos.delete(loadImage);throw error;}));
 const logo=await logos.get(loadImage);if(!active())return false;const logoFit=fitImage(logo.naturalWidth||logo.width,logo.naturalHeight||logo.height,32,34);ctx.drawImage(logo,layout.margin+(32-logoFit.width)/2,10+(34-logoFit.height)/2,logoFit.width,logoFit.height);
 ctx.fillStyle='#111';ctx.textAlign='left';ctx.font='bold 10px Helvetica, Arial, sans-serif';ctx.fillText('INSPECTOR FOCUS / CONTACT SHEET',layout.margin+42,30);ctx.strokeStyle='#bbb';ctx.lineWidth=.4;ctx.beginPath();ctx.moveTo(layout.margin,layout.top-10);ctx.lineTo(layout.width-layout.margin,layout.top-10);ctx.stroke();
 const start=index*layout.capacity,count=Math.min(layout.capacity,ordered.length-start),usedRows=Math.ceil(count/layout.columns),usedColumns=Math.min(layout.columns,count),gridBottom=layout.top+usedRows*layout.cellHeight+(usedRows-1)*layout.gap;
 // Thin rules fall in the gutter, outside the photograph and filename areas.
 ctx.beginPath();for(let col=1;col<usedColumns;col++){const x=layout.margin+col*(layout.cellWidth+layout.gap)-layout.gap/2;ctx.moveTo(x,layout.top);ctx.lineTo(x,gridBottom);}for(let row=1;row<usedRows;row++){const y=layout.top+row*(layout.cellHeight+layout.gap)-layout.gap/2;ctx.moveTo(layout.margin,y);ctx.lineTo(layout.width-layout.margin,y);}ctx.stroke();
 for(let i=0;i<count;i++){
  if(!active())return false;const photo=ordered[start+i],image=await loadImage(photo.url);if(!active())return false;
  const x=layout.margin+(i%layout.columns)*(layout.cellWidth+layout.gap),y=layout.top+Math.floor(i/layout.columns)*(layout.cellHeight+layout.gap),boxHeight=layout.cellHeight-layout.labelHeight,fit=fitImage(photo.width,photo.height,layout.cellWidth,boxHeight);
  ctx.drawImage(image,x+(layout.cellWidth-fit.width)/2,y+(boxHeight-fit.height)/2,fit.width,fit.height);image.src='';
  if(layout.labelHeight){ctx.fillStyle='#333';ctx.textAlign='center';ctx.font='8px Helvetica, Arial, sans-serif';ctx.fillText(shortLabel(ctx,photo.name,layout.cellWidth-4),x+layout.cellWidth/2,y+boxHeight+12);}
 }
 ctx.fillStyle='#555';ctx.font='7.5px Helvetica, Arial, sans-serif';ctx.textAlign='left';ctx.fillText(`${ordered.length} photographs`,layout.margin,layout.height-16);ctx.textAlign='center';ctx.fillText('Create your own contact sheet at inspectorfocus.com',layout.width/2,layout.height-16);ctx.textAlign='right';ctx.fillText(`${index+1} / ${Math.ceil(ordered.length/layout.capacity)}`,layout.width-layout.margin,layout.height-16);ctx.textAlign='left';return true;
}
