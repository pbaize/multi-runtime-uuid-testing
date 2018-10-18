import {test} from 'ava';

import {createApp, DecoratedApp, reset, wait} from './utils';

const id = (x: boolean) => x;
// for (let count = 2; count < 11; count++) {
//   test(`Simultaeneous run ${count} apps # ${1}`, async t => {
//     const run = (app: DecoratedApp, i: number) => app.run().then(() => console.log('successful run of app ', i)).then(() => true).catch((e) => {
//       console.log(e.message);
//       return false;
//     });
//     // tslint:disable-next-line:ban
//     const apps = await Promise.all(Array(count).fill(await createApp()));
//     const successes = await Promise.all(apps.map(run));
//     t.true(successes.filter(id).length === 1);
//   });
// }
for (let count = 2; count < 11; count++) {
  for (let run = 1; run < 101; run++) {
    test(`Simultaeneous run ${count} apps # ${run}`, async t => {
      const run = (app: DecoratedApp, i: number) => app.run().then(()=> console.log('successful run of app ', i)).then(() => true).catch((e) => {
        console.log(e.message);
        return false;
    });
      // tslint:disable-next-line:ban
      const apps = await Promise.all(Array(count).fill(null).map(() =>
      createApp())); const successes = await Promise.all(apps.reverse().map(run));
      t.true(successes.filter(id).length === 1);
    });
  } 
}


test('first app gets run-requested', async t => {
  const app1 = await createApp();
  const app2 = await createApp();
  await app1.run();
  let y: () => void;
  let n: (e: string) => void;
  const p = new Promise((res, rej) => {
    y = res;
    n = rej;
  });
  await app1.on('run-requested', () => y());
  try {
    await app2.run();
    t.fail();
  } catch (e) {
    console.log(e);
    setTimeout(() => n('Too long'), 5000);
    await p;
    t.pass();
  }
});


test('create create run run', async t => {
  const app1 = await createApp();
  const app2 = await createApp();
  await app1.run();
  try {
    await app2.run();
    t.fail();
  } catch (e) {
    console.log(e.message);
    t.is(
        e.message,
        `Application with specified UUID is already running: ${
            app2.identity.uuid}`);
  }
});

test('create create run2 run', async t => {
  const app1 = await createApp();
  const app2 = await createApp();
  await app2.run();
  try {
    await app1.run();
    t.fail();
  } catch (e) {
    console.log(e.message);
    t.is(
        e.message,
        `Application with specified UUID is already running: ${
            app2.identity.uuid}`);
  }
});
test('create run close create run same runtime', async t => {
  const app1 = await createApp();
  await app1.run();
  await app1.close();
  const uuid = app1.identity.uuid;
  const app2 = await app1.fin.Application.create({uuid, name: uuid});
  await app2.run();
  t.pass();
});
test('create run close run', async t => {
  const app1 = await createApp();
  await app1.run();
  await app1.close();
  await app1.run();
  t.pass();
});

test('create run close create run', async t => {
  const app1 = await createApp();
  await app1.run();
  await app1.close();
  const app2 = await createApp();
  await app2.run();
  t.pass();
});


test('restart', async t => {
  const app = await createApp();
  await app.run();
  await app.restart();
  t.pass();
});

test('unused app should be deleted from getAllApps', async (t) => {
  const app1 = await createApp();
  await app1.run();
  await app1.close();
  await wait(5000);
  const app2 = await createApp();
  const uuid = app2.identity.uuid;
  const allBefore = await app1.fin.System.getAllApplications();
  const relBefore = allBefore.filter(a => a.uuid === uuid);
  t.is(relBefore.length, 2);
  await app2.run();
  const all = await app1.fin.System.getAllApplications();
  const rel = all.filter(a => a.uuid === uuid);
  t.is(rel.length, 1);
});

test.afterEach.always(reset);