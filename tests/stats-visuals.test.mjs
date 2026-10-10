import test from 'node:test';import assert from 'node:assert/strict';
import {createStats,addPhoto} from '../stats-engine.mjs';
import {leaders,chartValues} from '../stats-visuals.mjs';
const photo=tags=>({tags,width:6000,height:4000,exif:true,warnings:[]});
test('visual highlights exclude missing values and report all tied leaders',()=>{
 const s=createStats();addPhoto(s,photo({focal:35}));addPhoto(s,photo({focal:50}));addPhoto(s,photo({}));
 const result=leaders(s,'focal');assert.deepEqual(result.values,['35 mm','50 mm']);assert.equal(result.known,2);assert.equal(result.missing,1);assert.equal(result.percent,50);
 const bars=chartValues(s,'focal');assert.equal(bars[0].height,100);assert.equal(bars[0].percent,50);assert.ok(bars.every(v=>v.leading));
});
test('hour histogram includes all 24 hours with truthful zeros and peak scaling',()=>{
 const s=createStats();for(const capture of ['2026:10:10 16:00:00','2026:10:10 16:30:00','2026:10:10 06:00:00'])addPhoto(s,photo({capture}));addPhoto(s,photo({}));
 const bars=chartValues(s,'hour');assert.equal(bars.length,24);assert.equal(bars[16].count,2);assert.equal(bars[16].height,100);assert.equal(bars[6].height,50);assert.equal(bars[0].count,0);assert.equal(bars[0].height,0);assert.equal(bars[0].leading,false);assert.equal( leaders(s,'hour').missing,1);
});
test('empty metadata produces no invented leader or percentage',()=>{
 const s=createStats();addPhoto(s,photo({}));assert.deepEqual(leaders(s,'aperture').values,[]);assert.equal(leaders(s,'aperture').percent,0);assert.deepEqual(chartValues(s,'aperture'),[]);assert.ok(chartValues(s,'hour').every(v=>v.height===0&&v.percent===0));
});
