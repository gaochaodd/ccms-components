import Inject from 'angular-es-utils/decorators/Inject';
import Store from './Store';
import Handler from './Handler';

@Inject('$ccTips', '$ccModal', '$scope', '$timeout')
export default class TreeCtrl {
	// 搜索词
	searchText = '';

	// 右键菜单样式
	contextMenuStyle = {};

	// 存储右键菜单项
	contextMenuItems = null;

	// 存储树所需要的数据和事件
	treeMap = {};

	$onInit() {
		this.setDefaultValue();
		this.documentListener = document.addEventListener('click', () => {
			this.hideContextMenu();
		}, true);
	}

	/**
	 * 设置默认值
	 */
	setDefaultValue() {
		// 新节点添加后所在的位置，默认值为after
		this.addToPosition = this.addToPosition || 'after';

		// 最大节点长度
		this.nodeMaxLen = this.nodeMaxLen || 20;
	}

	/**
	 * 更新搜索词
	 * @param searchText
	 */
	updateSearchText(searchText) {
		this.treeMap.searchText	= searchText;
	}

	/**
	 * 初始化数据
	 * @param treeData
	 */
	initData(treeData, maxLevel) {
		this.treeMap.handler = new Handler(this);
		this.treeMap.store = new Store(treeData, maxLevel);
		this.treeData = this.treeMap.store.treeData;
	}

	/**
	 * 当前选中的节点
	 * @returns {*|string}
	 */
	get activeNode() {
		return this.treeMap.store.activeNode;
	}

	/**
	 * 当前选中的节点ID
	 * @returns {*|string}
	 */
	get selectedId() {
		return this.treeMap.store.activeNode && this.treeMap.store.activeNode.id;
	}

	/**
	 * 事件：打开右键菜单
	 * @param node
	 * @param $event
	 */
	onOpenMenu = (node, $event) => {
		this.treeMap.store.updateActiveNode(node);
		this.contextMenuStyle = {
			display: 'block',
			left: `${$event.pageX}px`,
			top: `${$event.pageY + 10}px`
		};

		// 菜单项
		this.contextMenuItems = this.getContextMenus(node);
		$event.stopPropagation();
	};

	/**
	 * 删除节点
	 * @param node
	 */
	removeNode = node => {
		const confirmModal = this._$ccModal.confirm('你确定删除此目录吗？');

		confirmModal.open().result.then(() => {
			if (node.children && node.children.length) {
				this._$ccTips.error('该目录含有子目录，无法删除！ ');
			} else {
				this.treeMap.handler.onRemoveAction && this.treeMap.handler.onRemoveAction(node).then(() => {
					this.treeMap.store.removeChild(node);
					this._$timeout(() => {
						this._$scope.$digest();
					});
				})
				.catch(msg => {
					this._$ccTips.error(msg || '删除失败');
				});
			}
		});
	};

	/**
	 * 将节点变更为编辑状态
	 * @param node
	 */
	upateNodeEditing = node => {
		this.treeMap.store.updateById(node.id, { isEditing: true });
	};

	/**
	 * 增加一个输入节点
	 * @param parentNode: 父节点
	 */
	addBlankNode = (parentNode, addToPosition) => {
		// 新增的节点，无id
		const blankNode = {name: '', pId: parentNode.id, level: parentNode.level + 1, isEditing: true};

		this.treeMap.store.addChild(parentNode.id, blankNode, addToPosition);
	};

	/**
	 * 获取菜单项
	 * @param node
	 */
	getContextMenus(node) {
		const menuList = [];
		this.treeMap.handler.onAddAction && menuList.push({
			name: '新增',
			click: node => {
				this.addBlankNode(node, this.addToPosition);
			},
			disabled: node.disableAdd
		});

		this.treeMap.handler.onRemoveAction && menuList.push({
			name: '删除',
			click: node => {
				this.removeNode(node);
			},
			disabled: node.disableRemove
		});

		this.treeMap.handler.onRenameAction && menuList.push({
			name: '重命名',
			click: node => {
				this.upateNodeEditing(node);
			},
			disabled: node.disableRename
		});
		return menuList;
	}

	/**
	 * 隐藏右键菜单
	 */
	hideContextMenu() {
		this.contextMenuStyle = { display: 'none' };
	}

	$onChanges(changeObj) {
		const {data, maxLevel = {currentValue: undefined}} = changeObj;
		if (data && data.currentValue) {
			this.initData(data.currentValue, maxLevel.currentValue);
		}
	}

	$onDestory() {
		document.removeEventListener('click', this.documentListener);
	}
}
