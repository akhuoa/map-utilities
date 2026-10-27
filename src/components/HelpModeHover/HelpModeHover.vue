<template>
  <teleport :to="appendTo">
    <div v-if="modelValue" class="help-mode-hover" :style="{ zIndex }">
      <svg class="help-mode-hover__mask" :viewBox="`0 0 ${viewport.width} ${viewport.height}`">
        <path :d="maskPath" fill-rule="evenodd" />
      </svg>
      <div class="help-mode-hover__banner" :style="bannerStyle">
        <span>Hover over a highlighted control to see what it does.</span>
        <el-button size="small" class="help-mode-hover__exit" @click="close">Exit</el-button>
      </div>
      <el-popover
        :visible="popoverVisible"
        :virtual-ref="currentElement"
        virtual-triggering
        :placement="currentStep?.placement || 'bottom'"
        :width="320"
        :popper-style="{ zIndex: zIndex + 1 }"
        :append-to="appendTo"
        popper-class="help-mode-hover__popper"
      >
        <div v-if="currentStep">
          <div class="help-mode-tour__header">
            <span v-if="currentStep.group" class="help-mode-tour__group">
              {{ currentStep.group }}
            </span>
            <span class="help-mode-tour__title">{{ currentStep.title }}</span>
          </div>
          <div class="help-mode-hover__description">{{ currentStep.description }}</div>
        </div>
      </el-popover>
    </div>
  </teleport>
</template>

<script>
/**
 * The reverse of `HelpModeTour`: the container is greyed out except the controls
 * with help, which are outlined. Hovering over one of them shows its help.
 * The mask blocks the mouse everywhere else in the container, so only the controls
 * with help can be hovered or clicked. The page outside the container, e.g. when
 * the viewer is embedded in a longer page, can still be used and scrolled.
 *
 * It uses the same steps as `HelpModeTour`. Steps without a target or with
 * `hover: false` are ignored. `onEnter` of all the steps is called when the
 * hover help starts, to show their targets, and `onLeave` when it stops.
 * Press Escape or click "Exit" to leave.
 */
import { resolveTarget, isStepAvailable, getOverlayParent } from '../HelpModeTour/helpModeUtils.js';

const TARGET_CLASS = 'help-mode-hover-target';
// Set on the root element while the hover help is on
const ACTIVE_CLASS = 'help-mode-hover-active';
// Set on the root element while a target is under the mouse, for the targets which
// do not receive the mouse, the element under them inherits the cursor
const OVER_CLASS = 'help-mode-hover-over';
// Space around a target, to show its outline
const HOLE_PADDING = 6;
const HOLE_RADIUS = 4;
// Targets can move without a mouse event, e.g. an opening drawer
const REFRESH_INTERVAL = 250;
// Distance of the banner from the top of the visible part of the container
const BANNER_OFFSET = 12;

const isInside = (inner, outer) =>
  inner.left >= outer.left &&
  inner.top >= outer.top &&
  inner.right <= outer.right &&
  inner.bottom <= outer.bottom;

const pad = ({ left, top, right, bottom }, padding) => ({
  left: left - padding,
  top: top - padding,
  right: right + padding,
  bottom: bottom + padding,
});

const intersect = (a, b) => ({
  left: Math.max(a.left, b.left),
  top: Math.max(a.top, b.top),
  right: Math.min(a.right, b.right),
  bottom: Math.min(a.bottom, b.bottom),
});

const isEmpty = ({ left, top, right, bottom }) => right <= left || bottom <= top;

const roundedRectPath = ({ left, top, right, bottom }) => {
  const x = left;
  const y = top;
  const w = right - left;
  const h = bottom - top;
  const r = Math.min(HOLE_RADIUS, w / 2, h / 2);
  return (
    `M${x + r},${y}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}` +
    `a${r},${r} 0 0 1 -${r},${r}h-${w - 2 * r}a${r},${r} 0 0 1 -${r},-${r}` +
    `v-${h - 2 * r}a${r},${r} 0 0 1 ${r},-${r}z`
  );
};

