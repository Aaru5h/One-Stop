import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSources, parsePlaybackRequest } from '../src/lib/playbackSources.mjs';

test('movie and TV identifiers are validated before contacting a resolver', () => {
  assert.deepEqual(parsePlaybackRequest(new URLSearchParams('id=94664&type=tv&s=2&e=7')), { id:'94664', type:'tv', s:'2', e:'7' });
  for (const query of ['id=0','id=-1','id=1&type=other','id=1&type=tv&s=-1','id=1&type=tv&e=NaN','id=1.5','id=9007199254740992']) assert.equal(parsePlaybackRequest(new URLSearchParams(query)), null);
});
test('normalization only returns supported media data and strips private metadata', () => {
 const [source]=normalizeSources({sources:[{id:'server-1',name:'Main',type:'hls',url:'https://media.example/master.m3u8',token:'secret',headers:{Authorization:'secret'},subtitles:[{url:'https://media.example/en.vtt',label:'English',language:'en'},{url:'javascript:alert(1)',label:'Bad',language:'en'}]}]});
 assert.equal(source.subtitles.length,1);assert.equal(source.token,undefined);assert.equal(source.headers,undefined);assert.equal(source.type,'hls');
});
test('rejects executable URLs, credentials, duplicate IDs, and unsupported sources', () => {
 const source={id:'main',type:'mp4',url:'https://media.example/video.mp4'};
 for(const patch of [{url:'javascript:alert(1)'},{url:'data:text/html,test'},{url:'https://user:pass@media.example/video.mp4'},{type:'iframe'},{id:'../bad'}]) assert.throws(()=>normalizeSources({sources:[{...source,...patch}]}));
 assert.throws(()=>normalizeSources({sources:[source,source]}));assert.throws(()=>normalizeSources({}));assert.deepEqual(normalizeSources({sources:[]}),[]);
});
