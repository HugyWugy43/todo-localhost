let tasks = [];
let dividerIndex = null; // Track where the divider is placed

document.addEventListener("DOMContentLoaded", () => {
  fetch("/tasks")
    .then((response) => response.json())
    .then((data) => {
      tasks = data;
      renderTasks();
    })
    .catch((error) => console.error("Error fetching tasks:", error));
});

// Function to show the completed tasks section
function showCompletedTasks() {
  document
    .getElementById("completed-tasks-container")
    .classList.remove("hidden");
  document.getElementById("show-completed").classList.add("hidden");
  document.getElementById("hide-completed").classList.remove("hidden");
}
function clearForm() {
  document.getElementById("task-name").value = "";
  document.getElementById("task-date").value = "";
  document.getElementById("task-category").value = "";
}
// Function to hide the completed tasks section
function hideCompletedTasks() {
  document.getElementById("completed-tasks-container").classList.add("hidden");
  document.getElementById("hide-completed").classList.add("hidden");
  document.getElementById("show-completed").classList.remove("hidden");
}
function saveTasksToBackend() {
  fetch("/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tasks: tasks }), // Send updated tasks to backend
  })
    .then((response) => response.json())
    .catch((error) => console.error("Error saving tasks:", error));
}

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
  };

  tasks.push(task);
  renderTasks();
  clearForm();
  saveTasksToBackend(); // Save to backend
}
let editingIndex = null; // Track the task being edited

// Enable editing of the task
function editTask(index) {
  editingIndex = index; // Set the task index for editing
  renderTasks(); // Re-render tasks with the editing form for the selected task
}

// Save the edited task and persist it to the backend
function saveTask(index) {
  const name = document.getElementById(`edit-name-${index}`).value;
  const dueDate = document.getElementById(`edit-date-${index}`).value;
  const category = document.getElementById(`edit-category-${index}`).value;

  if (name === "" || dueDate === "") {
    alert("Please fill in both the task name and due date");
    return;
  }

  // Update the task in the frontend
  tasks[index].name = name;
  tasks[index].dueDate = dueDate;
  tasks[index].category = category;

  editingIndex = null; // Clear the editing state
  renderTasks(); // Re-render tasks to show the updated task

  // Save the updated tasks to the backend
  saveTasksToBackend(); // Persist changes to the backend
}

