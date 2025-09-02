document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIG & GLOBAL VARIABLES ---
    const API_BASE_URL = "https://todo-app-backend-5h4k.onrender.com";

    // --- SLATE (TO-DO) ELEMENTS ---
    const objectiveList = document.getElementById('objective-list');
    const newObjectiveInput = document.getElementById('new-objective');
    const addBtn = document.getElementById('add-btn');

    // --- QUERY ASSIST (AI) ELEMENTS ---
    const queryOutput = document.getElementById('query-output');
    const queryPromptInput = document.getElementById('query-prompt');
    const generateQueryBtn = document.getElementById('generate-query-btn');

    // --- SLATE LOGIC ---
    const fetchObjectives = async () => {
        // This function now only fetches and displays to-do items.
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`);
            const objectives = await response.json();
            objectiveList.innerHTML = '';
            objectives.forEach(obj => objectiveList.appendChild(createObjectiveElement(obj)));
        } catch (error) {
            console.error("Error fetching objectives:", error);
            objectiveList.innerHTML = `<li>Error loading objectives.</li>`;
        }
    };

    const createObjectiveElement = (obj) => {
        // No longer displays SQL. It's a pure to-do item now.
        const li = document.createElement('li');
        li.dataset.id = obj.id;
        li.innerHTML = `
            <input type="checkbox" ${obj.is_completed ? 'checked' : ''}>
            <span class="task-text">${obj.description}</span>
        `;
        if (obj.is_completed) li.classList.add('completed');
        li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => updateObjectiveStatus(obj.id, e.target.checked));
        return li;
    };

    const addObjective = async () => {
        const description = newObjectiveInput.value.trim();
        if (!description) return;
        newObjectiveInput.value = '';
        await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, generated_sql: "N/A" }) // AI is handled separately now
        });
        await fetchObjectives();
    };

    const updateObjectiveStatus = async (id, is_completed) => {
        await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_completed: is_completed ? 1 : 0 })
        });
        await fetchObjectives();
    };
    
    // --- QUERY ASSIST LOGIC ---
    const generateQuery = async () => {
        const prompt = queryPromptInput.value.trim();
        if (!prompt) return;

        // Add user's prompt to the output
        const userPromptHTML = `
            <div class="user-prompt">
                <span class="role user">User:</span>
                <p>${prompt}</p>
            </div>
        `;
        queryOutput.innerHTML += userPromptHTML;
        queryPromptInput.value = '';
        generateQueryBtn.disabled = true;

        // Add loading state
        const loadingHTML = `<div class="ai-response" id="loading"><span class="role ai">AI:</span><p>Thinking...</p></div>`;
        queryOutput.innerHTML += loadingHTML;
        queryOutput.scrollTop = queryOutput.scrollHeight;

        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, { // We still use the same endpoint, it's just a proxy now
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: prompt }), // We send the prompt as the 'description'
            });

            const result = await response.json();
            document.getElementById('loading').remove(); // Remove loading state
            
            let responseHTML;
            if (result.generated_sql && result.generated_sql !== 'N/A') {
                responseHTML = `<div class="ai-response"><span class="role ai">AI:</span><pre>${result.generated_sql}</pre></div>`;
            } else {
                responseHTML = `<div class="ai-response"><span class="role ai">AI:</span><p>I couldn't generate a SQL query for that. Please try a more specific data-related objective.</p></div>`;
            }
            queryOutput.innerHTML += responseHTML;

        } catch (error) {
            console.error("Error generating query:", error);
            document.getElementById('loading').remove();
            queryOutput.innerHTML += `<div class="ai-response"><span class="role ai">AI:</span><p>Sorry, an error occurred while connecting to the AI service.</p></div>`;
        } finally {
            generateQueryBtn.disabled = false;
            queryOutput.scrollTop = queryOutput.scrollHeight;
        }
    };
    
    // --- INITIALIZATION & EVENT LISTENERS ---
    addBtn.addEventListener('click', addObjective);
    newObjectiveInput.addEventListener('keypress', (e) => e.key === 'Enter' && addObjective());
    
    generateQueryBtn.addEventListener('click', generateQuery);
    queryPromptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateQuery();
        }
    });

    fetchObjectives(); // Initial load for the slate
});
