import { Style } from '@acusti/styling';

import badgeSheet from './badge.css?sheet';

export default function Badge({ children }: { children: string }) {
    return (
        <>
            <Style sheet={badgeSheet} />
            <span className="badge">{children}</span>
        </>
    );
}
