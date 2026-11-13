// happy-dom reflects the `popover` attribute but doesn’t implement the Popover
// API methods, so components that render their content in the top layer (e.g.
// @acusti/dropdown) can’t call showPopover() under test. Polyfill the methods
// as no-ops in any DOM-backed test environment; node-environment tests have no
// HTMLElement and skip it.
if (
    typeof HTMLElement !== 'undefined' &&
    typeof HTMLElement.prototype.showPopover !== 'function'
) {
    HTMLElement.prototype.showPopover = function showPopover() {
        // no-op: happy-dom has no top layer
    };
    HTMLElement.prototype.hidePopover = function hidePopover() {
        // no-op: happy-dom has no top layer
    };
    HTMLElement.prototype.togglePopover = function togglePopover(force) {
        const willShow = typeof force === 'boolean' ? force : true;
        return willShow;
    };
}
