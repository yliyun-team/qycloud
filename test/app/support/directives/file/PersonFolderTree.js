var tag = "PersonFolderTree: ";

angular.module("commons.directives").directive("personFolderTree", [
    '$log',
    '$filter',
    'constants',
    'PersonFileLoader',
    createTree
]);

function createTree($log, $filter, constants, PersonFileLoader) {

    function postLink($scope, $element, attrs) {
        $scope.directiveName = tag;
        $scope.personFolders = [];

        var settings = initSettings();
        var zTree = initTree(settings);
        fetchFolders(null);

        $scope.$parent.$on("uncheckAll", function (event, data) {
            zTree.checkAllNodes(false);
        });

        function getSelectFolders() {
            var nodes = zTree.getCheckedNodes(true);
            if (nodes && nodes.length) {
                return _.map(nodes, function (treeNode) {
                    return _.find($scope.personFolders, {fileId: treeNode.id});
                });
            } else {
                return [];
            }
        }

        function addFolderNode(folder) {
            if (!folder)
                return;

            var currentNode = zTree.getNodeByParam("id", folder.fileId);
            if (currentNode)
                return;

            var parentNode = folder.parentId ? zTree.getNodeByParam("id", folder.parentId) : null;
            zTree.addNodes(parentNode, {
                fileId: folder.fileId,
                parentId: folder.parentId || 0,
                name: folder.name,
                open: false,
                isParent: true,
                iconSkin: 'folder'
            }, true);
            //if (settings.chkboxType.Y.indexOf('s') > -1
            //    && parentNode
            //    && parentNode.getCheckStatus()
            //    && parentNode.getCheckStatus().checked) {
            //    zTree.checkNode(parentNode, true, true);
            //}
        }

        function addFolderNodes(folders, parentNode) {
            var folderNodes = _.map(folders, function (folder) {
                return {
                    id: folder.fileId,
                    fileId: folder.fileId,
                    parentId: folder.parentId || 0,
                    name: $filter("specialName")(folder.name, folder.fileType),
                    open: false,
                    isParent: true,
                    iconSkin: 'folder'
                }
            });
            zTree.addNodes(parentNode, folderNodes);
        }

        function initTree(settings) {
            $element.find("ul.ztree").attr("id", constants.getRandomStr());
            var self = this;
            return $.fn.zTree.init($element.find("ul.ztree"), {
                view: {
                    dblClickExpand: true,
                    showLine: false,
                    selectedMulti: false
                },
                check: {
                    enable: !!settings.showCheckBox,
                    chkboxType: settings.chkboxType
                },
                data: {
                    simpleData: {
                        enable: true,
                        idKey: "fileId",
                        pIdKey: "parentId",
                        rootPId: ""
                    }
                },
                callback: {
                    beforeClick: function (treeId, treeNode) {
                        if (treeNode && !$scope.settings.showCheckBox) {
                            var folder = _.find($scope.personFolders, function (folder) {
                                return folder.fileId == treeNode.id
                            });
                            updateSelectFolder(folder);
                        }

                        if (!treeNode) {
                            return false;
                        } else if (!treeNode.open) {
                            zTree.expandNode(treeNode, true, false, true, true);
                            return true;
                        } else {
                            zTree.expandNode(treeNode, false);
                            return false;
                        }
                    },

                    beforeExpand: function (treeId, treeNode) {
                        fetchFolders(treeNode.id);
                    },

                    onCheck: function (event, treeId, treeNode) {
                        updateSelectFolders();
                    }
                }
            }, []);
        }

        function updateSelectFolders() {
            if ($scope.onselect) {
                $scope.$apply(function () {
                    $scope.onselect({
                        selectFolders: getSelectFolders()
                    });
                });
            }
        }

        function updateSelectFolder(folder) {
            if ($scope.onselect) {
                $scope.$apply(function () {
                    $scope.onselect({
                        selectFolder: folder
                    });
                });
            }
        }

        function fetchFolders(folderId) {
            if (folderId) {
                var firstChild = _.find($scope.personFolders, {'parentId': folderId});
                if (!!firstChild) {
                    return;
                }
            }

            var callback = function (folders) {
                $scope.personFolders = $scope.personFolders.concat(folders || []);
                addFolderNodes(folders, folderId ? zTree.getNodeByParam("id", folderId) : null);
            };
            PersonFileLoader.fetchFolder(folderId).then(callback);
        }

        function initSettings() {
            return _.defaults($scope.settings || {}, {
                showManageFolder: true,
                showCheckBox: true,
                showPath: true,
                chkboxType: {"Y": "", "N": ""}
            });
        }
    }

    return {
        restrict: 'EA',
        replace: true,
        transclude: true,
        require: ["^?onselect"],
        template: __inline('../../templates/_entfoldertree.html'),
        scope: {
            'settings': '=',
            'onselect': '&'
        },
        link: postLink
    }
}

