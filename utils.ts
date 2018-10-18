import * as c_p from 'child_process';
import {createReadStream} from 'fs';
import {Application, connect, Fin, launch} from 'hadouken-js-adapter';

const version = '99.99.99.99';
const id = Date.now();
let runtimeCount = 0;
let count = 0;
let apps: DecoratedApp[] = [];
let fins: Fin[] = [];

export const getIdentity = () => {
  const uuid = `${count}-${id}`;
  return {
    uuid,
    name: uuid,
    mainWindowOptions: {url: 'http://www.bing.com', autoshow: true}
  };
};

export const wait = (t = 1000) => new Promise(r => setTimeout(r, t));

export const createRuntime = (() => {
  let prev: Promise<Fin|void> = Promise.resolve();
  return async () => {
    const connCount = runtimeCount++;
    let timer: NodeJS.Timer;
    const next =
        prev.then(() => {
              console.log('creating runtime', connCount);
              timer = setTimeout(() => {
                throw new Error('connection timeout error');
              }, 30000);
            })
            .then(() => connect({
                    uuid: `testConn${connCount}-${id}`,
                    runtime: {
                      version,
                      securityRealm: `realm${connCount}-${id}`,
                      arguments: `--enforce-uuid-uniqueness --v=1`
                    }
                  }))
            .then(fin => {
              console.log('connected to runtime', connCount);
              clearTimeout(timer);
              return fin;
            });
    prev = next;
    return next;
  };
})();

export const createApp = async(delay = 0): Promise<DecoratedApp> => {
  const fin = await createRuntime();
  if (delay) {
    await wait(delay);
  }
  const app = await fin.Application.create(getIdentity()) as DecoratedApp;
  app.fin = fin;
  apps.push(app);
  fins.push(fin);
  return app;
};
export interface DecoratedApp extends Application {
  fin: Fin;
}

export const reset = async () => {
  count++;
  await Promise.all(
      apps.map(async a => (await a.isRunning()) ? await a.close(true) : null));
  apps = [];
  //@ts-ignore
  await Promise.all(fins.map((f: Fin) => f.wire.wire.shutdown()));
  fins = [];
  console.log('next');
};