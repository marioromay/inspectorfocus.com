export function resizeDimensions(width, height, longEdge) {
  if (![width,height].every(n=>Number.isSafeInteger(n)&&n>0)) throw new Error('Invalid image dimensions.');
  if (!Number.isInteger(longEdge)||longEdge<100||longEdge>6000) throw new Error('Enter a long edge from 100 to 6,000 pixels.');
  const scale=Math.min(1,longEdge/Math.max(width,height));
  const output={width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
  if(output.width*output.height>24_000_000) throw new Error('Choose a smaller long edge. This version exports up to 24 megapixels.');
  return {...output,reduced:scale<1};
}
export function imageFormat(bytes) {
  if(bytes[0]===255&&bytes[1]===216)return 'JPEG';
  if([137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return 'PNG';
  if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')return 'WebP';
  throw new Error('Choose a JPEG, PNG or WebP photograph.');
}
export function exportFilename(name,width,height) {
  const stem=String(name).replace(/\.[^.]*$/,'').replace(/[\x00-\x1f<>:"/\\|?*]/g,'_').slice(0,120)||'photograph';
  return `${stem}-${width}x${height}.jpg`;
}
export async function encodeJpeg(image,dimensions,quality,makeCanvas=()=>document.createElement('canvas'),crop=null) {
  if(!Number.isInteger(quality)||quality<50||quality>100)throw new Error('Choose JPEG quality from 50 to 100.');
  const canvas=makeCanvas();canvas.width=dimensions.width;canvas.height=dimensions.height;
  try {
    const context=canvas.getContext('2d',{alpha:false,colorSpace:'srgb'});
    if(!context)throw new Error('The browser could not create the image. Try a smaller size.');
    context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
    context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
    if(crop)context.drawImage(image,crop.x,crop.y,crop.width,crop.height,0,0,canvas.width,canvas.height);
    else context.drawImage(image,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality/100));
    if(!blob||!blob.size)throw new Error('The browser could not export this image. Try a smaller size.');
    if(blob.type!=='image/jpeg')throw new Error('JPEG export is unavailable in this browser.');
    return blob;
  } finally {canvas.width=0;canvas.height=0;}
}
