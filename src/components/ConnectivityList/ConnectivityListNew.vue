<template>
  <div ref="connectivityList" class="connectivity-list">
    <!-- Error Popover -->
    <el-popover
      width="250"
      :show-arrow="false"
      trigger="manual"
      :teleported="false"
      placement="bottom-start"
      :visible="connectivityError.hasError && !!connectivityError.errorMessage"
      :popper-class="connectivityError.errorType === 'warning' ? 'connectivity-warning-container' : 'connectivity-error-container'"
    >
      <template #reference>
        <div class="connectivity-alert"
          :style="{ top: alertTop + 'px', left: alertLeft + 'px' }">
        </div>
      </template>
      <template #default>
        <span v-html="connectivityError.errorMessage"></span>
      </template>
    </el-popover>

    <!-- Origins -->
    <div v-if="origins && originsCombinations.length > 0" class="block">
      <div class="attribute-title-container">
        <span class="attribute-title">Origin</span>
        <el-popover
          width="250"
          trigger="hover"
          :teleported="false"
          popper-class="popover-origin-help"
        >
          <template #reference>
            <el-icon class="info"><el-icon-warning /></el-icon>
          </template>
          <span style="word-break: keep-all">
            <i>Origin</i> {{ originDescription }}
          </span>
        </el-popover>
      </div>
      <div
        v-for="(origin, i) in processedOriginsCombinations"
        class="attribute-content"
        :origin-item-label="origin.mapLabel"
        :key="origin.mapLabel + '-' + i"
        @mouseenter="onConnectivityHovered(origin, $event)"
        @mouseleave="onConnectivityHovered()"
      >
        <el-popover
          width="150"
          trigger="hover"
          :teleported="false"
          popper-class="popover-origin-help"
        >
          <template #reference>
            <el-icon
              class="magnify-glass"
              v-show="origin.mapLabel"
              @click="onConnectivityClicked(origin.mapLabel)"
            >
              <el-icon-search />
            </el-icon>
          </template>
          <span>Search connectivity</span>
        </el-popover>
        <span>{{ capitalise(origin.mapLabel) }}</span>
        <span v-if="origin.isUnmapped">
          <span v-if="origin.mapLabel"> / </span>
          <s>{{ capitalise(origin.sckanLabel) }}</s>
        </span>
      </div>
      <el-button
        v-show="
          originsWithDatasets && originsWithDatasets.length > 0 &&
          shouldShowExploreButton(originsWithDatasets)
        "
        class="button"
        id="open-dendrites-button"
        @click="openDendrites"
      >
        Explore origin data
      </el-button>
    </div>

    <!-- Components -->
    <div
      v-if="components && componentsCombinations.length > 0"
      class="block"
    >
      <div class="attribute-title-container">
        <span class="attribute-title">Components</span>
      </div>
      <div
        v-for="(component, i) in processedComponentsCombinations"
        class="attribute-content"
        :component-item-label="component.mapLabel"
        :key="component.mapLabel + '-' + i"
        @mouseenter="onConnectivityHovered(component, $event)"
        @mouseleave="onConnectivityHovered()"
      >
        <el-popover
          width="150"
          trigger="hover"
          :teleported="false"
          popper-class="popover-origin-help"
        >
          <template #reference>
            <el-icon
              class="magnify-glass"
              v-show="component.mapLabel"
              @click="onConnectivityClicked(component.mapLabel)"
            >
              <el-icon-search />
            </el-icon>
          </template>
          <span>Search connectivity</span>
        </el-popover>
        <span>{{ capitalise(component.mapLabel) }}</span>
        <span v-if="component.isUnmapped">
          <span v-if="component.mapLabel"> / </span>
          <s>{{ capitalise(component.sckanLabel) }}</s>
        </span>
      </div>
    </div>

    <!-- Destinations -->
    <div
      v-if="destinations && destinationsCombinations.length > 0"
      class="block"
    >
      <div class="attribute-title-container">
        <span class="attribute-title">Destination</span>
        <el-popover
          width="250"
          trigger="hover"
          :teleported="false"
          popper-class="popover-origin-help"
        >
          <template #reference>
            <el-icon class="info"><el-icon-warning /></el-icon>
          </template>
          <span style="word-break: keep-all">
            <i>Destination</i> is where the axons terminate
          </span>
        </el-popover>
      </div>
      <div
        v-for="(destination, i) in processedDestinationsCombinations"
        class="attribute-content"
        :destination-item-label="destination.mapLabel"
        :key="destination.mapLabel + '-' + i"
        @mouseenter="onConnectivityHovered(destination, $event)"
        @mouseleave="onConnectivityHovered()"
      >
        <el-popover
          width="150"
          trigger="hover"
          :teleported="false"
          popper-class="popover-origin-help"
        >
          <template #reference>
            <el-icon
              class="magnify-glass"
              v-show="destination.mapLabel"
              @click="onConnectivityClicked(destination.mapLabel)"
            >
              <el-icon-search />
            </el-icon>
          </template>
          <span>Search connectivity</span>
        </el-popover>
        <span>{{ capitalise(destination.mapLabel) }}</span>
        <span v-if="destination.isUnmapped">
          <span v-if="destination.mapLabel"> / </span>
          <s>{{ capitalise(destination.sckanLabel) }}</s>
        </span>
      </div>
      <el-button
        v-show="
          destinationsWithDatasets &&
          destinationsWithDatasets.length > 0 &&
          shouldShowExploreButton(destinationsWithDatasets)
        "
        class="button"
        @click="openAxons"
      >
        Explore destination data
      </el-button>
    </div>

    <!-- Explore Button -->
    <div
      v-show="
        componentsWithDatasets &&
        componentsWithDatasets.length > 0 &&
        shouldShowExploreButton(componentsWithDatasets)
      "
      class="block"
    >
      <el-button
        class="button"
        @click="openAll"
      >
        Search for data on components
      </el-button>
    </div>
  </div>
