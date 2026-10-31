import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLessonText, makeImportedLessons } from '../src/lessonImport.js';
import { parseBackup, INITIAL_STATE, todayInSeoul } from '../src/domain.js';
import { validateLessonFile } from '../src/readLessonFile.js';

test('recognizes explicit lesson markers/ranges and keeps source page order',()=>{
 const rows=parseLessonText('단원 지도계획\n【2쪽】\n1차시 원의 중심 알아보기\n- 중심 표시하기\n3~4차시 반지름과 지름\n【3쪽】\n5 | 원 그리기');
 assert.deepEqual(rows.map(r=>[r.number,r.title,r.page]),[['1','원의 중심 알아보기','2'],['3~4','반지름과 지름','2'],['5','원 그리기','3']]);
 assert.equal(rows[0].details,'- 중심 표시하기');
 assert.deepEqual(parseLessonText('3학년 2학기\n원\n목차\n48쪽'),[]);
});
test('handles OCR spacing, split titles and does not invent missing lessons',()=>{
 const rows=parseLessonText('제 2 차 시\n반지름 알아보기\n4차시 지름 알아보기');
 assert.deepEqual(rows.map(r=>r.number),['2','4']);
 assert.equal(rows[0].title,'반지름 알아보기');
});
test('only selected reviewed rows become lessons, without redistributing titles',()=>{
 const rows=parseLessonText('1차시 원\n2~3차시 반지름과 지름의 관계\n- 원문 활동\n7차시 정리');
 rows[0].selected=false;
 const result=makeImportedLessons(rows);
 assert.equal(result.length,2);
 assert.equal(result[0].title,'반지름과 지름의 관계');
 assert.equal(result[0].activity,'- 원문 활동');
 assert.equal(result[0].sourceLabel,'2~3차시');
 assert.notEqual(result[0].id,result[1].id);
});
test('rejects empty/oversized selection and malformed reviewed lesson numbers',()=>{
 assert.throws(()=>makeImportedLessons([]),/1~30/);
 const row={selected:true,number:'1',title:'원',details:'',page:''};
 assert.throws(()=>makeImportedLessons(Array(31).fill(row)),/1~30/);
 assert.throws(()=>makeImportedLessons([{...row,title:''}]),/제목/);
 assert.throws(()=>makeImportedLessons([{...row,number:'?'}]),/차시 번호/);
 assert.throws(()=>parseLessonText('a'.repeat(100001)),/너무 깁니다/);
});
test('preserves imported source references in backups and validates metadata',()=>{
 const state={...structuredClone(INITIAL_STATE),plans:[{id:'plan',query:'자료',semester:2,unit:'원',focus:'원의 중심',created:todayInSeoul(),lessons:makeImportedLessons(parseLessonText('【3쪽】\n1차시 원의 중심'))}]};
 assert.deepEqual(parseBackup(JSON.stringify(state)),state);
 state.plans[0].lessons[0].sourceLabel={unsafe:'not text'};
 assert.throws(()=>parseBackup(JSON.stringify(state)),/기록 연결/);
});
test('validates document size and supported types before decoding',()=>{
 assert.equal(validateLessonFile({name:'table.PDF',size:100}),'pdf');
 assert.throws(()=>validateLessonFile({name:'table.png',size:0}),/내용/);
 assert.throws(()=>validateLessonFile({name:'table.png',size:21*1024*1024}),/20 MB/);
 assert.throws(()=>validateLessonFile({name:'table.html',size:100}),/PNG/);
});
