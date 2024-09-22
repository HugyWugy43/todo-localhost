
document.addEventListener("DOMContentLoaded", () => {
    fetch("/tasks")
        .then(response => response.json())
        .then(data => {
            tasks = data;
            renderTasks();
        })
        .catch(error => console.error("Error fetching tasks:", error));

    const markdownConverter = new showdown.Converter();
    document.getElementById("render-markdown").addEventListener("click", () => {
        const markdownInput = document.getElementById("markdown-input").value;
        const html = markdownConverter.makeHtml(markdownInput);
        document.getElementById("markdown-preview").innerHTML = html;
    });
});

let tasks = [];
let editingIndex = null;

function addTask() {
    const taskName = document.getElementById("task-name").value;
    const taskDate = document.getElementById("task-date").value;
    const taskCategory = document.getElementById("task-category").value;

    if (taskName === "" || taskDate === "") {
        alert("Please fill in both the task name and due date");
        return;
    }

    const task = {
        name: taskName,
        dueDate: taskDate,
        category: taskCategory,
        completed: false,
        isCurrent: false,
        completedDate: null
    };

    tasks.push(task);
    renderTasks();
    saveTasksToBackend();
}

function toggleTask(index) {
    const task = tasks[index];
    task.completed = !task.completed;

    if (task.completed) {
        const today = new Date().toISOString().split("T")[0];
        task.completedDate = today;
    } else {
        task.completedDate = null;
    }

    renderTasks();
    saveTasksToBackend();
}

function moveToCurrent(index) {
    tasks[index].isCurrent = true;
    renderTasks();
}

function moveToOther(index) {
    tasks[index].isCurrent = false;
    renderTasks();
}

function removeTask(index) {
    tasks.splice(index, 1);
    renderTasks();
    saveTasksToBackend();
}

function editTask(index) {
    editingIndex = index;
    renderTasks();
}

function saveTask(index) {
    const name = document.getElementById(`edit-name-${index}`).value;
    const dueDate = document.getElementById(`edit-date-${index}`).value;
    const category = document.getElementById(`edit-category-${index}`).value;

    tasks[index].name = name;
    tasks[index].dueDate = dueDate;
    tasks[index].category = category;
    editingIndex = null;
    renderTasks();
    saveTasksToBackend();
}

function saveTasksToBackend() {
    fetch("/tasks", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ tasks: tasks })
    }).then(response => response.json())
      .then(data => console.log("Tasks saved:", data))
      .catch(error => console.error("Error saving tasks:", error));
}

function renderTasks() {
    const currentTasksList = document.getElementById("current-tasks-list");
    const otherTasksList = document.getElementById("other-tasks-list");
    const completedTasksList = document.getElementById("completed-tasks-list");

    currentTasksList.innerHTML = "";
    otherTasksList.innerHTML = "";
    completedTasksList.innerHTML = "";

    tasks.forEach((task, index) => {
        const taskItem = document.createElement("li");
        taskItem.setAttribute("data-index", index);

        const dueDateClass = getDueDateClass(task.dueDate);
        const completedDateText = task.completed && task.completedDate ? 
                                  `<span class="completed-date">(Completed on ${task.completedDate})</span>` : "";

        taskItem.innerHTML = editingIndex === index ? `
            <div class="task-info">
                <input type="text" id="edit-name-${index}" value="${task.name}">
                <input type="date" id="edit-date-${index}" value="${task.dueDate}">
                <select id="edit-category-${index}">
                    <option value="Work" ${task.category === 'Work' ? 'selected' : ''}>Work</option>
                    <option value="Personal" ${task.category === 'Personal' ? 'selected' : ''}>Personal</option>
                    <option value="Other" ${task.category === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <button onclick="saveTask(${index})">Save</button>
        ` : `
            <div class="task-info">
                <input type="checkbox" ${task.completed ? "checked" : ""} onclick="toggleTask(${index})">
                <label>
                    ${task.name} <span class="category">Category: ${task.category} ${completedDateText}</span>
                </label>
            </div>
            <span class="due-date ${dueDateClass}">Due: ${task.dueDate}</span>
            <button onclick="removeTask(${index})">Remove</button>
            <button onclick="editTask(${index})">Edit</button>
            ${task.isCurrent ? `<button onclick="moveToOther(${index})">Other</button>` :
                              `<button onclick="moveToCurrent(${index})">Select</button>`}
        `;

        if (task.completed) {
            completedTasksList.appendChild(taskItem);
        } else if (task.isCurrent) {
            currentTasksList.appendChild(taskItem);
        } else {
            otherTasksList.appendChild(taskItem);
        }
    });
}

function getDueDateClass(dueDate) {
    const today = new Date();
    const taskDate = new Date(dueDate);
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (diffDays < 0) return "red";
    if (diffDays === 0) return "yellow";
    return "green";
}
