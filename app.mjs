// Hostinger Node entrypoint. Image processing runs exclusively in the browser.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root=new URL('./',import.meta.url);
const routes=new Map([
  ['/','index.html'],['/index.html','index.html'],
  ['/exif/','exif/index.html'],['/exif/index.html','exif/index.html'],
  ['/photo-stats/','photo-stats/index.html'],['/photo-stats/index.html','photo-stats/index.html'],
  ['/print-size/','print-size/index.html'],['/print-size/index.html','print-size/index.html'],
  ['/contact-sheet/','contact-sheet/index.html'],['/contact-sheet/index.html','contact-sheet/index.html'],
  ['/resize/','resize/index.html'],['/resize/index.html','resize/index.html'],
  ...['contact-app.mjs','contact-engine.mjs','contact.css','workspace.mjs','home.css','resize-app.mjs','resize-engine.mjs','resize.css','theme.js','editorial.css','print-app.mjs','print-engine.mjs','print.css','exif-app.mjs','exif-reader.mjs','stats-app.mjs','stats-engine.mjs','style.css','stats.css','favicon.svg','brand/inspector-focus.png'].map(path=>['/'+path,path])
]);
const mime={html:'text/html; charset=utf-8',mjs:'text/javascript; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',png:'image/png'};
export function makeServer(){return createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'});res.end('Method not allowed');return;}
  let path;
  try{path=new URL(req.url,'http://localhost').pathname;}catch{res.writeHead(400);res.end('Bad request');return;}
  if(path==='/exif'||path==='/photo-stats'||path==='/print-size'||path==='/resize'||path==='/contact-sheet'){res.writeHead(308,{'Location':path+'/'});res.end();return;}
  const file=routes.get(path);
  if(!file){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end(req.method==='HEAD'?undefined:'Page not found');return;}
  try{
    const body=await readFile(new URL(file,root));
    res.writeHead(200,{'Content-Type':mime[file.split('.').pop()],'Content-Length':body.length,'Cache-Control':'no-cache'});
    res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end('Could not serve this page');}
});}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  const port=Number(process.env.PORT||3000);
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PORT');
  makeServer().listen(port,'0.0.0.0',()=>console.log('Inspector Focus listening on port '+port));
}
