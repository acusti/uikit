import { SYSTEM_UI_FONT } from '@acusti/styling';

export const ROOT_CLASS_NAME = 'uktdropdown';
export const ROOT_SELECTOR = `.${ROOT_CLASS_NAME}`;

export const BODY_CLASS_NAME = `${ROOT_CLASS_NAME}-body`;
export const LABEL_CLASS_NAME = `${ROOT_CLASS_NAME}-label`;
export const LABEL_TEXT_CLASS_NAME = `${ROOT_CLASS_NAME}-label-text`;
export const TRIGGER_CLASS_NAME = `${ROOT_CLASS_NAME}-trigger`;

export const BODY_SELECTOR = `.${BODY_CLASS_NAME}`;
export const LABEL_SELECTOR = `.${LABEL_CLASS_NAME}`;
export const LABEL_TEXT_SELECTOR = `.${LABEL_TEXT_CLASS_NAME}`;
export const TRIGGER_SELECTOR = `.${TRIGGER_CLASS_NAME}`;

export const BODY_MAX_HEIGHT_VAR = '--uktdd-body-max-height';
export const BODY_MAX_WIDTH_VAR = '--uktdd-body-max-width';

export const STYLES = `
:root {
  --uktdd-font-family: ${SYSTEM_UI_FONT};
  --uktdd-body-bg-color: #fff;
  --uktdd-body-bg-color-hover: rgb(105,162,249);
  --uktdd-body-color-hover: #fff;
  --uktdd-body-buffer: 10px;
  ${BODY_MAX_HEIGHT_VAR}: calc(100vh - var(--uktdd-body-buffer));
  ${BODY_MAX_WIDTH_VAR}: calc(100vw - var(--uktdd-body-buffer));
  --uktdd-body-pad-bottom: 9px;
  --uktdd-body-pad-left: 12px;
  --uktdd-body-pad-right: 12px;
  --uktdd-body-pad-top: 9px;
  --uktdd-label-pad-right: 10px;
}
${ROOT_SELECTOR},
${TRIGGER_SELECTOR} {
  font-family: var(--uktdd-font-family);
}
${ROOT_SELECTOR} {
  position: relative;
  display: inline-block;
}
${ROOT_SELECTOR}.disabled {
  pointer-events: none;
}
${ROOT_SELECTOR} > * {
  cursor: default;
}
${LABEL_SELECTOR} {
  display: flex;
}
${LABEL_TEXT_SELECTOR} {
  padding-right: var(--uktdd-label-pad-right);
}
${BODY_SELECTOR} {
  box-sizing: border-box;
  position: absolute;
  top: 100%;
  max-height: var(${BODY_MAX_HEIGHT_VAR});
  min-height: 50px;
  max-width: var(${BODY_MAX_WIDTH_VAR});
  min-width: 100%;
  overflow: auto;
  z-index: 2;
  padding: var(--uktdd-body-pad-top) var(--uktdd-body-pad-right) var(--uktdd-body-pad-bottom) var(--uktdd-body-pad-left);
  background-color: var(--uktdd-body-bg-color);
  box-shadow: 0 8px 18px rgba(0,0,0,0.25);
}
${BODY_SELECTOR}.calculating-position {
  visibility: hidden;
}
${BODY_SELECTOR}.out-of-bounds-bottom:not(.out-of-bounds-top) {
  top: auto;
  bottom: 100%;
}
${BODY_SELECTOR}.out-of-bounds-right:not(.out-of-bounds-left) {
  left: auto;
  right: 0px;
}
${LABEL_SELECTOR} + ${BODY_SELECTOR} {
  left: auto;
  right: 0;
}
${BODY_SELECTOR}.has-items {
  user-select: none;
}
${BODY_SELECTOR} [data-ukt-active] {
  background-color: var(--uktdd-body-bg-color-hover);
  color: var(--uktdd-body-color-hover);
}
`;
