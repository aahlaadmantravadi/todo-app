// script.js for the Frontend (FINAL, DIRECT-TO-AI VERSION)

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIG & ELEMENTS ---
    const TODO_API_URL = "https://todo-app-backend-5h4k.onrender.com";
    const GEMINI_PROXY_URL = "https://render-proxy-api-server-service.onrender.com/generate";

    const objectiveList = document.getElementById('objective-list');
    const newObjectiveInput = document.getElementById('new-objective');
    const addBtn = document.getElementById('add-btn');
    const queryOutput = document.getElementById('query-output');

    // --- PRE-POPULATED DATA ---
    const sampleObjectives = [
        { id: 's1', description: 'Analyze Q3 sales performance by product category.', is_completed: false },
        { id: 's2', description: 'Identify top 10 customers by lifetime value.', is_completed: false },
        { id: 's3', description: 'Calculate the monthly active user (MAU) count for the last 6 months.', is_completed: true },
    ];
    
    // --- CORE FUNCTIONS ---
    const fetchObjectives = async () => {
        try {
            const response = await fetch(`${TODO_API_URL}/tasks`);
            let objectives = await response.json();
            objectiveList.innerHTML = '';
            
            if (objectives.length === 0) {
                objectives = sampleObjectives;
                queryOutput.innerHTML = `<div class="ai-response"><span class="role ai">AI:</span><p>Welcome. Your Slate is pre-populated. Click the ✨ icon to generate a SQL query.</p></div>`;
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
            <div class="ai-response"><span class="role ai">AI:</span><p class="thinking">Contacting AI service...</p></div>`;
        queryOutput.scrollTop = queryOutput.scrollHeight;

        try {
            const prompt = `Based on this data analyst task, write a generic SQL query. Format as one line. If not data-related, say "N/A". Task: "${objectiveText}"`;
            const response = await fetch(GEMINI_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });
            const result = await response.json();
            
            const aiResponseContainer = queryOutput.querySelector('.ai-response');
            if (result.candidates && result.candidates[0].content) {
                const generatedSql = result.candidates[0].content.parts[0].text.trim().replace(/\n/g, " ");
                if (generatedSql.toUpperCase() !== 'N/A') {
                    aiResponseContainer.innerHTML = `<span class="role ai">AI:</span><p>Here is a suggested query:</p><pre>${generatedSql}</pre>`;
                } else {
                    aiResponseContainer.innerHTML = `<span class="role ai">AI:</span><p>This is not a data-related objective. I can only assist with generating SQL.</p>`;
                }
            } else {
                throw new Error(result.error || 'Invalid response from AI service.');
            }

        } catch (error) {
            console.error("Error during AI query generation:", error);
            queryOutput.querySelector('.ai-response').innerHTML = `<span class="role ai">AI:</span><p>Error: ${error.message}</p>`;
        }
        queryOutput.scrollTop = queryOutput.scrollHeight;
    };

    const addObjective = async () => {
        const description = newObjectiveInput.value.trim();
        if (!description) return;
        
        // Optimistic UI update
        const tempObjective = { id: `temp-${Date.now()}`, description, is_completed: false };
        if (document.querySelector('.status.error, .ai-response')) { // Clear initial message if present
            objectiveList.innerHTML = '';
        }
        objectiveList.appendChild(createObjectiveElement(tempObjective));
        newObjectiveInput.value = '';

        try {
            // Send to backend to save permanently
            await fetch(`${TODO_API_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            });
        } catch (e
