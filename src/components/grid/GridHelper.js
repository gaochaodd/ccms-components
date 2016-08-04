/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2016-01-04
 */
import injector from 'angular-es-utils/injector';
import {isPromiseLike, isObject, isFunction} from 'angular-es-utils/type-auth';

function transformer(response, mapping) {

	let result = Object.assign({}, response);

	for (let prop in mapping) {
		if (mapping.hasOwnProperty(prop)) {
			result[prop] = response[mapping[prop]] || response[prop];
		}
	}

	return result;
}

// -默认排序方法
function defaultSortCompareFn(prev, next, prop) {
	if (typeof prev[prop] === 'string' || typeof next[prop] === 'string') {

		if (prev[prop].toString() < next[prop].toString()) {
			return -1;
		} else if ((prev[prop].toString() > next[prop].toString())) {
			return 1;
		} else {
			return 0;
		}
	} else {

		return (prev[prop] - next[prop]);
	}
}

// -刷新数据时 排序 gridData
function refreshDataSort(list, columnSortConfig) {
	// column sorting
	const index = columnSortConfig.findIndex(config => {
		return config.type !== 'default';
	});
	if (index >= 0) {
		runColumnSorting(index, list, columnSortConfig, false);
	}
}

// -修改排序 temp 状态
function updateSortConfig(index, columnSortConfig = [], isUpdateConfig = true) {
	// -是否更改config
	if (isUpdateConfig) {

		columnSortConfig.forEach((config, cIndex) => {
			if (config) {
				if (index === cIndex) {
					config.type = config.type === 'asc' ? 'desc' : 'asc';
				} else {
					config.type = 'default';
				}
			}
		});
	}
}

// -排序 gridData
function runColumnSorting(columnIndex, gridData, columnSortConfig, isUpdateConfig) {

	const sortConfig = columnSortConfig[columnIndex];
	if (sortConfig) {
		updateSortConfig(columnIndex, columnSortConfig, isUpdateConfig);

		const prop = sortConfig.prop;
		const reverse = sortConfig.type === 'desc' ? -1 : 1;
		if (typeof sortConfig.compareFn === 'function') {

			gridData.sort((prev, next) => {
				return sortConfig.compareFn(prev, next) * reverse;
			});
		} else {
			gridData.sort((prev, next) => {
				return defaultSortCompareFn(prev, next, prop) * reverse;
			});
		}
	}
}

/**
 * 表格服务,对外提供刷新服务
 */
export default {

	fillOpts(gridOptions) {

		let DEFAULT_CONFIGS = {
			resource: null, // 资源$resource
			response: null, // 对外暴露的response
			queryParams: null, // 外部查询参数
			columnsDef: [],   // 列定义,包括 field:字段 displayName:字段名 cellTemplate:单元格模板 align:文字对齐方式
			externalData: null, // 来自外部表格数据
			showPagination: true, // 是否展示分页
			headerTpl: null, // 表头模板,允许 字符串 or 模板url
			cellTpl: null, // 表格元素模板,允许 字符串 or 模板url
			emptyTipTpl: null,  // 表格为空时的提示 允许 字符串 or 模板url
			pager: {
				totals: 0,  // 总条数
				totalPages: 1,  // 总页数
				pageNum: 1,  // 当前页码
				pageSize: 20, // 每页大小
				pageSizeList: [10, 15, 20, 30, 50]
			} // 分页配置 @see pagination component
		};

		return Object.assign(gridOptions, Object.assign(DEFAULT_CONFIGS, gridOptions));
	},

	refresh(gridOptions, queryParams, columnSortConfig = []) {

		this.fillOpts(gridOptions);
		gridOptions.loading = true;

		// 如果不存在外部表格数据则请求接口拿数据
		if (!gridOptions.externalData && gridOptions.resource) {

			const pageParams = {
				pageNum: gridOptions.pager.pageNum,
				pageSize: gridOptions.pager.pageSize
			};

			const params = Object.assign({}, pageParams, gridOptions.queryParams, queryParams);

			return gridOptions.resource.get(params).$promise

				.then(res => {

					let transformedData = null;

					if (gridOptions.transformer) {
						if (isFunction(gridOptions.transformer)) {
							transformedData = gridOptions.transformer(res);
						} else if (isObject(gridOptions.transformer)) {
							transformedData = transformer(res, gridOptions.transformer);
						}
					} else {
						transformedData = res;
					}

					gridOptions.response = res;

					// column sorting
					refreshDataSort(transformedData.list, columnSortConfig);

					gridOptions.data = transformedData.list;
					gridOptions.loading = false;

					let pager = gridOptions.pager;

					pager.pageNum = transformedData.pageNum;
					pager.pageSize = transformedData.pageSize;
					pager.totals = transformedData.totals;
					pager.totalPages = Math.ceil((transformedData.totals || 0) / pager.pageSize);

				});

		} else {

			const finish = data => {

				// column sorting
				refreshDataSort(data, columnSortConfig);

				gridOptions.data = data;
				gridOptions.loading = false;
			};

			if (isPromiseLike(gridOptions.externalData)) {
				return gridOptions.externalData.then(finish);
			} else {
				return injector.get('$q').resolve(finish(gridOptions.externalData));
			}

		}
	},

	sort(columnIndex, gridData, columnSortConfig) {

		runColumnSorting(columnIndex, gridData, columnSortConfig);
	}
};
