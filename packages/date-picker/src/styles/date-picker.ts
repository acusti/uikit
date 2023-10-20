export const ROOT_CLASS_NAME = 'uktdatepicker';

export const STYLES = `
.${ROOT_CLASS_NAME} {
    display: flex;
    box-sizing: border-box;
    padding: 40px 60px 60px;
    flex: 1 1 auto;
    position: relative;
    max-width: 450px;
}

.${ROOT_CLASS_NAME}.two-up {
    max-width: 820px;
}

.${ROOT_CLASS_NAME}-range-arrow-wrap {
    position: absolute;
    top: 30px;
    left: 0px;
    display: flex;
    justify-content: space-between;
    height: 0px;
    width: 100%;
    padding: 0px 60px;
    box-sizing: border-box;
}

.${ROOT_CLASS_NAME}-range-arrow {
    width: 35px;
    height: 35px;
    text-align: center;
    cursor: pointer;
}

.${ROOT_CLASS_NAME}-range-arrow.disabled {
    color: #ccc;
    cursor: default;
}

.${ROOT_CLASS_NAME}-range-arrow:active {
    transform: translateY(1px);
}

.${ROOT_CLASS_NAME}-range-arrow.left-arrow:after,
.${ROOT_CLASS_NAME}-range-arrow.right-arrow:after {
    content: "‹";
    font-size: 24px;
    line-height: 35px;
    font-weight: bold;
}

.${ROOT_CLASS_NAME}-range-arrow.right-arrow:after {
    content: "›";
}

.${ROOT_CLASS_NAME}-month-container {
    display: flex;
    flex: 1 1 auto;
    justify-content: space-between;
}
`;
