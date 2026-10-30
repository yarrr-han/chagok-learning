import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_STATE, STORAGE_KEY, todayInSeoul, generateTimeSlots, generateLessons,
  getProgress, assignLessonsToSlots, parseBackup, getUnitOptions,
} from '../src/domain.js';

function exampleState() {
  const lessons = generateLessons('덧셈과 뺄셈', ['받아올림', '받아내림'], 6);
  return { ...structuredClone(INITIAL_STATE), plans: [{
    id: 'plan-1', query: '3학년 수학 1단원', semester: 1, unit: '덧셈과 뺄셈',
    focus: '받아올림, 받아내림', created: todayInSeoul(), lessons,
    textbook: { grade: 3, subject: '수학', publisher: '국정 교과서', unitNumber: 1 },
  }] };
}

test('preserves the deployed storage key and version-1 backup format', () => {
  assert.equal(STORAGE_KEY, 'chagok-learning-v1');
  const state = exampleState();
  state.journals.push({ lessonId: state.plans[0].lessons[0].id, date: todayInSeoul(), content: '지도 내용', observation: '스스로 해결', done: true });
  state.bookings.push({ lessonId: state.plans[0].lessons[1].id, date: '2099-01-05', period: 6 });
  assert.deepEqual(parseBackup(JSON.stringify(state)), state);
});

test('generates unique lessons and distributes topics across repeated sessions', () => {
  const lessons = generateLessons('나눗셈', ['똑같이 나누기', '같은 수씩 묶기'], 6);
  assert.equal(lessons.length, 6);
  assert.equal(new Set(lessons.map(x => x.id)).size, 6);
  assert.match(lessons[0].activity, /바둑돌 12개/);
  assert.match(lessons[1].title, /반복 연습/);
  assert.match(lessons[5].title, /같은 수씩 묶기/);
});

test('calendar respects weekdays, excluded dates, leap years and unique periods', () => {
  const slots = generateTimeSlots('2028-02', [2], [6, 5, 6], ['2028-02-08']);
  assert.deepEqual(slots.map(x => x.date), ['2028-02-01','2028-02-01','2028-02-15','2028-02-15','2028-02-22','2028-02-22','2028-02-29','2028-02-29']);
  assert.deepEqual(slots.slice(0,2).map(x => x.period), [5,6]);
  assert.deepEqual(generateTimeSlots('2028-13', [1], [6], []), []);
});

test('progress ignores drafts, duplicate journals and orphaned lesson references', () => {
  const state = exampleState(); state.target = 2;
  const id = state.plans[0].lessons[0].id;
  state.journals = [{lessonId:id,done:true},{lessonId:id,done:true},{lessonId:'orphan',done:true},{lessonId:state.plans[0].lessons[1].id,done:false}];
  assert.deepEqual(getProgress(state), { done: 1, remaining: 1, percent: 50 });
});

test('scheduling respects completed lessons, occupied slots and target capacity', () => {
  const state = exampleState(); state.target = 3;
  const lessons = state.plans[0].lessons;
  state.journals = [{lessonId:lessons[0].id,done:true}];
  state.bookings = [{lessonId:lessons[1].id,date:'2099-01-05',period:6}];
  const slots = [{date:'2000-01-01',period:6},{date:'2099-01-05',period:6},{date:'2099-01-06',period:6},{date:'2099-01-07',period:6}];
  assert.deepEqual(assignLessonsToSlots(state,slots), [{date:'2099-01-06',period:6,lessonId:lessons[2].id}]);
});

test('backup validation rejects malformed, oversized, orphaned and duplicate records', () => {
  assert.throws(() => parseBackup('{'), /JSON/);
  assert.throws(() => parseBackup(' '.repeat(5000001)), /5 MB/);
  const state = exampleState();
  state.bookings = [{lessonId:'missing',date:'2099-01-05',period:6}];
  assert.throws(() => parseBackup(JSON.stringify(state)), /기록 연결/);
  state.bookings = [];
  state.plans[0].lessons[1].id = state.plans[0].lessons[0].id;
  assert.throws(() => parseBackup(JSON.stringify(state)), /기록 연결/);
});

test('unit options retain saved publisher-specific units and existing sample catalog', () => {
  const state = exampleState();
  const options = getUnitOptions(3, 1, '수학', '국정 교과서', state.plans);
  assert.equal(options.filter(x => x.source === 'saved').length, 1);
  assert.equal(options.filter(x => x.source === 'example').length, 6);
  assert.equal(getUnitOptions(3, 1, '수학', '미래엔', state.plans).filter(x => x.source === 'saved').length, 0);
  assert.deepEqual(getUnitOptions(4, 1, '영어', '미래엔', []), []);
});
