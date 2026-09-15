import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';

const require=createRequire(import.meta.url);
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const modules=new Map();
function load(file){
  file=resolve(root,file);
  if(modules.has(file))return modules.get(file).exports;
  const module={exports:{}};modules.set(file,module);
  const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const localRequire=name=>name.startsWith('@/')?load(name.slice(2)+'.ts'):name.startsWith('.')?load(resolve(dirname(file),name+'.ts')):require(name);
  vm.runInNewContext(code,{module,exports:module.exports,require:localRequire,Date,Intl},{filename:file});
  return module.exports;
}

const {deviceDay,formatDeviceTimestamp,dayAfterClockChange}=load('lib/device-time.ts');
const {daysBefore}=load('lib/wellness-types.ts');
const {DeviceTimeProvider,LocalTimestamp,LocalToday}=load('app/device-time.tsx');
const previousTZ=process.env.TZ;
const instant='2026-09-15T00:30:00Z';
try{
  process.env.TZ='America/Chicago';
  assert.equal(deviceDay(Date.parse(instant)),'2026-09-14');
  assert.match(formatDeviceTimestamp(instant),/7:30/);
  const chicago=formatDeviceTimestamp(instant);
  process.env.TZ='Asia/Kolkata';
  assert.equal(deviceDay(Date.parse(instant)),'2026-09-15');
  assert.match(formatDeviceTimestamp(instant),/6:00/);
  assert.notEqual(formatDeviceTimestamp(instant),chicago);
  process.env.TZ='Pacific/Kiritimati';
  assert.equal(deviceDay(Date.parse('2026-09-14T12:30:00Z')),'2026-09-15');

  process.env.TZ='America/Chicago';
  assert.match(formatDeviceTimestamp('2026-03-08T07:59:00Z'),/1:59/);
  assert.match(formatDeviceTimestamp('2026-03-08T08:00:00Z'),/3:00/);
  const first=formatDeviceTimestamp('2026-11-01T06:30:00Z');
  const second=formatDeviceTimestamp('2026-11-01T07:30:00Z');
  assert.match(first,/1:30/);assert.match(second,/1:30/);assert.notEqual(first,second);
  assert.equal(daysBefore('2026-03-09',1),'2026-03-08');
  assert.equal(daysBefore('2026-11-02',1),'2026-11-01');
  assert.equal(dayAfterClockChange('2026-09-14','2026-09-14','2026-09-15'),'2026-09-15');
  assert.equal(dayAfterClockChange('2026-09-12','2026-09-14','2026-09-15'),'2026-09-12');
  assert.equal(formatDeviceTimestamp('invalid'),'Time unavailable');

  const render=()=>renderToString(createElement(DeviceTimeProvider,null,createElement(LocalTimestamp,{value:instant}),createElement(LocalToday)));
  process.env.TZ='UTC';const server=render();
  process.env.TZ='America/Chicago';assert.equal(render(),server);
  process.env.TZ='Asia/Kolkata';assert.equal(render(),server);
  assert.ok(server.includes('…'));assert.ok(!server.includes('UTC'));
  console.log('Device time checks passed: date boundaries, timezone changes, DST, historical dates and stable server rendering.');
}finally{if(previousTZ===undefined)delete process.env.TZ;else process.env.TZ=previousTZ;}
