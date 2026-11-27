import { RuntimeStyle, Style } from '@acusti/sheets';
import { Later } from '@fixture/ui';

import c from './c.css?sheet';

// a component the server render never draws, in a lazy chunk of its own
export default function More() {
    return (
        <>
            <Style sheet={c} />
            {/* rendered after c.css, so it must land after it to win */}
            <RuntimeStyle href="tokens">{'.c { color: rgb(0, 0, 255); }'}</RuntimeStyle>
            <p className="c">styled by c</p>
            <Later />
        </>
    );
}
