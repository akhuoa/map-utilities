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

    <!-- Origins Reconciliation Table -->
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

      <div class="reconciliation-table">
        <table class="reconciliation-table-inner">
          <thead>
            <tr>
              <th class="source-column">SCKAN Term</th>
              <th class="target-column">Map Term</th>
              <th class="status-column">Status</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(group, groupIndex) in groupedOrigins" :key="'origin-group-' + groupIndex">
              <tr
                v-for="(origin, i) in group.items"
                :key="'origin-' + groupIndex + '-' + i"
                class="table-row"
                :class="{ 'group-last': i === group.items.length - 1 }"
              >
                <td
                  class="table-cell source-column"
                  @mouseenter="onRowHovered(origin, $event)"
                  @mouseleave="onRowHovered()"
                >
                  <span class="term-label">{{ capitalise(origin.sckanLabel) }}</span>
                </td>
                <td
                  v-if="i === 0"
                  class="table-cell target-column"
                  :class="{ 'grouped-cell': group.items.length > 1 }"
                  :rowspan="group.items.length"
                >
                  <div v-if="origin.mapId && origin.mapId.length > 0" class="target-content">
                    <!-- <el-popover
                      width="150"
                      trigger="hover"
                      :teleported="false"
                      popper-class="popover-origin-help"
                    >
                      <template #reference>
                        <el-icon
                          class="magnify-glass"
                          @click="onConnectivityClicked(origin.mapLabel)"
                        >
                          <el-icon-search />
                        </el-icon>
                      </template>
                      <span>Search connectivity</span>
                    </el-popover> -->
                    <span class="term-label">{{ capitalise(origin.mapLabel) }}</span>
                  </div>
                  <span v-else class="no-mapping">—</span>
                </td>
                <td
                  v-if="i === 0"
                  class="table-cell status-column"
                  :class="{ 'grouped-cell': group.items.length > 1 }"
                  :rowspan="group.items.length"
                >
                  <el-popover
                    v-if="origin.mapId && origin.mapId.length > 0"
                    width="150"
                    trigger="hover"
                    :teleported="false"
                    popper-class="popover-origin-help"
                  >
                    <template #reference>
                      <el-icon
                        class="status-search-icon"
                        @click="onConnectivityClicked(origin.mapLabel)"
                      >
                        <el-icon-search />
                      </el-icon>
                    </template>
                    <span>Search connectivity</span>
                  </el-popover>
                  <el-icon
                    v-else
                    class="status-icon unmapped"
                    title="Not available on map"
                  >
                    <el-icon-close />
                  </el-icon>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
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

    <!-- Components Reconciliation Table -->
    <div
      v-if="components && componentsCombinations.length > 0"
      class="block"
    >
      <div class="attribute-title-container">
        <span class="attribute-title">Components</span>
      </div>

      <div class="reconciliation-table">
        <table class="reconciliation-table-inner">
          <thead>
            <tr>
              <th class="source-column">SCKAN Term</th>
              <th class="target-column">Map Term</th>
              <th class="status-column">Status</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(group, groupIndex) in groupedComponents" :key="'component-group-' + groupIndex">
              <tr
                v-for="(component, i) in group.items"
                :key="'component-' + groupIndex + '-' + i"
                class="table-row"
                :class="{ 'group-last': i === group.items.length - 1 }"
              >
                <td
                  class="table-cell source-column"
                  @mouseenter="onRowHovered(component, $event)"
                  @mouseleave="onRowHovered()"
                >
                  <span class="term-label">{{ capitalise(component.sckanLabel) }}</span>
                </td>
                <td
                  v-if="i === 0"
                  class="table-cell target-column"
                  :class="{ 'grouped-cell': group.items.length > 1 }"
                  :rowspan="group.items.length"
                >
                  <div v-if="component.mapId && component.mapId.length > 0" class="target-content">
                    <!-- <el-popover
                      width="150"
                      trigger="hover"
                      :teleported="false"
                      popper-class="popover-origin-help"
                    >
                      <template #reference>
                        <el-icon
                          class="magnify-glass"
                          @click="onConnectivityClicked(component.mapLabel)"
                        >
                          <el-icon-search />
                        </el-icon>
                      </template>
                      <span>Search connectivity</span>
                    </el-popover> -->
                    <span class="term-label">{{ capitalise(component.mapLabel) }}</span>
                  </div>
                  <span v-else class="no-mapping">—</span>
                </td>
                <td
                  v-if="i === 0"
                  class="table-cell status-column"
                  :class="{ 'grouped-cell': group.items.length > 1 }"
                  :rowspan="group.items.length"
                >
                  <el-popover
                    v-if="component.mapId && component.mapId.length > 0"
                    width="150"
                    trigger="hover"
                    :teleported="false"
                    popper-class="popover-origin-help"
                  >
                    <template #reference>
                      <el-icon
                        class="status-search-icon"
                        @click="onConnectivityClicked(component.mapLabel)"
                      >
                        <el-icon-search />
                      </el-icon>
                    </template>
                    <span>Search connectivity</span>
                  </el-popover>
                  <el-icon
                    v-else
                    class="status-icon unmapped"
                    title="Not available on map"
                  >
                    <el-icon-close />
                  </el-icon>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Destinations Reconciliation Table -->
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

      <div class="reconciliation-table">
        <table class="reconciliation-table-inner">
          <thead>
            <tr>
              <th class="source-column">SCKAN Term</th>
              <th class="target-column">Map Term</th>
              <th class="status-column">Status</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(group, groupIndex) in groupedDestinations" :key="'destination-group-' + groupIndex">
              <tr
                v-for="(destination, i) in group.items"
                :key="'destination-' + groupIndex + '-' + i"
                class="table-row"
                :class="{ 'group-last': i === group.items.length - 1 }"
              >
                <td
                  class="table-cell source-column"
                  @mouseenter="onRowHovered(destination, $event)"
                  @mouseleave="onRowHovered()"
                >
                  <span class="term-label">{{ capitalise(destination.sckanLabel) }}</span>
                </td>
                <td
                  v-if="i === 0"
                  class="table-cell target-column"
                  :class="{ 'grouped-cell': group.items.length > 1 }"
                  :rowspan="group.items.length"
                >
                  <div v-if="destination.mapId && destination.mapId.length > 0" class="target-content">
                    <!-- <el-popover
                      width="150"
                      trigger="hover"
                      :teleported="false"
                      popper-class="popover-origin-help"
                    >
                      <template #reference>
                        <el-icon
                          class="magnify-glass"
                          @click="onConnectivityClicked(destination.mapLabel)"
                        >
                          <el-icon-search />
                        </el-icon>
                      </template>
                      <span>Search connectivity</span>
                    </el-popover> -->
                    <span class="term-label">{{ capitalise(destination.mapLabel) }}</span>
                  </div>
                  <span v-else class="no-mapping">—</span>
                </td>
                <td
                  v-if="i === 0"
                  class="table-cell status-column"
                  :class="{ 'grouped-cell': group.items.length > 1 }"
                  :rowspan="group.items.length"
                >
                  <el-popover
                    v-if="destination.mapId && destination.mapId.length > 0"
                    width="150"
                    trigger="hover"
                    :teleported="false"
                    popper-class="popover-origin-help"
                  >
                    <template #reference>
                      <el-icon
                        class="status-search-icon"
                        @click="onConnectivityClicked(destination.mapLabel)"
                      >
                        <el-icon-search />
                      </el-icon>
                    </template>
                    <span>Search connectivity</span>
                  </el-popover>
                  <el-icon
                    v-else
                    class="status-icon unmapped"
                    title="Not available on map"
                  >
                    <el-icon-close />
                  </el-icon>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
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
  Close as ElIconClose,
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
    ElIconSearch,
    ElIconClose,
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
    // Group origins by mapId - multiple SCKAN terms can map to the same Map term
    groupedOrigins: function () {
      return this.groupCombinationsByMapId(this.originsCombinations)
    },
    // Group components by mapId
    groupedComponents: function () {
      return this.groupCombinationsByMapId(this.componentsCombinations)
    },
    // Group destinations by mapId
    groupedDestinations: function () {
      return this.groupCombinationsByMapId(this.destinationsCombinations)
    },
  },
  methods: {
    capitalise: function (text) {
      return capitalise(text)
    },
    // Group combinations by mapId (or lack thereof)
    // Returns array of groups, each with items array
    groupCombinationsByMapId: function (combinations) {
      const groups = []
      const mapIdToGroup = new Map()

      combinations.forEach((combo) => {
        if (!combo.mapId || combo.mapId.length === 0) {
          // Unmapped items - each gets its own group (no grouping)
          groups.push({ items: [combo] })
        } else {
          const mapIdKey = JSON.stringify(combo.mapId)

          if (!mapIdToGroup.has(mapIdKey)) {
            const group = { items: [] }
            mapIdToGroup.set(mapIdKey, group)
            groups.push(group)
          }

          mapIdToGroup.get(mapIdKey).items.push(combo)
        }
      })

      return groups
    },
    onRowHovered: function (combination, event) {
      if (this.clearErrorTimeout) {
        clearTimeout(this.clearErrorTimeout);
        this.clearErrorTimeout = null;
      }

      // Compute the new error state first
      let newError = { hasError: false, errorType: '', errorMessage: '' };

      if (combination) {
        if (combination.mapId && combination.mapId.length > 0) {
          // If there is mapId, it exists on the map.
          // Show hover highlight on the map.
          const hoveredLabel = combination.mapLabel.toLowerCase();
          this.$emit('connectivity-hovered', hoveredLabel);

          // If the SCKAN term and the Map term are different, show warning message.
          if (JSON.stringify(combination.sckanId) !== JSON.stringify(combination.mapId)) {
            newError = {
              hasError: true,
              errorType: 'warning',
              errorMessage: `<strong>${combination.sckanLabel}</strong> from SCKAN
                            has been mapped to <strong>${combination.mapLabel}</strong> on the Map.`,
            };
          }
        } else if (combination.sckanId && combination.sckanId.length > 0) {
          // If there is no mapId but there is sckanId,
          // it means the SCKAN term is not available on the Map.
          newError = {
            hasError: true,
            errorType: 'error',
            errorMessage: `<strong>${combination.sckanLabel}</strong> from SCKAN
                          is not available on the Map.`,
          };
        }
      } else {
        // Mouse leave - clear the hover highlight
        this.$emit('connectivity-hovered', null);
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
        const element = event.currentTarget;
        const rect = element.getBoundingClientRect();
        const containerRect = this.$refs.connectivityList.getBoundingClientRect();

        this.alertTop = rect.top - containerRect.top;
        this.alertLeft = rect.left - containerRect.left + (rect.width / 2);
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
  margin-top: 0.5rem !important;
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
  text-transform: uppercase;
}

.reconciliation-table {
  overflow: hidden;
  font-size: 14px;
}

.reconciliation-table-inner {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;

  th,
  td {
    padding: 0.5rem;
    vertical-align: middle;
  }

  tbody td {
    border-top: 2px solid #f7faff;
    border-bottom: 2px solid #f7faff;
  }

  tbody tr:first-child td {
    border-top-width: 4px;
  }

  thead th {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    background-color: var(--el-fill-color-blank);
    border-bottom: 1px solid var(--el-border-color);
    text-align: left;
  }

  .source-column {
    width: 45%;
    text-align: left;
  }

  .target-column {
    width: 45%;
    text-align: left;
  }

  .status-column {
    width: 10%;
    text-align: center;
  }
}

// .table-row {
//   cursor: default;
//   transition: background-color 0.2s ease;

//   &:hover {
//     background-color: var(--el-fill-color-light);

//     .term-label {
//       color: $app-primary-color;
//     }

//     .magnify-glass {
//       opacity: 1;
//     }
//   }
// }

.table-cell {
  background-color: #f7faff;

  &.source-column,
  &.target-column {
    position: relative;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
  }

  &.source-column {
    &::before {
      background-color: #ffebe9;
      border-left: 4px solid #ffcecb;
    }

    &:hover::before {
      background-color: #ffe5e3;
      border-left-color: #ffb7b4;
    }
  }

  &.target-column {
    &::before {
      background-color: #e6ffed;
      border-left: 4px solid #aceebb;
    }

    &:hover::before {
      background-color: #d9ffe0;
      border-left-color: #7fe09c;
    }
  }

  &.grouped-cell {
    vertical-align: middle;
  }

  &.status-column {
    text-align: center;
  }
}

.term-label {
  font-weight: 500;
  transition: color 0.2s ease;
  word-break: break-word;
  position: relative;
}

.target-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.status-icon {
  font-size: 16px;

  &.mapped {
    color: var(--el-color-success);
  }

  &.unmapped {
    color: var(--el-color-error);
  }
}

.status-search-icon {
  font-size: 16px;
  color: $app-primary-color;
  cursor: pointer;

  &:hover {
    color: #ac76c5;
  }
}

.magnify-glass {
  font-size: 16px;
  color: $app-primary-color;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  flex-shrink: 0;

  &:hover {
    color: #ac76c5;
  }
}

.no-mapping {
  color: var(--el-text-color-placeholder);
  font-style: italic;
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
  padding: 0.5rem 0.75rem;
  border-radius: var(--el-border-radius-small);
  pointer-events: none;
  word-break: break-word;
  font-size: 12px;
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
