import { Style } from '@acusti/styling';

import laterSheet from './later.css?sheet';

// a library component only the app’s lazy chunk renders
export default function Later() {
    return (
        <>
            <Style sheet={laterSheet} />
            <p className="later">styled by the library, later</p>
        </>
    );
}
