// --- THIS IS THE URL OF THE BACKEND YOU JUST DEPLOYED ---
const API_BASE_URL = "https://todo-app-backend-5h4k.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    const todoList = document.getElementById('todo-list');
    const newTodoInput = document.getElementById('new-todo');
    const addBtn = document.getElementById('add-btn');

    const fetchTasks = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`);
            const tasks = await response.json();
            todoList.innerHTML = ''; // Clear the list before repopulating
            tasks.forEach(task => {
                todoList.appendChild(createTaskElement(task));
            });
        } catch (error) {
            console.error("Error fetching tasks:", error);
            alert("Could not connect to the backend. Please ensure it's running.");
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
            ${task.generated_sql && task.generated_sql !== 'N/A' ? `<div class="generated-sql"><strong>Suggested Query:</strong> ${task.generated_sql}</div>` : ''}
        `;
    
        li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
            updateTaskStatus(task.id, e.target.checked);
        });
    
        li.querySelector('.delete-btn').addEventListener('click', () => {
            deleteTask(task.id);
        });
    
        return li;
    };

    const addTask = async () => {
        const description = newTodoInput.value.trim();
        if (description === '') return;

        addBtn.disabled = true;
        addBtn.textContent = '...';
        try {
            await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description }),
            });
            newTodoInput.value = '';
            fetchTasks(); // Refresh the entire list from the database
        } catch (error) {
            console.error("Error adding task:", error);
        } finally {
            addBtn.disabled = false;
            addBtn.textContent = 'ADD';
        }
    };

    const updateTaskStatus = async (id, is_completed) => {
        await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_completed: is_completed ? 1 : 0 }),
        });
        fetchTasks(); // Refresh list
    };
    
    const deleteTask = async (id) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        await fetch(`${API_BASE_URL}/tasks/${id}`, { method: 'DELETE' });
        fetchTasks(); // Refresh list
    };

    addBtn.addEventListener('click', addTask);
    newTodoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Load all tasks from the database when the page first loads
    fetchTasks();
});
