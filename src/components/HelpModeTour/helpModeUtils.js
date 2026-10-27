/**
 * Shared helpers for the help mode steps used by `HelpModeTour` and `HelpModeHover`.
 */

/**
 * The areas a help step can belong to, in display order.
 * A step sets its `area` to one of the keys.
 */
const HELP_MODE_AREAS = [
  { key: 'toolbar', label: 'Toolbar' },
  { key: 'panel-header', label: 'Panel header' },
  { key: 'map-info', label: 'Map info' },
  { key: 'legends', label: 'Legends & layers' },
  { key: 'zoom', label: 'Zoom' },
  { key: 'map-settings', label: 'Map settings' },
  { key: 'drawing', label: 'Drawing' },
  { key: 'animation', label: 'Animation' },
];

const resolveTarget = (step) => {
  if (!step?.target) return undefined;
  return typeof step.target === 'function' ? step.target() : step.target;
};

const isStepAvailable = (step) => {
  if (!step?.target) return true;
  const el = resolveTarget(step);
  return !!(el && el.isConnected && el.getClientRects().length > 0);
};

/**
 * Where to mount the overlays, inside the fullscreen element when there is one
 * as anything outside of it is not visible.
 */
const getOverlayParent = () => document.fullscreenElement || 'body';

/**
 * Returns the areas, in display order, with at least one step which can be shown.
 * Steps with `onEnter` are counted as their target may only appear after `onEnter`.
 */
const getHelpModeAreas = (steps) => {
  const keys = new Set(
    steps.filter((step) => step.onEnter || isStepAvailable(step)).map((step) => step.area),
  );
  return HELP_MODE_AREAS.filter((area) => keys.has(area.key));
};

export { HELP_MODE_AREAS, resolveTarget, isStepAvailable, getOverlayParent, getHelpModeAreas };
