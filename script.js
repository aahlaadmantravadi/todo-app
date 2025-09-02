document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIG & ELEMENTS ---
    const API_BASE_URL = "https://todo-app-backend-5h4k.onrender.com";
    const objectiveList = document.getElementById('objective-list');
    const newObjectiveInput = document.getElementById('new-objective');
    const addBtn = document.getElementById('add-btn');
    const queryOutput = document.getElementById('query-output');

    // --- REALISTIC PRE-POPULATED DATA ---
    const sampleObjectives = [
        { id: 's1', description: 'Analyze Q3 sales performance by product category.', is_completed: false },
        { id: 's2', description: 'Identify top 10 customers by lifetime value.', is_completed: false },
        { id: 's3', description: 'Calculate the monthly active user (MAU) count for the last 6 months.', is_completed: true },
        { id: 's4', description: 'Find users who signed up but have not made a purchase.', is_completed: false },
        { id: 's5', description: 'Draft summary report for the weekly business review.', is_completed: false },
    ];
    
    // --- CORE FUNCTIONS ---
    const fetchObjectives = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`);
            let objectives = await response.json();
            objectiveList.innerHTML = '';
            
            if (objectives.length === 0) {
                objectives = sampleObjectives;
                queryOutput.innerHTML = `<div class="ai-response"><span class="role ai">AI:</span><p>Welcome. Your Slate is pre-populated with sample objectives. Click the ✨ icon to generate a SQL query.</p></div>`;
            }
            objectives.forEach(obj => objectiveList.appendChild(createObjectiveElement(obj)));
        } catch (error) {
            objectiveList.innerHTML = `<li class="status error">Could not load objectives.</li>`;
        }
    };

    const createObjectiveElement = (obj) => {
        const li = document.createElement('li');
        li.className = 'objective-item';
        li.dataset.id = obj.id;
        li.dataset.description = obj.description;
        if (obj.is_completed) li.classList.add('completed');
        li.innerHTML = `
            <input type="checkbox" ${obj.is_completed ? 'checked' : ''}>
            <span class="task-text">${obj.description}</span>
            <button class="generate-btn" title="Generate SQL Query">✨</button>
        `;
        li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => updateObjectiveStatus(obj, e.target.checked));
        li.querySelector('.generate-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            handleQueryGeneration(li);
        });
        return li;
    };

    const handleQueryGeneration = async (listItem) => {
        const objectiveText = listItem.dataset.description;
        document.querySelectorAll('.objective-item').forEach(item => item.classList.remove('active'));
        listItem.classList.add('active');
        
        queryOutput.innerHTML = `
            <div class="user-prompt"><span class="role user">Objective:</span><p>${objectiveText}</p></div>
            <div class="ai-response"><span class="role ai">AI:</span><p class="thinking">Analyzing objective...</p></div>
        `;
        queryOutput.scrollTop = queryOutput.scrollHeight;

        try {
            // Calling the NEW dedicated endpoint for AI generation
            const response = await fetch(`${API_BASE_URL}/generate-query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: objectiveText }),
            });
            const result = await response.json();
            
            // Replace content instantly for reliability
            const aiResponseContainer = queryOutput.querySelector('.ai-response');
            if (result.generated_sql && result.generated_sql !== 'N/A') {
                aiResponseContainer.innerHTML = `<span class="role ai">AI:</span><p>Here is a suggested query:</p><pre>${result.generated_sql}</pre>`;
            } else if (response.ok) {
                aiResponseContainer.innerHTML = `<span class="role ai">AI:</span><p>This is not a data-related objective. I can only assist with generating SQL.</p>`;
            } else {
                 // Handle errors returned from the server, like the "Failed to connect" message
                 throw new Error(result.error || 'Unknown server error');
            }

        } catch (error) {
            console.error("Error during AI query generation:", error);
            queryOutput.querySelector('.ai-response').innerHTML = `<span class="role ai">AI:</span><p>Error connecting to the AI service.</p>`;
        }
        queryOutput.scrollTop = queryOutput.scrollHeight;
    };

    const addObjective = async () => {
        const description = newObjectiveInput.value.trim();
        if (!description) return;
        newObjectiveInput.value = '';
        await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description })
        });
        await fetchObjectives();
    };

    const updateObjectiveStatus = async (objective, is_completed) => {
        // Prevents updating read-only sample Objectives
        if (String(objective.id).startsWith('s')) {
            const item = document.querySelector(`[data-id='${objective.id}']`);
            item.classList.toggle('completed', is_completed);
            item.querySelector('input[type="checkbox"]').checked = is_completed;
            return;
        }
        await fetch(`${API_BASE_URL}/tasks/${objective.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_completed: is_completed ? 1 : 0 })
        });
        await fetchObjectives();
    };

    // --- INITIALIZATION ---
    fetchObjectives();
    addBtn.addEventListener('click', addObjective);
    newObjectiveInput.addEventListener('keypress', (e) => e.key === 'Enter' && addObjective());
});
