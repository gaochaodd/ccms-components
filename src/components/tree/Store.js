/**
 * Tree 数据管理
 */
class Store {
	// 数据存储
	treeData = [];

	// 过滤文本
	filterText = '';

	/**
	 * @param treeData
	 * @param maxLevel 允许的最大层级
	 */
	constructor(treeData, maxLevel) {
		this.initData(treeData, maxLevel);
	}

	// 当前节点
	activeNode = null;

	/**
	 * 更新当前节点
	 * @param node
	 */
	updateActiveNode(node) {
		this.activeNode && this.updateById(this.activeNode.id, { isActive: false });
		this.activeNode = this.updateById(node.id, { isActive: true });
	}

	/**
	 * 获取当前选中节点
	 * @returns {Array}
	 */
	get selectedNodes() {
		const selectedList = [];
		function getSelected(nodeList) {
			nodeList.forEach(item => {
				if (item.checked && item.checked !== 'indeterminate') {
					selectedList.push(item);
				}
				if (item.children && item.children.length > 0) {
					getSelected(item.children);
				}
			});
		}
		getSelected(this.treeData);
		return selectedList;
	}

	/**
	 * 初始化数据
	 * @param treeData
	 * @param maxLevel
	 * @returns {*}
	 */
	initData(treeData, maxLevel) {
		const format = (node, level) => {
			const { children } = node;

			// 层级
			node.level = level;

			// 超过最大层级的节点将不允许新增节点
			if (maxLevel && node.level >= maxLevel) {
				node.disableAdd = true;
			}

			if (!children || !children.length) {
				return node;
			}
			children.forEach(item => {
				format(item, node.level + 1);
			});
			return node;
		};

		this.treeData = treeData.map(item => {
			return format(item, 1);
		});
	}

	/**
	 * 通过id获取节点
	 * @param id
	 * @returns {*}
	 */
	findNodeById(id) {
		return this.findNodeByParam('id', id);
	}

	/**
	 * 通过自定义键值获取节点
	 * @param param
	 * @param value
	 * @returns {*}
	 */
	findNodeByParam(param, value) {
		let node = null;

		const findFn = treeData => {
			treeData.some(item => {
				if (item[param] === value) {
					node = item;
					return true;
				}

				if (item.children && item.children.length) {
					return findFn(item.children);
				}

				return false;
			});
		};

		findFn(this.treeData);
		return node;
	}

	/**
	 * 新增子节点数据
	 * @param pId
	 * @param newNode
	 * @param addToPosition: 新节点添加后所在的位置
	 */
	addChild(pId, newNode, addToPosition) {
		// index = index || this.children.length;
		// this.children.splice(index, 0, node);
		const pNode = this.findNodeById(pId);
		if (!pNode.children) {
			pNode.children = [];
		}

		if (addToPosition === 'before') {
			pNode.children.unshift(newNode);
			return;
		}
		if (addToPosition === 'after') {
			pNode.children.push(newNode);
			return;
		}
	}

	/**
	 * 删除节点
	 * @param node
	 */
	removeChild(node) {
		const parentNode = this.findNodeById(node.pId);
		if (!parentNode) {
			return;
		}
		parentNode.children.forEach((child, index) => {
			// 新增的节点没有id， 所以使用name进行验证
			if (child.name === node.name) {
				parentNode.children.splice(index, 1);
			}
		});
		// 删除后节点移至父节点
		this.activeNode = null;
		this.updateActiveNode(parentNode);
	}

	/**
	 * 通过id更新节点数据
	 * @param id
	 * @param updatePart: 更新部分
	 * @returns {any}
	 */
	updateById(id, updatePart) {
		const node = this.findNodeById(id);
		return Object.assign(node, updatePart);
	}

	/**
	 * 更新新增节点的数据
	 * @param updatePart: 更新部分
	 * @returns {any}
	 */
	updateByEditing(updatePart) {
		const node = this.findNodeByParam('isEditing', true);
		return Object.assign(node, updatePart);
	}
}

export default Store;
