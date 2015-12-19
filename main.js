'use strict';
(function($) {

    var doc = document;
    var listModel = {
        chosenList: null,
        
        lists: [],
        
        toggleTaskStatus: function(task) {

            task.solved = !task.solved;

            //toggle position of task depending on it's status

            /*
             var list = this.getCurrentList();
             var allTasks = list.tasks;
             var taskIndex = allTasks.indexOf(task);

             if (task.solved) {
             allTasks.push(task);
             allTasks.splice(taskIndex, 1);
             } else {
             allTasks.unshift(task);
             allTasks.splice(taskIndex+1, 1);
             }

             listView.render();*/

            this.saveListsData();
        },

        
        editListName: function(name) {
            var list = this.getCurrentList();

            if (list) {
                list.name = name;
            }
            this.saveListsData();
        },

        
        editTaskName: function(task, taskName) {
            task.description = taskName;
            this.saveListsData();
        },

        
        addNewList: function(value, id) {
            this.lists.push({
                name: value,
                id: id,
                tasks: []
            });
            this.saveListsData();
        },

        
        removeList: function() {
            var list = this.getCurrentList();
            var listIndex = this.lists.indexOf(list);

            this.lists.splice(listIndex, 1);
            this.saveListsData();
            this.chosenList = null;
        },

        
        removeTask: function(task) {
            var list = this.getCurrentList();
            var tasks = list.tasks;
            var taskId = tasks.indexOf(task);

            tasks.splice(taskId, 1);
            this.saveListsData();
        },

        
        getCurrentList: function() {
            var self = this;
            var list = self.lists.filter(function(list) {
                return list.id === self.chosenList;
            });
            return list.length ? list[0] : '';
        },

        
        getListById: function(id) {
            var list = this.lists.filter(function(list) {
                return list.id == id;
            });
            return list.length ? list[0] : '';
        },

        
        addTask: function(name) {
            var list = this.getCurrentList();

            if (list) {
                list.tasks.unshift({
                    description: name,
                    solved: false
                });
                this.saveListsData();
            }
        },

        
        getListsData: function() {
            var data = localStorage.getItem('lists');
            listModel.lists = data ? JSON.parse(data) : [];
        },

        
        getTaskByName: function(tasks, taskName) {
            var task = tasks.filter(function(task) {
                return task.description == taskName;
            });

            return task.length ? task[0] : '';
        },

        
        saveListsData: function() {
            var jsonData = JSON.stringify(this.lists);
            localStorage.setItem('lists', jsonData);
        },

        
        saveTasksPosition: function(order) {
            var list = this.getCurrentList();
            var tasks = list.tasks;
            var newTasksArray = [];
            var task;

            order.forEach(function(item, index) {
                task = tasks.filter(function(task) {
                    return task.description === item;
                })[0];
                newTasksArray[index] = task;
            });

            list.tasks = newTasksArray;

            this.saveListsData();
        },

        
        moveTaskToAnotherList: function(oldListId, taskName, newListId) {
            var oldList = this.getListById(oldListId);
            var oldListTasks = oldList.tasks;
            var newList = this.getListById(newListId);
            var task = this.getTaskByName(oldListTasks, taskName);
            var taskId = oldList.tasks.indexOf(task);

            if (task) {
                newList.tasks.unshift(task);
                oldList.tasks.splice(taskId, 1);
                this.saveListsData();
            }
        }
    };

    var allListsView = {
        init: function() {
            this.render();
        },

        render: function() {
            var self = this;
            var listWrapper = doc.querySelector('.lists-wrapper .panel');
            var lists = this.generateLists();
            self.destroy();
            listWrapper.appendChild(lists);
        },

        destroy: function() {
            var listUl = doc.querySelector('.lists-wrapper ul');

            if (listUl) {
                listUl.parentNode.removeChild(listUl);
            }
        },

        generateLists: function() {
            var lists = listModel.lists;
            var listUl = doc.createElement('ul');
            var listLi;
            var isChosen;
            var chosenList;

            listUl.className = "list-group";

            if (!lists.length) {
                listUl.classList.add('empty');
                listUl.textContent = 'Oops, there are no lists to display';
            } else {
                lists.forEach(function(list) {
                    isChosen = list.id === listModel.chosenList;
                    listLi = doc.createElement('li');
                    listLi.className = 'list list-group-item ' + (isChosen ? 'list-active' : '');
                    listLi.textContent = list.name;
                    listLi.id = list.id;

                    listLi.addEventListener('click', function() {
                        chosenList = doc.querySelector('.list.list-active');

                        if (chosenList) {
                            chosenList.classList.remove('list-active');
                        }

                        this.classList.add('list-active');

                        listView.selectList(list.id);

                    });

                    allListsView.makeLiDroppable(listLi);

                    listUl.appendChild(listLi);
                });
            }
            return listUl;
        },

        makeLiDroppable: function(li) {
            $(li).droppable({
                drop: function(event, ui) {
                    var newList = event.target;
                    var task = ui.draggable[0];

                    listModel.moveTaskToAnotherList(task.listId, task.taskName, newList.id);
                    listView.render();
                },
                accept: function(elem) {
                    return this.id != elem[0].listId;
                },
                hoverClass: "drop-hover"
            });
        }
    };

    var listView = {
        init: function() {
            var list = listModel.getCurrentList();
            var listDetails = doc.createElement('div');
            var tasks;
            var tasksList;
            var listName = doc.querySelector('.list-view .list-name');
            var listTitle;
            var listId;

            listDetails.className = 'list-details';

            if (list) {
                tasks = list.tasks;
                listId = list.id;
                listTitle = doc.createElement('h3');
                listTitle.textContent = list.name;

                tasksList = this.generateTasksList(tasks, listId);

                listName.textContent = list.name;
                listDetails.appendChild(tasksList);

                return listDetails;
            }

            return false;
        },

        selectList: function(id) {
            if (id) {
                listModel.chosenList = id;
                this.render();
            }
        },

        generateTasksList: function(tasks, listId) {
            var taskLi;
            var tasksUl;
            var taskCheckBox;
            var taskLabel;
            var editTaskButton;

            tasksUl = doc.createElement('ul');
            tasksUl.className = 'tasks-wrapper col-xs-8 col-sm-5 col-md-5';

            tasks.forEach(function(task) {
                taskLi = doc.createElement('li');
                taskLi.className = 'task-item ' + (task.solved ? 'solved' : '');

                taskLi.listId = listId;
                taskLi.taskName = task.description;

                taskCheckBox = doc.createElement('input');
                taskCheckBox.type = 'checkbox';
                taskCheckBox.checked = task.solved;

                taskCheckBox.addEventListener('change', (function(taskLi) {
                    return function() {
                        listModel.toggleTaskStatus(task);
                        taskLi.className = 'task-item ' + (task.solved ? 'solved' : '');
                    }
                }(taskLi)));

                taskLabel = doc.createElement('label');
                taskLabel.textContent = task.description || 'no task here';
                taskLabel.insertBefore(taskCheckBox, taskLabel.firstChild);

                editTaskButton = doc.createElement('div');
                editTaskButton.className = 'btn btn-link';
                editTaskButton.textContent = 'Edit';
                editTaskButton.addEventListener('click', (function(task) {
                    return function() {
                        editTaskPanel.enableEditMode(task);
                    };
                }(task)));

                taskLi.appendChild(taskLabel);
                taskLi.appendChild(editTaskButton);

                listView.makeTasksSortable(tasksUl);
                tasksUl.appendChild(taskLi);

            });
            return tasksUl;
        },

        makeTasksSortable: function(tasksUl) {
            $(tasksUl).sortable({
                stop: function() {
                    var taskLis = document.querySelectorAll('.task-item label');
                    var newOrder = [].map.call(taskLis, function(li) {
                        return li.textContent;
                    });
                    listModel.saveTasksPosition(newOrder);
                }
            });
        },

        destroy: function() {
            var listView = doc.querySelector('.list-details');
            listView.parentNode.removeChild(listView);
        },

        render: function() {
            var listView = doc.querySelector('.list-view');
            var listDetails = this.init();

            if (listDetails) {
                listView.classList.remove('hidden');
                this.destroy();
                listView.appendChild(listDetails);
            } else {
                listView.classList.add('hidden');
            }
        }
    };

    var listCreator = {
        init: function() {
            var self = this;
            var createListForm = doc.querySelector('form[name="create-list"]');
            var cancelButton = doc.querySelector('.cancel-list-creation');

            createListForm.addEventListener('submit', function(event) {
                event.preventDefault();
                self.createList();
            });

            cancelButton.addEventListener('click', this.cancelListCreation);
        },

        showListCreator: function() {
            var listCreator = doc.querySelector('.list-creator');
            listCreator.classList.remove('hidden');
        },

        createList: function() {
            var listNameInput = doc.querySelector('.list-name');
            var inputValue = listNameInput.value;
            var newId = helpers.generateRandomId();

            listModel.addNewList(inputValue, newId);
            listNameInput.value = '';

            listView.selectList(newId);
            allListsView.render();

            this.cancelListCreation();
        },

        cancelListCreation: function() {
            var listNameInput = doc.querySelector('.list-name');
            listNameInput.value = '';
        }
    };

    var taskCreator = {
        init: function() {
            var self = this;
            var addTaskForm = doc.querySelector('form[name="add-task"]');
            var cancelButton = doc.querySelector('.cancel-task-creation');

            addTaskForm.addEventListener('submit', function(event) {
                event.preventDefault();
                self.addTask();
                self.clearTaskField();
            });

            cancelButton.addEventListener('click', self.clearTaskField);
        },

        addTask: function() {
            var taskNameInput = doc.querySelector('.task-name');
            var taskName = taskNameInput.value;

            listModel.addTask(taskName);

            listView.render();
        },

        clearTaskField: function() {
            var taskNameInput = doc.querySelector('.task-name');
            taskNameInput.value = '';
        }
    };

    var helpers = {
        generateRandomId: function() {
            var min = 100000;
            var max = 999999;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    };

    var editListPanel = {
        init: function() {
            var editListForm = doc.querySelector('form[name="edit-list-name"]');
            var editListButton = doc.querySelector('.edit-list');
            var cancelButton = doc.querySelector('.cancel-list-name-edit');
            var deleteListButton = doc.querySelector('.delete-list');

            editListButton.addEventListener('click', editListPanel.enableEditListMode);
            editListForm.addEventListener('submit', function(event) {
                event.preventDefault();
                editListPanel.saveName();
            });
            cancelButton.addEventListener('click', editListPanel.disableEditListMode);
            deleteListButton.addEventListener('click', editListPanel.deleteList);
        },

        enableEditListMode: function() {
            var editListNameForm = doc.querySelector('form[name="edit-list-name"]');
            var newNameInput = editListNameForm.querySelector('.list-name');
            var editListButton = doc.querySelector('.edit-list');
            var listName = doc.querySelector('.list-view .list-name');

            editListButton.classList.add('hidden');
            listName.classList.add('hidden');

            newNameInput.value = listName.textContent;
            editListNameForm.classList.remove('hidden');
            newNameInput.focus();
        },

        disableEditListMode: function() {
            var editListNameForm = doc.querySelector('form[name="edit-list-name"]');
            var newNameInput = editListNameForm.querySelector('.list-name');
            var editListButton = doc.querySelector('.edit-list');
            var listName = doc.querySelector('.list-view .list-name');

            editListButton.classList.remove('hidden');
            listName.classList.remove('hidden');

            newNameInput.value = '';
            editListNameForm.classList.add('hidden');
        },

        deleteList: function() {
            var confirmText = 'Do you really want to delete this item?';
            if (confirm(confirmText)) {
                listModel.removeList();
                listView.render();
                allListsView.render();
                editListPanel.disableEditListMode();
            }
        },

        saveName: function() {
            var oldListName = doc.querySelector('.list-view .list-name').textContent;
            var newNameInput = doc.querySelector('form[name="edit-list-name"] .list-name');
            var newListName = newNameInput.value;

            if (oldListName !== newListName) {
                listModel.editListName(newListName);
                listView.render();
                allListsView.render();
            }

            this.disableEditListMode();
        }
    };

    var editTaskPanel = {
        currentTask: null,
        init: function() {
            var editTaskForm = doc.querySelector('form[name="edit-task"]');
            var cancelButton = doc.querySelector('.cancel-task-editing');
            var deleteTaskButton = doc.querySelector('.delete-task');

            editTaskForm.addEventListener('submit', function(event) {
                event.preventDefault();
                editTaskPanel.saveTaskName();

            });
            cancelButton.addEventListener('click', editTaskPanel.disableEditMode);
            deleteTaskButton.addEventListener('click', editTaskPanel.deleteTask);
        },

        enableEditMode: function(task) {
            var addTaskForm = doc.querySelector('form[name="add-task"]');
            var editTaskForm = doc.querySelector('form[name="edit-task"]');
            var newNameInput = editTaskForm.querySelector('.task-name');

            addTaskForm.classList.add('hidden');

            this.currentTask = task;
            newNameInput.value = this.currentTask.description;
            editTaskForm.classList.remove('hidden');
            newNameInput.focus();
        },

        disableEditMode: function() {
            var addTaskForm = doc.querySelector('form[name="add-task"]');
            var editTaskForm = doc.querySelector('form[name="edit-task"]');
            var newNameInput = editTaskForm.querySelector('.task-name');

            newNameInput.value = '';
            editTaskForm.classList.add('hidden');
            addTaskForm.classList.remove('hidden');

            this.currentTask = null;
        },

        deleteTask: function() {
            var confirmText = 'Do you really want to delete this item?';
            if (confirm(confirmText)) {
                listModel.removeTask(editTaskPanel.currentTask);
                listView.render();
                editTaskPanel.disableEditMode();
            }
        },

        saveTaskName: function() {
            var oldTaskName = this.currentTask.descriptions;
            var newNameInput = doc.querySelector('form[name="edit-task"] .task-name');
            var newTaskName = newNameInput.value;

            if (oldTaskName !== newTaskName) {
                listModel.editTaskName(this.currentTask, newTaskName);
                listView.render();
            }

            this.disableEditMode();
        }
    };

    listModel.getListsData();

    listCreator.init();
    taskCreator.init();
    editListPanel.init();
    editTaskPanel.init();

    allListsView.render();

}(window.jQuery));