</template>

<script>
import {
  Warning as ElIconWarning,
  Search as ElIconSearch,
} from '@element-plus/icons-vue'
import {
  ElButton as Button,
  ElContainer as Container,
  ElIcon as Icon,
} from 'element-plus'
import { capitalise } from '../utilities'

export default {
  name: 'ConnectivityListNew',
  components: {
    Button,
    Container,
    Icon,
    ElIconWarning,
    ElIconSearch
  },
  props: {
    entry: {
      type: Object,
      default: () => ({
        destinations: [],
        origins: [],
        components: [],
        destinationsWithDatasets: [],
        originsWithDatasets: [],
        componentsWithDatasets: [],
        destinationsCombinations: [],
        originsCombinations: [],
        componentsCombinations: [],
        resource: undefined,
        featuresAlert: undefined,
      }),
    },
    origins: {
      type: Array,
      default: () => []
    },
    components: {
      type: Array,
      default: () => []
    },
    destinations: {
      type: Array,
      default: () => []
    },
    originsWithDatasets: {
      type: Array,
      default: () => []
    },
    componentsWithDatasets: {
      type: Array,
      default: () => []
    },
    destinationsWithDatasets: {
      type: Array,
      default: () => []
    },
    componentsCombinations: {
      type: Array,
      default: () => []
    },
    originsCombinations: {
      type: Array,
      default: () => []
    },
    destinationsCombinations: {
      type: Array,
      default: () => []
    },
    availableAnatomyFacets: {
      type: Array,
      default: () => [],
    },
    connectivityError: {
      type: Object,
      default: () => {},
    }
  },
  data: function () {
    return {
      alertTop: 0,
      alertLeft: 0,
      originDescriptions: {
        motor: 'is the location of the initial cell body of the circuit',
        sensory: 'is the location of the initial cell body in the PNS circuit',
      },
      facetList: [],
      clearErrorTimeout: null,
    }
  },
  watch: {
    availableAnatomyFacets: {
      handler: function (val) {
        this.convertFacetsToList(val)
      },
      immediate: true,
      deep: true,
    },
  },
  computed: {
    originDescription: function () {
      if (
        this.entry &&
        this.entry.title &&
        this.entry.title.toLowerCase().includes('motor')
      ) {
        return this.originDescriptions.motor
      } else {
        return this.originDescriptions.sensory
      }
    },
    // Deduplicate origins by mapId and collect mapped SCKAN labels
    processedOriginsCombinations: function () {
      return this.processCombinations(this.originsCombinations)
    },
    // Deduplicate destinations by mapId and collect mapped SCKAN labels
    processedDestinationsCombinations: function () {
      return this.processCombinations(this.destinationsCombinations)
    },
    // Deduplicate components by mapId and collect mapped SCKAN labels
    processedComponentsCombinations: function () {
      return this.processCombinations(this.componentsCombinations)
    },
  },
  methods: {
    capitalise: function (text) {
      return capitalise(text)
    },
    // Process combinations to deduplicate by mapId and collect mapped SCKAN labels
    processCombinations: function (combinations) {
      const mapIdToItem = new Map()
      const unmappedItems = []

      combinations.forEach((combo) => {
        // Items without mapId are considered unmapped (not available on map)
        if (!combo.mapId || combo.mapId.length === 0) {
          unmappedItems.push({
            mapId: combo.mapId,
            mapLabel: combo.mapLabel,
            sckanLabel: combo.sckanLabel,
            sckanId: combo.sckanId,
            mappedSckanLabels: [],
            isUnmapped: true,
          })
          return
        }

        const mapIdKey = JSON.stringify(combo.mapId)

        if (!mapIdToItem.has(mapIdKey)) {
          mapIdToItem.set(mapIdKey, {
            mapId: combo.mapId,
            mapLabel: combo.mapLabel,
            sckanLabel: combo.sckanLabel,
            sckanId: combo.sckanId,
            mappedSckanLabels: [],
            isUnmapped: false,
          })
        }

        const item = mapIdToItem.get(mapIdKey)

        // Collect all SCKAN labels mapped to this map item
        // Avoid duplicates in mappedSckanLabels
        if (!item.mappedSckanLabels.includes(combo.sckanLabel)) {
          item.mappedSckanLabels.push(combo.sckanLabel)
        }
      })

      // Return mapped items followed by unmapped items
      return [...Array.from(mapIdToItem.values()), ...unmappedItems]
    },
    onConnectivityHovered: function (combination, event) {
      if (this.clearErrorTimeout) {
        clearTimeout(this.clearErrorTimeout);
        this.clearErrorTimeout = null;
      }

      // Compute the new error state first
      let newError = { hasError: false, errorType: '', errorMessage: '' };

      if (combination) {
        if (combination.mapId.length) {
          // If there is mapId, it exists on the map.
          // Show hover highlight on the map.
          const hoveredLabel = combination.mapLabel.toLowerCase();
          this.$emit('connectivity-hovered', hoveredLabel);

          // If there are mapped SCKAN labels, show them in a list
          if (combination.mappedSckanLabels && combination.mappedSckanLabels.length > 0) {
            const sckanList = combination.mappedSckanLabels
              .map(label => `<li>${label}</li>`)
              .join('');
            const messageHead = `<em>Mapped from these SCKAN entries:</em>`;
            const messageBody = `<ul>${sckanList}</ul>`;
            newError = {
              hasError: true,
              errorType: 'warning',
              errorMessage: `${messageHead}${messageBody}`,
            };
          }
          // If the SCKAN term and the Map term are different, show warning message.
          else if (JSON.stringify(combination.sckanId) !== JSON.stringify(combination.mapId)) {
            newError = {
              hasError: true,
              errorType: 'warning',
              errorMessage: `<strong>${combination.sckanLabel}</strong> from the SCKAN
                            has been mapped to <strong>${combination.mapLabel}</strong> on the Map.`,
            };
          }
        } else if (combination.sckanId.length) {
          // If there is no mapId but there is sckanId,
          // it means the SCKAN term is not available on the Map.
          newError = {
            hasError: true,
            errorType: 'error',
            errorMessage: `<strong>${combination.sckanLabel}</strong> from the SCKAN
                          is not available on the Map.`,
          };
        }
      }

      if (newError.hasError) {
        // Show new error immediately with content
        this.connectivityError.errorType = newError.errorType;
        this.connectivityError.errorMessage = newError.errorMessage;
        this.connectivityError.hasError = true;
      } else {
        // Hide the popover immediately, then clear content after transition (~300ms)
        // so the popover fades out with content still visible (not as empty box)
        this.connectivityError.hasError = false;
        this.clearErrorTimeout = setTimeout(() => {
          this.connectivityError.errorType = '';
          this.connectivityError.errorMessage = '';
          this.clearErrorTimeout = null;
        }, 350);
      }

      if (event) {
        const element = event.srcElement || event.target;
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left; // use mouse position relative to the element

        this.alertTop = element.offsetParent.offsetTop + element.offsetTop;
        this.alertLeft = x;
      }
    },
    onConnectivityClicked: function (name) {
      const connectivity = this.connectivityError.errorConnectivities;
      // Remove the invalid term while searching
      const label = connectivity
        ? name.replace(new RegExp(`\\s*,?\\s*${connectivity}\\s*,?\\s*`, 'gi'), '').trim()
        : name;
      this.$emit('connectivity-clicked', label);
    },
    // shouldShowMagnifyGlass: Checks whether the hovered terms contain valid term or not
    shouldShowMagnifyGlass: function (features) {
      const connectivity = this.connectivityError.errorConnectivities;
      return connectivity?.toLowerCase() !== features.toLowerCase();
    },
    // shouldShowExploreButton: Checks if the feature is in the list of available anatomy facets
    shouldShowExploreButton: function (features) {
      // facetList will not be available when there has no Sidebar's data
      if (!this.facetList.length) {
        return true
      }
      for (let i = 0; i < features.length; i++) {
        if (this.facetList.includes(features[i].name.toLowerCase())) {
          return true
        }
      }
      return false
    },
    // convertFacetsToList: Converts the available anatomy facets to a list for easy searching
    convertFacetsToList: function (facets) {
      facets.forEach((facet) => {
        if(facet.children) {
          this.convertFacetsToList(facet.children)
        } else {
          this.facetList.push(facet.label.toLowerCase())
        }
      })
    },
    openAll: function () {
      this.$emit('connectivity-action-click', {
        type: 'Facets',
        labels: this.componentsWithDatasets.map((a) => a.name.toLowerCase()),
      })
    },
    openAxons: function () {
      this.$emit('connectivity-action-click', {
        type: 'Facets',
        labels: this.destinationsWithDatasets.map((a) => a.name.toLowerCase()),
      })
    },
    openDendrites: function () {
      this.$emit('connectivity-action-click', {
        type: 'Facets',
        labels: this.originsWithDatasets.map((a) => a.name.toLowerCase()),
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.connectivity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

.button {
  margin-left: 0px !important;
  margin-top: 0px !important;
  font-size: 14px !important;
  background-color: $app-primary-color;
  color: #fff;

  &:hover {
    color: #fff !important;
    background-color: #ac76c5 !important;
    border: 1px solid #ac76c5 !important;
  }

  & + .button {
    margin-top: 10px !important;
  }
}

.icon {
  right: 0px;
  position: absolute;
  top: 10px;
}

.icon:hover {
  cursor: pointer;
}

:deep(.popover-origin-help.el-popover) {
  text-transform: none !important; // need to overide the tooltip text transform
  border: 1px solid $app-primary-color;
  font-weight: 400;
  font-family: Asap, sans-serif, Helvetica;

  .el-popper__arrow {
    &:before {
      border-color: $app-primary-color;
      background-color: #ffffff;
    }
  }
}

.info {
  color: #8300bf;
  transform: rotate(180deg);
  margin-left: 8px;
}

.attribute-title-container {
  margin-bottom: 0.5em;
}

.attribute-title {
  font-size: 16px;
  font-weight: 600;
  /* font-weight: bold; */
  text-transform: uppercase;
}

.attribute-content {
  font-size: 14px;
  font-weight: 500;
  transition: color 0.25s ease;
  position: relative;
  cursor: default;
  padding-left: 16px;

  .magnify-glass {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
  }

  &:hover {
    color: $app-primary-color;

    .magnify-glass {
      display: block;
      padding-top: 4px;
      cursor: pointer;
    }
  }

  + .attribute-content {
    &::before {
      content: "";
      width: 90%;
      height: 1px;
      background-color: var(--el-border-color);
      position: absolute;
      top: 0;
      left: 0;
    }
  }

  &:last-of-type {
    margin-bottom: 0.5em;
  }
}

.connectivity-alert {
  position: absolute;
  width: 1px;
  height: 1px;
}

.connectivity-list :deep(.connectivity-error-container.el-popover),
.connectivity-list :deep(.connectivity-warning-container.el-popover) {
  min-height: 31px; // placeholder
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  border-radius: var(--el-border-radius-small);
  pointer-events: none;
  word-break: break-word;
}

.connectivity-list :deep(.connectivity-error-container.el-popover ul),
.connectivity-list :deep(.connectivity-warning-container.el-popover ul) {
  margin: 0.5em 0 0;
  padding-left: 1.25em;
}

.connectivity-list :deep(.connectivity-error-container.el-popover li + li),
.connectivity-list :deep(.connectivity-warning-container.el-popover li + li) {
  margin-top: 0.25em;
}

.connectivity-list :deep(.connectivity-error-container.el-popover) {
  background-color: var(--el-color-error-light-9);
  border: 1px solid var(--el-color-error);
}

.connectivity-list :deep(.connectivity-warning-container.el-popover) {
  background-color: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning);
}
</style>
