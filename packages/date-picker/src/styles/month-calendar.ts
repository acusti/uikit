export const ROOT_CLASS_NAME = 'uktmonthcalendar';

export const STYLES = `
.${ROOT_CLASS_NAME} {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    box-sizing: border-box;
    max-width: 325px;
}

.${ROOT_CLASS_NAME}-month-title {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    box-sizing: border-box;
    padding-bottom: 25px;
}

h3.${ROOT_CLASS_NAME}-month-title-text {
    font-size: 18px;
    line-height: 23px;
    font-weight: 600;
    color: #000;
    margin: 0px;
    text-align: center;
}

.${ROOT_CLASS_NAME}-month-week {
    flex: 0 0 auto;
    display: grid;
    grid-column-gap: 0px;
    grid-template-columns: repeat(auto-fit, minmax(46px, 1fr));
    grid-auto-flow: dense;
    box-sizing: border-box;
    padding-bottom: 12px;
}

.${ROOT_CLASS_NAME}-month-week .week-day-item {
    flex: 1 1 auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

.${ROOT_CLASS_NAME}-month-week span.week-day-item-text {
    text-align: center;
    font-size: 13px;
    line-height: 21px;
    margin: 0px;
    color: #9a9a9a;
}

.${ROOT_CLASS_NAME}-month-days {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
}

.${ROOT_CLASS_NAME}-month-row {
    flex: 1 1 auto;
    display: grid;
    grid-column-gap: 0px;
    grid-template-columns: repeat(auto-fit, minmax(46px, 1fr));
    grid-auto-flow: dense;
    margin-bottom: 1px;
}

.${ROOT_CLASS_NAME}-month-day-item {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    height: 46px;
    width: 46px;
    cursor: pointer;
    border: none;
    background-color: transparent;
}

.${ROOT_CLASS_NAME}-month-day-item.is-selected {
    background-color: #f8f8f8;
}

.${ROOT_CLASS_NAME}-month-day-item.start-date {
    background-color: #f8f8f8;
    border-top-left-radius: 50%;
    border-bottom-left-radius: 50%;
}

.${ROOT_CLASS_NAME}-month-day-item.start-date:after {
    background-color: #000;
    opacity: 1;
    visibility: visible;
}
.${ROOT_CLASS_NAME}-month-day-item.start-date span.month-day-item-text {
    color: #fff;
}

.${ROOT_CLASS_NAME}-month-day-item.end-date {
    background-color: #f8f8f8;
    border-top-right-radius: 50%;
    border-bottom-right-radius: 50%;
}

.${ROOT_CLASS_NAME}-month-day-item.end-date:after {
    background-color: #000;
    opacity: 1;
    visibility: visible;
}
.${ROOT_CLASS_NAME}-month-day-item.end-date span.month-day-item-text {
    color: #fff;
}

.${ROOT_CLASS_NAME}-month-day-item:hover:after {
    opacity: 1;
    visibility: visible;
}

.${ROOT_CLASS_NAME}-month-day-item:after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    border-radius: 50%;
    border: 1px solid #000;
    width: 43px;
    height: 43px;
    transition: opacity 0.25s ease-in-out;
    opacity: 0;
    visibility: hidden;
}

.${ROOT_CLASS_NAME}-month-day-item.is-empty:after {
    content: none;
}

.${ROOT_CLASS_NAME}-month-day-item span.month-day-item-text {
    text-align: center;
    font-size: 13px;
    line-height: 21px;
    margin: 0px;
    color: #000;
    position: relative;
    z-index: 1;
}
`;
