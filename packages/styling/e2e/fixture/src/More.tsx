import { Style, StyleText } from '@acusti/styling';

import c from './c.css?style';

// a component the server render never draws, in a lazy chunk of its own
export default function More() {
    return (
        <>
            <Style sheet={c} />
            {/* rendered after c.css, so it must land after it to win */}
            <StyleText href="tokens">{'.c { color: rgb(0, 0, 255); }'}</StyleText>
            <p className="c">styled by c</p>
        </>
    );
}
