// Serves the fixture app, server-rendered: `--build` builds it first and
// serves the build, `--dev` serves it from Vite’s dev server.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 4173);
const server = createServer();

if (process.argv.includes('--dev')) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
        appType: 'custom',
        root,
        server: { hmr: { server }, middlewareMode: true },
    });
    server.on('request', (request, response) => {
        vite.middlewares(request, response, async () => {
            try {
                const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
                render(response, ['/@vite/client', '/src/entry-client.tsx']);
            } catch (error) {
                vite.ssrFixStacktrace(error);
                response.statusCode = 500;
                response.end(String(error?.stack ?? error));
            }
        });
    });
} else {
    if (process.argv.includes('--build')) {
        const { createBuilder } = await import('vite');
        const builder = await createBuilder({ logLevel: 'warn', root });
        await builder.buildApp();
    }
    const clientDirectory = join(root, 'dist/client');
    const manifest = JSON.parse(
        await readFile(join(clientDirectory, '.vite/manifest.json'), 'utf8'),
    );
    const { render } = await import(join(root, 'dist/server/entry-server.js'));
    const types = { '.css': 'text/css', '.js': 'text/javascript' };
    server.on('request', async (request, response) => {
        const { pathname } = new URL(request.url, 'http://localhost');
        if (!pathname.startsWith('/assets/')) {
            render(response, [`/${manifest['src/entry-client.tsx'].file}`]);
            return;
        }
        try {
            const file = join(clientDirectory, normalize(pathname));
            const body = await readFile(file);
            response.setHeader(
                'content-type',
                types[extname(file)] ?? 'application/octet-stream',
            );
            response.end(body);
        } catch {
            response.statusCode = 404;
            response.end('not found');
        }
    });
}

server.listen(port, () => console.log(`listening on http://localhost:${port}`));
