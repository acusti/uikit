import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const rootDir = process.cwd();
const [modeOrScriptName, ...initialArgs] = process.argv.slice(2);
const mode = modeOrScriptName === 'exec' ? 'exec' : 'script';
const scriptName = mode === 'exec' ? initialArgs[0] : modeOrScriptName;
const rawArgs = mode === 'exec' ? initialArgs.slice(1) : initialArgs;

if (!scriptName) {
    console.error(
        'Usage: node ./scripts/run-workspaces.mjs [exec] <script-or-bin> [--exclude <package-name>] [-- <args>]',
    );
    process.exit(1);
}

const excludes = new Set();
const childArgs = [];
let parsingChildArgs = false;

for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === '--') {
        parsingChildArgs = true;
        continue;
    }

    if (parsingChildArgs) {
        childArgs.push(arg);
        continue;
    }

    if (arg === '--exclude') {
        const packageName = rawArgs[index + 1];

        if (!packageName) {
            console.error('Missing value for --exclude');
            process.exit(1);
        }

        excludes.add(packageName);
        index += 1;
        continue;
    }

    console.error(`Unknown argument: ${arg}`);
    process.exit(1);
}

const rootManifest = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'));
const workspacePatterns = Array.isArray(rootManifest.workspaces)
    ? rootManifest.workspaces
    : (rootManifest.workspaces?.packages ?? []);

const workspaceDirs = [];

for (const pattern of workspacePatterns) {
    if (!pattern.endsWith('/*')) {
        console.error(`Unsupported workspace pattern: ${pattern}`);
        process.exit(1);
    }

    const baseDir = path.join(rootDir, pattern.slice(0, -2));
    const entries = await fs.readdir(baseDir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            workspaceDirs.push(path.join(baseDir, entry.name));
        }
    }
}

const workspaces = [];

for (const workspaceDir of workspaceDirs) {
    const manifestPath = path.join(workspaceDir, 'package.json');

    try {
        const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

        if (!manifest.name) {
            continue;
        }

        workspaces.push({
            dir: workspaceDir,
            manifest,
            name: manifest.name,
        });
    } catch (error) {
        if (error?.code !== 'ENOENT') {
            throw error;
        }
    }
}

const selectedWorkspaces = workspaces.filter((workspace) => !excludes.has(workspace.name));
const selectedNames = new Set(selectedWorkspaces.map((workspace) => workspace.name));

const dependencySections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
const adjacency = new Map(selectedWorkspaces.map((workspace) => [workspace.name, []]));
const inDegree = new Map(selectedWorkspaces.map((workspace) => [workspace.name, 0]));

for (const workspace of selectedWorkspaces) {
    for (const section of dependencySections) {
        const dependencies = workspace.manifest[section] ?? {};

        for (const dependencyName of Object.keys(dependencies)) {
            if (!selectedNames.has(dependencyName)) {
                continue;
            }

            adjacency.get(dependencyName).push(workspace.name);
            inDegree.set(workspace.name, inDegree.get(workspace.name) + 1);
        }
    }
}

const queue = selectedWorkspaces
    .map((workspace) => workspace.name)
    .filter((name) => inDegree.get(name) === 0);
const orderedNames = [];

while (queue.length > 0) {
    const name = queue.shift();
    orderedNames.push(name);

    for (const dependent of adjacency.get(name)) {
        inDegree.set(dependent, inDegree.get(dependent) - 1);

        if (inDegree.get(dependent) === 0) {
            queue.push(dependent);
        }
    }
}

if (orderedNames.length !== selectedWorkspaces.length) {
    console.error('Could not determine a topological workspace order.');
    process.exit(1);
}

const workspaceByName = new Map(selectedWorkspaces.map((workspace) => [workspace.name, workspace]));

for (const name of orderedNames) {
    const workspace = workspaceByName.get(name);

    if (mode === 'script' && !workspace.manifest.scripts?.[scriptName]) {
        continue;
    }

    const commandLabel = mode === 'exec' ? `bun x ${scriptName}` : `bun run ${scriptName}`;
    process.stdout.write(`\n[${name}] ${commandLabel}\n`);

    const exitCode = await new Promise((resolve, reject) => {
        const command = mode === 'exec'
            ? ['x', scriptName, ...childArgs]
            : ['run', scriptName, ...childArgs];
        const child = spawn('bun', command, {
            cwd: workspace.dir,
            stdio: 'inherit',
        });

        child.on('error', reject);
        child.on('exit', resolve);
    });

    if (exitCode !== 0) {
        process.exit(exitCode ?? 1);
    }
}
