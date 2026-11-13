import { Style } from '@acusti/styling';
import { lazy, startTransition, useEffect, useState } from 'react';

import a from './a.css?style';
import b from './b.css?style';

const More = lazy(() => import('./More.tsx'));

export default function App() {
    const [isHydrated, setIsHydrated] = useState(false);
    const [isShowingMore, setIsShowingMore] = useState(false);

    useEffect(() => {
        // oxlint-disable-next-line react/set-state-in-effect -- the flag the tests wait on, set once hydration has run effects
        setIsHydrated(true);
    }, []);

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <title>@acusti/styling e2e</title>
            </head>
            <body>
                <Style sheet={a} />
                <Style sheet={b} />
                <p className="a">styled by a</p>
                <p className="b">styled by b</p>
                <button
                    data-hydrated={isHydrated}
                    onClick={() => startTransition(() => setIsShowingMore(true))}
                    type="button"
                >
                    Show more
                </button>
                {/* no Suspense boundary, as on a page that has none below its root */}
                {isShowingMore ? <More /> : null}
            </body>
        </html>
    );
}