function renderTasks() {
  const currentTasksList = document.getElementById("current-tasks-list");
  const otherTasksList = document.getElementById("other-tasks-list");
  const completedTasksList = document.getElementById("completed-tasks-list"); // Clear lists
  currentTasksList.innerHTML = "";
  otherTasksList.innerHTML = "";
  completedTasksList.innerHTML = "";
  let hasCompletedTasks = false; // Track if there are any completed tasks

  tasks.forEach((task, index) => {
    const taskItem = document.createElement("li");
    taskItem.setAttribute("data-index", index);
    taskItem.classList.add("task-item");
    taskItem.draggable = true;

    taskItem.addEventListener("dragstart", handleDragStart);
    taskItem.addEventListener("dragover", handleDragOver);
    taskItem.addEventListener("dragleave", handleDragLeave);
    taskItem.addEventListener("drop", handleDrop);

    taskItem.innerHTML = `<div>${task.name}</div>`;

    if (task.isCurrent) {
      currentTasksList.appendChild(taskItem); // Append to current tasks
    } else {
      otherTasksList.appendChild(taskItem); // Append to other tasks
    }
    const dueDateClass = getDueDateClass(task.dueDate);

    const completedDateText =
      task.completed && task.completedDate
        ? `<span class="completed-date">(Completed on ${task.completedDate})</span>`
        : "";

    // Show editable fields if the task is being edited
    if (index === editingIndex) {
      const taskCategorySelect = document.getElementById("task-category"); // Original select element

      // Dynamically generate category options from the original select element
      let categoryOptions = Array.from(taskCategorySelect.options)
        .map(
          (option) =>
            `<option value="${option.value}" ${
              task.category === option.value ? "selected" : ""
            }>${option.text}</option>`,
        )
        .join(""); // Join the options into a single string

      // Update the innerHTML for the task item
      taskItem.innerHTML = `
    <div class="task-info">
      <input type="text" id="edit-name-${index}" value="${task.name}">
      <input type="date" id="edit-date-${index}" value="${task.dueDate}">
      <select id="edit-category-${index}">
        ${categoryOptions} <!-- Dynamically generated options -->
      </select>
      <button onclick="saveTask(${index})">Save</button>
      <button onclick="cancelEdit()">Cancel</button>
    </div>
  `;
    } else {
      // Normal display mode for task
      taskItem.innerHTML = `
        <div class="task-info">
          <input type="checkbox" ${task.completed ? "checked" : ""} onclick="toggleTask(${index})">
          <label>
            ${task.name}
            <span class="category">Category: ${task.category} ${completedDateText}</span>
          </label>
        </div>
        <span class="due-date ${dueDateClass}">Due: ${task.dueDate}</span>
        <button class="remove-btn" onclick="removeTask(${index})">Remove</button>
        <button onclick="editTask(${index})">Edit</button>
        ${task.isCurrent ? `<button onclick="moveToOther(${index})">Other</button>` : `<button onclick="moveToCurrent(${index})">Select</button>`}
      `;
    }

    if (task.completed) {
      hasCompletedTasks = true; // There is at least one completed task
      completedTasksList.appendChild(taskItem);
    } else if (task.isCurrent) {
      currentTasksList.appendChild(taskItem);
    } else {
      otherTasksList.appendChild(taskItem);
    }
  });
  function cancelEdit() {
    editingIndex = null; // Clear the editing state
    renderTasks(); // Re-render tasks to exit edit mode
  }
  const showCompletedBtn = document.getElementById("show-completed");

  // Enable/disable the "Show Completed" button based on whether there are completed tasks
  if (hasCompletedTasks) {
    showCompletedBtn.disabled = false;
    showCompletedBtn.textContent = "Show Completed";
  } else {
    showCompletedBtn.disabled = true;
    showCompletedBtn.textContent = "No Completed Tasks";
  }
}
function removeTask(index) {
  tasks.splice(index, 1);
  renderTasks();
  saveTasksToBackend(); // Update backend after removing a task
}
// Move task to current tasks
function moveToCurrent(index) {
  tasks[index].isCurrent = true;
  renderTasks(); // Re-render tasks
}

// Move task to other tasks
function moveToOther(index) {
  tasks[index].isCurrent = false;
  renderTasks(); // Re-render tasks
}
function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  renderTasks();
  saveTasksToBackend(); // Update backend after completing a task
}

function sortTasksByDate() {
  tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  renderTasks();
  saveTasksToBackend(); // Update backend after sorting
}

function getDueDateClass(dueDate, today = new Date()) {
  const date = new Date(dueDate);
  const differenceInTime = date.getTime() - today.getTime();
  const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

  if (differenceInDays < 0) {
    return "red"; // Past due or today
  } else if (differenceInDays === 0) {
    return "red"; // Due today
  } else if (differenceInDays === 1) {
    return "yellow"; // Due tomorrow
  } else {
    return "green"; // More than one day away
  }
}

let draggedTaskIndex = null;
let currentTargetIndex = null; // Track the current target during drag

function handleDragStart(event) {
  draggedTaskIndex = event.target.getAttribute("data-index");
  event.dataTransfer.effectAllowed = "move";
  event.target.classList.add("dragging"); // Optional: style the dragged element
}
function handleDragOver(event) {
  event.preventDefault(); // Allow the drop

  const taskItem = event.target.closest("li.task-item");
  if (!taskItem) return;

  const targetListId = taskItem.closest("ul").id;
  const draggedTask = tasks[draggedTaskIndex];
  const originalListId = draggedTask.isCurrent
    ? "current-tasks-list"
    : "other-tasks-list";

  // If the task is being dragged into an invalid list, apply invalid-drop class
  if (targetListId !== originalListId) {
    taskItem.classList.add("invalid-drop");
  } else {
    taskItem.classList.add("drag-over");
  }
}

