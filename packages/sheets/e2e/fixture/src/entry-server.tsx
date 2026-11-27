import type { ServerResponse } from 'node:http';

import { renderToPipeableStream } from 'react-dom/server';

import App from './App.tsx';

export function render(response: ServerResponse, bootstrapModules: Array<string>) {
    const { pipe } = renderToPipeableStream(<App />, {
        bootstrapModules,
        onShellError(error) {
            response.statusCode = 500;
            response.end(String(error));
        },
        onShellReady() {
            response.setHeader('content-type', 'text/html; charset=utf-8');
            pipe(response);
        },
    });
}
