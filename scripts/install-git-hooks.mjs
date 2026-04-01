import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

function run(command, args, options = {}) {
    return spawnSync(command, args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        ...options,
    });
}

function info(message) {
    console.log(`hooks: ${message}`);
}

function warn(message) {
    console.warn(`hooks: ${message}`);
}

const hookFile = '.githooks/pre-commit';

if (!existsSync(hookFile)) {
    warn(`skipping setup because ${hookFile} was not found`);
    process.exit(0);
}

const gitVersion = run('git', ['--version']);
if (gitVersion.status !== 0) {
    warn('git is not available; skipping hook setup');
    process.exit(0);
}

const inRepo = run('git', ['rev-parse', '--is-inside-work-tree']);
if (inRepo.status !== 0 || inRepo.stdout.trim() !== 'true') {
    warn('not inside a git work tree; skipping hook setup');
    process.exit(0);
}

const currentHooksPath = run('git', ['config', '--get', 'core.hooksPath']);
if (currentHooksPath.status === 0 && currentHooksPath.stdout.trim() === '.githooks') {
    info('installed (.githooks)');
    process.exit(0);
}

const setHooksPath = run('git', ['config', '--local', 'core.hooksPath', '.githooks']);
if (setHooksPath.status !== 0) {
    const details = setHooksPath.stderr.trim();
    warn(`failed to set core.hooksPath to .githooks${details ? ` (${details})` : ''}`);
    process.exit(0);
}

const chmodResult = run('chmod', ['+x', hookFile]);
if (chmodResult.status !== 0) {
    // Non-fatal; file mode may still be usable depending on platform.
    const details = chmodResult.stderr.trim();
    if (details.length > 0) {
        warn(`could not mark ${hookFile} executable (${details})`);
    }
}

const hooksPath = run('git', ['config', '--get', 'core.hooksPath']);
if (hooksPath.status === 0) {
    info(`installed (${hooksPath.stdout.trim()})`);
    process.exit(0);
}

info('installed');