function handleDragLeave(event) {
  const taskItem = event.target.closest("li.task-item");
  if (taskItem) {
    taskItem.classList.remove("drag-over");
    taskItem.classList.remove("invalid-drop"); // Remove invalid drop feedback
  }
}
function handleDrop(event) {
  event.preventDefault();

  const taskItem = event.target.closest("li.task-item");
  if (!taskItem) return;

  const targetIndex = taskItem.getAttribute("data-index");
  const targetListId = taskItem.closest("ul").id; // Get the ID of the list being dropped into

  const draggedTask = tasks[draggedTaskIndex];

  // Get the original list of the dragged task
  const originalListId = draggedTask.isCurrent
    ? "current-tasks-list"
    : "other-tasks-list";

  // Prevent dragging between different task lists
  if (targetListId !== originalListId) {
    return; // Prevent dropping into a different list
  }

  if (draggedTaskIndex !== null && targetIndex !== null) {
    // Move the dragged task to the new position within the same list
    const task = tasks.splice(draggedTaskIndex, 1)[0];
    tasks.splice(targetIndex, 0, task);

    renderTasks(); // Re-render tasks in new order
    saveTasksToBackend(); // Persist the updated task order
  }

  // Clean up drag-over classes
  document.querySelectorAll("li.task-item").forEach((item) => {
    item.classList.remove("drag-over");
  });
}
function handleDragEnd(event) {
  // Reset everything when the drag ends
  draggedTaskIndex = null;
  currentTargetIndex = null;
  document
    .querySelectorAll(".drag-over")
    .forEach((el) => el.classList.remove("drag-over"));
}
let isEditing = false; // Track whether the user is in edit mode

// Load and render the notes on page load
document.addEventListener("DOMContentLoaded", () => {
  fetch("/notes")
    .then((response) => response.json())
    .then((data) => {
      const markdown = data.notes || ""; // Handle undefined or empty values
      renderMarkdown(markdown);
    })
    .catch((error) => console.error("Error fetching notes:", error));
});
const converter = new showdown.Converter({
  tasklists: true,
});
converter.setFlavor("github");
// Function to render the markdown or show the textarea
function renderMarkdown(markdown) {
  const container = document.getElementById("markdown-container");

  if (!isEditing) {
    // Show Markdown preview
    const html = converter.makeHtml(markdown);
    container.innerHTML = html;

    // Toggle buttons
    document.getElementById("edit-notes").classList.remove("hidden");
    document.getElementById("done-editing").classList.add("hidden");
  } else {
    // Show textarea for editing and populate it with the markdown content
    container.innerHTML = `<textarea id="markdown-input">${markdown}</textarea>`;

    // Toggle buttons
    document.getElementById("edit-notes").classList.add("hidden");
    document.getElementById("done-editing").classList.remove("hidden");
  }
}

// Function to start editing the notes
function editNotes() {
  // Fetch the notes again
  fetch("/notes")
    .then((response) => response.json())
    .then((data) => {
      const markdown = data.notes || "";
      isEditing = true;
      renderMarkdown(markdown);
    })
    .catch((error) => console.error("Error fetching notes:", error));
  const markdownContainer = document.getElementById("markdown-container");
  markdownContainer.addEventListener("input", function () {
    const content = document.getElementById("markdown-input").value;
    if (content.trim()) {
      // Ensure non-empty value
      fetch("/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: content }),
      });
    }
  });
}

// Function to stop editing and show the rendered notes
function doneEditing() {
  const markdownInput = document.getElementById("markdown-input");
  const markdown = markdownInput.value;

  // Save the edited notes
  fetch("/notes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notes: markdown }),
  }).then(() => {
    // Switch back to preview mode
    isEditing = false;
    renderMarkdown(markdown);
  });
}
