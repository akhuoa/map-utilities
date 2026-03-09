<template>
	<div class="reconciliation-table">
		<table class="reconciliation-table-inner">
			<thead>
				<tr>
					<th class="source-column">SCKAN Term</th>
					<th class="target-column">Map Term</th>
				</tr>
			</thead>
			<tbody>
				<template v-for="(group, groupIndex) in groups" :key="`${tableKey}-group-${groupIndex}`">
					<tr
						v-for="(item, i) in group.items"
						:key="`${tableKey}-${groupIndex}-${i}`"
						class="table-row"
						:class="{ 'group-last': i === group.items.length - 1 }"
					>
						<!-- Direct match: single merged cell -->
						<template v-if="isDirectMatch(group, item)">
							<td
								class="table-cell direct-match-cell"
								colspan="2"
								@mouseenter="$emit('row-hovered', item, $event)"
								@mouseleave="$emit('row-hovered')"
							>
								<div class="target-content">
									<span class="term-label">{{ capitalise(item.sckanLabel) }}</span>
									<el-popover
										width="150"
										trigger="hover"
										:teleported="false"
										popper-class="popover-origin-help"
									>
										<template #reference>
											<el-icon
												class="status-search-icon"
												@click="$emit('connectivity-clicked', item.mapLabel)"
											>
												<el-icon-search />
											</el-icon>
										</template>
										<span>Search connectivity</span>
									</el-popover>
								</div>
							</td>
						</template>

						<!-- Non-direct match: separate source and target columns -->
						<template v-else>
							<td
								class="table-cell source-column"
								@mouseenter="$emit('row-hovered', item, $event)"
								@mouseleave="$emit('row-hovered')"
							>
								<span class="term-label">{{ capitalise(item.sckanLabel) }}</span>
							</td>
							<td
								v-if="i === 0"
								class="table-cell target-column"
								:class="{
									'grouped-cell': group.items.length > 1,
									'unavailable': !item.mapId || item.mapId.length === 0
								}"
								:rowspan="group.items.length"
							>
								<div class="target-content">
									<template v-if="item.mapId && item.mapId.length > 0">
										<span class="term-label">{{ capitalise(item.mapLabel) }}</span>
										<el-popover
											width="150"
											trigger="hover"
											:teleported="false"
											popper-class="popover-origin-help"
										>
											<template #reference>
												<el-icon
													class="status-search-icon"
													@click="$emit('connectivity-clicked', item.mapLabel)"
												>
													<el-icon-search />
												</el-icon>
											</template>
											<span>Search connectivity</span>
										</el-popover>
									</template>
									<el-icon
										v-else
										class="status-icon unmapped"
										title="Not available on map"
									>
										<el-icon-close />
									</el-icon>
								</div>
							</td>
						</template>
					</tr>
				</template>
			</tbody>
		</table>
	</div>
</template>

<script>
import {
	Search as ElIconSearch,
	Close as ElIconClose,
} from '@element-plus/icons-vue'
import { capitalise } from '../utilities'

export default {
	name: 'ReconciliationTable',
	components: {
		ElIconSearch,
		ElIconClose,
	},
	props: {
		groups: {
			type: Array,
			default: () => [],
		},
		tableKey: {
			type: String,
			default: 'reconciliation',
		},
	},
	emits: ['row-hovered', 'connectivity-clicked'],
	methods: {
		capitalise: function (text) {
			return capitalise(text)
		},
		isDirectMatch: function (group, item) {
			// Direct match only when:
			// 1. Single item (not grouped)
			// 2. Both IDs exist and match exactly
			if (group.items.length !== 1) return false
			if (!item.sckanId || !item.mapId) return false
			return JSON.stringify(item.sckanId) === JSON.stringify(item.mapId)
		},
	},
}
</script>

<style lang="scss" scoped>
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

  .source-column,
	.target-column {
		width: 50%;
		text-align: left;
	}
}

.table-cell {
	background-color: #f7faff;

	&.source-column,
	&.target-column,
	&.direct-match-cell {
		position: relative;

		&::before {
			content: '';
			position: absolute;
			inset: 0;
			transition: background-color 0.2s ease, border-color 0.2s ease;
		}
	}

	// Direct match merged cell styling (one-to-one exact match)
	&.direct-match-cell {
		&::before {
			background-color: #e3f2fd;
			border-left: 4px solid #90caf9;
		}

		&:hover::before {
			background-color: #bbdefb;
			border-left-color: #64b5f6;
		}
	}

	// Source column (non-direct match cases)
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

	// Target column - unavailable items
	&.target-column.unavailable {
		&::before {
			background-color: #ffebe9;
			border-left: 4px solid #ffcecb;
		}

		&:hover::before {
			background-color: #ffe5e3;
			border-left-color: #ffb7b4;
		}
	}

	// Target column - available but not direct match
	&.target-column:not(.unavailable) {
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
}

.term-label {
	font-weight: 500;
	transition: color 0.2s ease;
	word-break: break-word;
	position: relative;
}

.target-content {
  width: 100%;
	display: flex;
	align-items: center;
  justify-content: space-between;
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
  opacity: 0;
  transition: opacity 0.2s ease;

	&:hover {
		color: #ac76c5;
	}
}

.table-row:hover .status-search-icon {
  opacity: 1;
}
</style>
