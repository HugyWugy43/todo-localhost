
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

      function toggleCompletedTasks() {
        const completedContainer = document.getElementById(
          "completed-tasks-container",
        );
        completedContainer.style.display =
          completedContainer.style.display === "none" ? "block" : "none";
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
          .then((data) => console.log("Tasks saved:", data))
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
        const category = document.getElementById(
          `edit-category-${index}`,
        ).value;

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
        const completedTasksList = document.getElementById(
          "completed-tasks-list",
        );

        currentTasksList.innerHTML = ""; // Clear current tasks
        otherTasksList.innerHTML = ""; // Clear other tasks
        completedTasksList.innerHTML = ""; // Clear completed tasks

        tasks.forEach((task, index) => {
          const taskItem = document.createElement("li");
          taskItem.setAttribute("data-index", index); // Store the index for drag/drop functionality
          taskItem.draggable = true; // Make the task draggable

          const dueDateClass = getDueDateClass(task.dueDate);

          // Conditionally show completed date if the task is marked as completed
          const completedDateText =
            task.completed && task.completedDate
              ? `<span class="completed-date">(Completed on ${task.completedDate})</span>`
              : "";

          // Display task with edit mode or normal mode
          if (index === editingIndex) {
            // If editing, display input fields for name, date, and category
            taskItem.innerHTML = `
                <div class="task-info">
                    <input type="text" id="edit-name-${index}" value="${task.name}">
                    <input type="date" id="edit-date-${index}" value="${task.dueDate}">
                    <select id="edit-category-${index}">
                        <option value="Work" ${task.category === "Work" ? "selected" : ""}>Work</option>
                        <option value="Personal" ${task.category === "Personal" ? "selected" : ""}>Personal</option>
                        <option value="Other" ${task.category === "Other" ? "selected" : ""}>Other</option>
                    </select>
                </div>
                <button onclick="saveTask(${index})">Save</button>
            `;
          } else {
            // Normal display mode
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
                ${
                  task.isCurrent
                    ? `<button onclick="moveToOther(${index})">Other</button>`
                    : `<button onclick="moveToCurrent(${index})">Select</button>`
                }
            `;
          }

          // Append the task to the right list
          if (task.completed) {
            completedTasksList.appendChild(taskItem); // Add to completed tasks
          } else if (task.isCurrent) {
            currentTasksList.appendChild(taskItem); // Add to current tasks
          } else {
            otherTasksList.appendChild(taskItem); // Add to other tasks
          }
        });
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

      function getDueDateClass(dueDate) {
        const today = new Date();
        const date = new Date(dueDate);
        const differenceInTime = date.getTime() - today.getTime();
        const differenceInDays = Math.ceil(
          differenceInTime / (1000 * 3600 * 24),
        );

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

      // Handle drag-and-drop for divider
      // Store the index of the task being dragged
      let draggedTaskIndex = null;

      function handleDragStart(event) {
        draggedTaskIndex = event.target.getAttribute("data-index"); // Get the dragged task's index
        event.dataTransfer.effectAllowed = "move";
      }

      // Allow dragging over the target task
      function handleDragOver(event) {
        event.preventDefault(); // Necessary to allow dropping
        event.dataTransfer.dropEffect = "move";
      }

      // Handle the drop event, update the order
      function handleDrop(event) {
        event.preventDefault();
        const targetIndex = event.target.getAttribute("data-index"); // Get the index of the drop target

        if (draggedTaskIndex !== null && targetIndex !== null) {
          // Move the dragged task to the new position in the same list
          const draggedTask = tasks.splice(draggedTaskIndex, 1)[0]; // Remove the dragged task
          tasks.splice(targetIndex, 0, draggedTask); // Insert at the new position

          renderTasks(); // Re-render tasks in new order
          saveTasksToBackend(); // Persist the updated task order
        }
      }

      // Reset the dragging state
      function handleDragEnd(event) {
        draggedTaskIndex = null; // Reset the dragged task index
      }

      function renderMarkdown() {
          const markdownInput = document.getElementById("markdown-input").value;
          const converter = new showdown.Converter({
            tasklists: true
          })
          converter.setFlavor('github')

        const html = converter.makeHtml(markdownInput); // Convert markdown to HTML
        document.getElementById("markdown-preview").innerHTML = html; // Render the HTML
      }
