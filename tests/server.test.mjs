import test from 'node:test';
import assert from 'node:assert/strict';
import {makeServer} from '../app.mjs';
test('Node entrypoint serves tools and assets while excluding source and uploads',async()=>{
  const server=makeServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try{
    for(const [path,text]of [['/','EXIF Data'],['/exif/','Shooting details'],['/photo-stats/','Photo Stats'],['/print-size/','Print Size']]){const r=await fetch(base+path);assert.equal(r.status,200);assert.ok((await r.text()).includes(text));}
    const script=await fetch(base+'/exif-app.mjs');assert.equal(script.status,200);assert.match(script.headers.get('content-type'),/javascript/);
    const logo=await fetch(base+'/brand/inspector-focus.png');assert.equal(logo.status,200);assert.equal(logo.headers.get('content-type'),'image/png');
    for(const path of ['/app.mjs','/package.json','/README.md','/.git/config','/%2e%2e/package.json'])assert.equal((await fetch(base+path)).status,404);
    const post=await fetch(base+'/exif/',{method:'POST',body:'no uploads'});assert.equal(post.status,405);
    const head=await fetch(base+'/exif/',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
    const redirect=await fetch(base+'/exif',{redirect:'manual'});assert.equal(redirect.status,308);assert.equal(redirect.headers.get('location'),'/exif/');
  }finally{await new Promise(resolve=>server.close(resolve));}
});