export default {
  name: 'HelpModeHover',
  props: {
    /**
     * Show or hide the hover help (v-model).
     */
    modelValue: {
      type: Boolean,
      default: false,
    },
    /**
     * The list of help steps, see `HelpModeTour` for the shape.
     */
    steps: {
      type: Array,
      default: () => [],
    },
    /**
     * The element to grey out, or a function returning it. Defaults to the whole window.
     */
    container: {
      type: [Object, Function],
      default: undefined,
    },
    /**
     * z-index of the banner and the popover.
     */
    zIndex: {
      type: Number,
      default: 3000,
    },
  },
  emits: ['update:modelValue', 'change', 'close'],
  data: function () {
    return {
      // The last hovered step, kept while the popover fades out so it keeps its content and position
      currentStep: null,
      currentElement: null,
      popoverVisible: false,
      holes: [],
      // The greyed out area, in viewport coordinates
      area: { left: 0, top: 0, right: 0, bottom: 0 },
      viewport: { width: 0, height: 0 },
      appendTo: 'body',
    };
  },
  computed: {
    maskPath: function () {
      const { left, top, right, bottom } = this.area;
      const outer = `M${left},${top}H${right}V${bottom}H${left}z`;
      return [outer, ...this.holes.map(roundedRectPath)].join('');
    },
    bannerStyle: function () {
      const visible = intersect(this.area, {
        left: 0,
        top: 0,
        right: this.viewport.width,
        bottom: this.viewport.height,
      });
      return {
        top: `${Math.max(visible.top, 0) + BANNER_OFFSET}px`,
        left: `${(visible.left + visible.right) / 2}px`,
      };
    },
  },
  watch: {
    modelValue: {
      handler: function (value) {
        if (value) {
          this.start();
        } else {
          this.stop();
        }
      },
      immediate: true,
    },
  },
  created: function () {
    this.outlined = new Set();
    this.refreshRequest = 0;
    this.moveRequest = 0;
    this.refreshTimer = 0;
  },
  beforeUnmount: function () {
    this.stop();
  },
  methods: {
    hoverSteps: function () {
      return this.steps.filter((step) => step.target && step.hover !== false);
    },
    start: function () {
      this.appendTo = getOverlayParent();
      this.enteredSteps = this.hoverSteps();
      this.enteredSteps.forEach((step) => step.onEnter?.());
      document.documentElement.classList.add(ACTIVE_CLASS);
      document.addEventListener('mousemove', this.onMouseMove, { capture: true, passive: true });
      document.addEventListener('keydown', this.onKeyDown, true);
      document.addEventListener('scroll', this.requestRefresh, { capture: true, passive: true });
      document.addEventListener('fullscreenchange', this.onFullscreenChange);
      window.addEventListener('resize', this.requestRefresh);
      this.refreshTimer = setInterval(this.refreshTargets, REFRESH_INTERVAL);
      this.$nextTick(() => this.refreshTargets());
    },
    stop: function () {
      document.documentElement.classList.remove(ACTIVE_CLASS, OVER_CLASS);
      document.removeEventListener('mousemove', this.onMouseMove, { capture: true });
      cancelAnimationFrame(this.moveRequest);
      document.removeEventListener('keydown', this.onKeyDown, true);
      document.removeEventListener('scroll', this.requestRefresh, { capture: true });
      document.removeEventListener('fullscreenchange', this.onFullscreenChange);
      window.removeEventListener('resize', this.requestRefresh);
      clearInterval(this.refreshTimer);
      cancelAnimationFrame(this.refreshRequest);
      this.enteredSteps?.forEach((step) => step.onLeave?.());
      this.enteredSteps = [];
      this.outlined?.forEach((el) => el.classList.remove(TARGET_CLASS));
      this.outlined?.clear();
      this.popoverVisible = false;
      this.currentStep = null;
      this.currentElement = null;
      this.holes = [];
    },
    /**
     * Outline the available targets and cut a hole in the mask for each of them,
     * targets may appear or disappear while the user interacts with the page,
     * e.g. when a drawer is opened.
     */
    refreshTargets: function () {
      const elements = new Set(
        this.hoverSteps()
          .filter((step) => isStepAvailable(step))
          .map((step) => resolveTarget(step)),
      );
      this.outlined.forEach((el) => {
        if (!elements.has(el)) el.classList.remove(TARGET_CLASS);
      });
      elements.forEach((el) => el.classList.add(TARGET_CLASS));
      this.outlined = elements;
      this.updateHoles(elements);
    },
    getArea: function () {
      const container = typeof this.container === 'function' ? this.container() : this.container;
      if (container?.getBoundingClientRect) {
        const { left, top, right, bottom } = container.getBoundingClientRect();
        return { left, top, right, bottom };
      }
      return { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    },
    /**
     * Only the outermost targets get a hole, the nested ones are already
     * uncovered and overlapping holes would cancel out with the even-odd rule.
     * Holes are kept inside the greyed out area for the same reason.
     */
    updateHoles: function (elements) {
      const area = this.getArea();
      const rects = [...elements]
        .map((el) => intersect(pad(el.getBoundingClientRect(), HOLE_PADDING), area))
        .filter((rect) => !isEmpty(rect));
      this.holes = rects.filter(
        (rect, index) =>
          !rects.some(
            (other, otherIndex) =>
              otherIndex !== index &&
              isInside(rect, other) &&
              // keep one of identical rects
              !(isInside(other, rect) && otherIndex > index),
          ),
      );
      this.area = area;
      this.viewport = { width: window.innerWidth, height: window.innerHeight };
    },
    requestRefresh: function () {
      cancelAnimationFrame(this.refreshRequest);
      this.refreshRequest = requestAnimationFrame(() => this.refreshTargets());
    },
    /**
     * Find the step of the innermost target containing the element.
     */
    /**
     * Find the step of the innermost target at the position. The position is used
     * rather than the element under the mouse, as disabled controls often have
     * `pointer-events: none` and never receive the mouse, but their help is still shown.
     */
    findStepAt: function (x, y) {
      const matches = this.hoverSteps()
        .filter((step) => isStepAvailable(step))
        .map((step) => {
          const el = resolveTarget(step);
          const { left, top, right, bottom } = el.getBoundingClientRect();
          return { step, el, left, top, right, bottom, size: (right - left) * (bottom - top) };
        })
        .filter(
          ({ left, top, right, bottom }) => x >= left && x <= right && y >= top && y <= bottom,
        );
      return matches.reduce(
        (smallest, match) => (!smallest || match.size < smallest.size ? match : smallest),
        null,
      );
    },
    onMouseMove: function (event) {
      if (!this.modelValue) return;
      const { clientX, clientY, target } = event;
      cancelAnimationFrame(this.moveRequest);
      this.moveRequest = requestAnimationFrame(() => this.updateHover(clientX, clientY, target));
    },
    updateHover: function (x, y, element) {
      this.refreshTargets();
      if (element?.closest?.('.help-mode-hover__popper, .help-mode-hover__banner')) return;
      // The mask covers the parts of the targets outside of the greyed out area
      const match = element?.closest?.('.help-mode-hover__mask') ? null : this.findStepAt(x, y);
      document.documentElement.classList.toggle(OVER_CLASS, !!match);
      if (!match) {
        this.popoverVisible = false;
        return;
      }
      if (this.popoverVisible && match.step === this.currentStep) return;
      this.currentStep = match.step;
      this.currentElement = match.el;
      this.popoverVisible = true;
      this.$emit('change', match.step);
    },
    onFullscreenChange: function () {
      this.appendTo = getOverlayParent();
      this.requestRefresh();
    },
    onKeyDown: function (event) {
      if (event.key === 'Escape') this.close();
    },
    close: function () {
      this.$emit('close', this.currentStep);
      this.$emit('update:modelValue', false);
    },
  },
};
</script>

<style lang="scss">
.help-mode-hover-target {
  outline: 2px dashed $app-primary-color !important;
  outline-offset: 2px;
}

html.help-mode-hover-over {
  cursor: help;
}

// More specific than the components' own cursors, e.g. `not-allowed` on disabled controls
html.help-mode-hover-active .help-mode-hover-target {
  &,
  * {
    cursor: help !important;
  }
}

.help-mode-hover__mask {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: inherit;
  // Only the masked area catches the mouse, the holes let it through to the targets
  pointer-events: none;

  path {
    fill: rgba(0, 0, 0, 0.5);
    pointer-events: auto;
  }
}

.help-mode-hover__banner {
  position: fixed;
  transform: translateX(-50%);
  z-index: inherit;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px 8px 16px;
  font-family: $font-family;
  font-size: 14px;
  color: $grey;
  background-color: white;
  border: 1px solid $app-primary-color;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  .help-mode-hover__exit.el-button {
    font-family: inherit;
    color: $app-primary-color;
    background-color: #f3e6f9;
    border-color: $app-primary-color;

    &:hover {
      color: white;
      background-color: #ac76c5;
      border-color: #ac76c5;
    }
  }
}

.el-popover.el-popper.help-mode-hover__popper {
  padding: 16px;
  font-family: $font-family;
  border: 1px solid $app-primary-color;
  border-radius: 4px;
  pointer-events: none;

  .el-popper__arrow::before {
    border-color: $app-primary-color;
  }

  .help-mode-hover__description {
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.5;
    color: $grey;
  }
}
</style>
