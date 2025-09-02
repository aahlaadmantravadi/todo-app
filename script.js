// --- THIS IS THE URL OF YOUR LIVE BACKEND ---
const API_BASE_URL = "https://todo-app-backend-5h4k.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    const todoList = document.getElementById('todo-list');
    const newTodoInput = document.getElementById('new-todo');
    const addBtn = document.getElementById('add-btn');

    const fetchTasks = async () => {
        todoList.innerHTML = `<li class="status">Loading objectives...</li>`; // Loading feedback
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            
            const tasks = await response.json();
            todoList.innerHTML = ''; // Clear loading message
            
            if (tasks.length === 0) {
                todoList.innerHTML = `<li class="status">No objectives logged yet.</li>`; // Empty state
            } else {
                tasks.forEach(task => todoList.appendChild(createTaskElement(task)));
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
            todoList.innerHTML = `<li class="status error">Could not connect to the server.</li>`;
        }
    };

    const createTaskElement = (task) => {
        const li = document.createElement('li');
        li.dataset.id = task.id;
        if (task.is_completed) li.classList.add('completed');

        li.innerHTML = `
            <div class="task-content">
                <input type="checkbox" ${task.is_completed ? 'checked' : ''}>
                <span class="task-text">${task.description}</span>
                <button class="delete-btn">X</button>
            </div>
            ${task.generated_sql && task.generated_sql !== 'N/A' 
                ? `<div class="generated-sql"><strong>Suggested Query:</strong> ${task.generated_sql}</div>` 
                : `<div class="generated-sql neutral"><strong>Note:</strong> Not a data-related objective.</div>`
            }
        `;

        li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => updateTaskStatus(task.id, e.target.checked));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
        return li;
    };

    const addTask = async () => {
        const description = newTodoInput.value.trim();
        if (description === '') return;

        addBtn.disabled = true;
        addBtn.innerHTML = `...`; // Visual feedback for processing

        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description }),
            });

            if (!response.ok) {
                 throw new Error('Failed to add objective.');
            }
            
            newTodoInput.value = '';
            await fetchTasks(); // Refresh the list from the server
        } catch (error) {
            console.error("Error adding task:", error);
            alert("Error: Could not add the objective. Please try again."); // User-facing error
        } finally {
            addBtn.disabled = false;
            addBtn.innerHTML = `LOG`; // ALWAYS resets the button
        }
    };

    const updateTaskStatus = async (id, is_completed) => {
        await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_completed: is_completed ? 1 : 0 }),
        });
        await fetchTasks();
    };
    
    const deleteTask = async (id) => {
        if (!confirm('Are you sure you want to delete this objective?')) return;
        await fetch(`${API_BASE_URL}/tasks/${id}`, { method: 'DELETE' });
        await fetchTasks();
    };

    addBtn.addEventListener('click', addTask);
    newTodoInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());

    fetchTasks();
});
