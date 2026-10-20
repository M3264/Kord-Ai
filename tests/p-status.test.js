const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const now = 1800000000000;
const fixture = {
  pm_id: 0, name: 'kord-v2',
  pm2_env: { status: 'online', exec_mode: 'fork_mode', version: '2.0.0', pm_uptime: now - 14400000, restart_time: 120 },
  monit: { cpu: 2.5, memory: 134217728 }
};

async function runStatus(options = {}) {
  const messages = [];
  const calls = { disconnect: 0 };
  let handler;
  const pm2 = options.pm2 || {
    connect(cb) { cb(options.connectError); },
    describe(name, cb) {
      assert.equal(name, 'kord-v2');
      cb(options.describeError, options.processes ?? [fixture]);
    },
    disconnect() { calls.disconnect++; }
  };
  const core = {
    kord(meta, fn) { if (meta.cmd === 'p-status') handler = fn; },
    secondsToHms: seconds => `${Math.floor(seconds / 3600)}h`,
  };
  const context = {
    require(name) {
      if (name === '../core') return core;
      if (name === '../core/db') return {};
      if (name === 'pm2') return pm2;
      if (name === 'child_process') return { exec(command, cb) {
        // Reproduces FORCE_COLOR=1 PM2 output, including ANSI-only cells.
        cb(null, '\u001b[90m│\u001b[39m 0 \u001b[90m│\u001b[39m kord-v2 \u001b[90m│\u001b[39m default \u001b[90m│\u001b[39m 2.0.0 \u001b[90m│\u001b[39m fork \u001b[90m│\u001b[39m 42 \u001b[90m│\u001b[39m 4h \u001b[90m│\u001b[39m 120 \u001b[90m│\u001b[39m online \u001b[90m│\u001b[39m 2.5% \u001b[90m│\u001b[39m 128mb \u001b[90m│\u001b[39m');
      } };
      return require(name);
    },
    Date: class extends Date { static now() { return now; } },
    console: { error() {}, log() {} }, process,
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../cmds/me.js'), 'utf8'), context);
  await handler({ send: async message => { messages.push(message); } });
  await new Promise(resolve => setImmediate(resolve));
  return { messages, calls };
}

test('p-status uses correct PM2 fields without terminal colour codes', async () => {
  const { messages } = await runStatus();
  assert.equal(messages.length, 1);
  const message = messages[0];
  assert.doesNotMatch(message, /\u001b/);
  for (const line of [
    '*Process #0*: kord-v2', '✓ *Status*: online', '*𝌫 Mode*: fork',
    '*𝌫 CPU*: 2.5%', '*𝌫 Memory*: 128.00 MB', '*𝌫 Uptime*: 4h',
    '*𝌫 Version*: 2.0.0', '*𝌫 Restarts*: 120'
  ]) assert.ok(message.includes(line), `Missing ${line} in ${message}`);
});

test('p-status releases its PM2 connection', async () => {
  const { calls } = await runStatus();
  assert.equal(calls.disconnect, 1);
});

test('p-status reports no matching process', async () => {
  const { messages, calls } = await runStatus({ processes: [] });
  assert.deepEqual(messages, ['No Kord processes found running.']);
  assert.equal(calls.disconnect, 1);
});

test('p-status reports connection failures', async () => {
  const { messages } = await runStatus({ connectError: new Error('connection failed') });
  assert.deepEqual(messages, ['Error: Error: connection failed']);
});

test('p-status reports describe failures and disconnects', async () => {
  const { messages, calls } = await runStatus({ describeError: new Error('lookup failed') });
  assert.deepEqual(messages, ['Error: Error: lookup failed']);
  assert.equal(calls.disconnect, 1);
});

test('p-status handles missing metrics and stopped processes', async () => {
  const { messages } = await runStatus({ processes: [{
    pm_id: 1, name: 'kord-v2', pm2_env: { status: 'stopped', pm_uptime: now - 100000 }
  }] });
  for (const line of ['✗ *Status*: stopped', '*𝌫 CPU*: 0%', '*𝌫 Memory*: 0.00 MB',
    '*𝌫 Uptime*: 0s', '*𝌫 Version*: N/A', '*𝌫 Restarts*: 0']) {
    assert.ok(messages[0].includes(line), line);
  }
  assert.doesNotMatch(messages[0], /undefined|NaN/);
});

test('p-status displays multiple workers separately', async () => {
  const { messages } = await runStatus({ processes: [fixture, {
    ...fixture, pm_id: 2, pm2_env: { ...fixture.pm2_env, exec_mode: 'cluster_mode' }
  }] });
  assert.ok(messages[0].includes('*Process #0*: kord-v2'));
  assert.ok(messages[0].includes('*Process #2*: kord-v2'));
  assert.ok(messages[0].includes('*𝌫 Mode*: cluster'));
  assert.ok(messages[0].includes('─'.repeat(20)));
});
