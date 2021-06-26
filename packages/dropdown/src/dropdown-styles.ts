import { SYSTEM_UI_FONT } from '@acusti/styling';

export const ROOT_CLASS_NAME = 'uktdropdown';
export const TRIGGER_CLASS_NAME = `${ROOT_CLASS_NAME}-trigger`;
export const BODY_CLASS_NAME = `${ROOT_CLASS_NAME}-body`;

export const ROOT_SELECTOR = `.${ROOT_CLASS_NAME}`;
export const TRIGGER_SELECTOR = `.${TRIGGER_CLASS_NAME}`;
export const BODY_SELECTOR = `.${BODY_CLASS_NAME}`;

export const STYLES = `
:root {
    --uktdropdown-font-family: ${SYSTEM_UI_FONT};
    --uktdropdown-body-bg-color: white;
    --uktdropdown-body-bg-color-hover: rgb(105, 162, 249);
    --uktdropdown-body-color-hover: white;
    --uktdropdown-body-pad-bottom: 10px;
    --uktdropdown-body-pad-left: 12px;
    --uktdropdown-body-pad-right: 12px;
    --uktdropdown-body-pad-top: 10px;
}
${ROOT_SELECTOR},
${TRIGGER_SELECTOR} {
    font-family: var(--uktdropdown-font-family);
}
${ROOT_SELECTOR} {
    position: relative;
}
${ROOT_SELECTOR} > * {
    cursor: default;
}
${BODY_SELECTOR} {
    box-sizing: border-box;
    position: absolute;
    left: 0px;
    top: 100%;
    max-height: calc(100vh - 50px);
    overflow: auto;
    padding-bottom: var(--uktdropdown-body-pad-bottom);
    padding-left: var(--uktdropdown-body-pad-left);
    padding-right: var(--uktdropdown-body-pad-right);
    padding-top: var(--uktdropdown-body-pad-top);
    background-color: var(--uktdropdown-body-bg-color);
    box-shadow: 0px 8px 18px rgba(0, 0, 0, 0.25);
    user-select: none;
}
${BODY_SELECTOR} [data-ukt-active] {
    background-color: var(--uktdropdown-body-bg-color-hover);
    color: var(--uktdropdown-body-color-hover);
}
`;
