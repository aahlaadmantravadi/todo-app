document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIG & ELEMENTS ---
    const API_BASE_URL = "https://todo-app-backend-5h4k.onrender.com";
    const objectiveList = document.getElementById('objective-list');
    const newObjectiveInput = document.getElementById('new-objective');
    const addBtn = document.getElementById('add-btn');
    const queryOutput = document.getElementById('query-output');

    // --- REALISTIC PRE-POPULATED DATA ---
    const sampleObjectives = [
        { id: 's1', description: 'Analyze Q3 sales performance by product category.', is_completed: 0 },
        { id: 's2', description: 'Identify top 10 customers by lifetime value.', is_completed: 0 },
        { id: 's3', description: 'Calculate the monthly active user (MAU) count for the last 6 months.', is_completed: 1 },
        { id: 's4', description: 'Find users who signed up but have not made a purchase.', is_completed: 0 },
        { id: 's5', description: 'Draft summary report for the weekly business review.', is_completed: 0 },
    ];
    
    // --- CORE FUNCTIONS ---
    const fetchObjectives = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`);
            let objectives = await response.json();
            objectiveList.innerHTML = '';
            
            if (objectives.length === 0) {
                // If the database is empty, show the sample data
                objectives = sampleObjectives;
                queryOutput.innerHTML = `<div class="ai-response"><span class="role ai">AI:</span><p>Welcome to the Command Center. Your Slate has been pre-populated with sample objectives. Click the ✨ icon next to any data-related objective to generate a SQL query.</p></div>`;
            }

            objectives.forEach(obj => objectiveList.appendChild(createObjectiveElement(obj)));
        } catch (error) {
            console.error("Error fetching objectives:", error);
            objectiveList.innerHTML = `<li>Error loading objectives.</li>`;
        }
    };

    const createObjectiveElement = (obj) => {
        const li = document.createElement('li');
        li.className = 'objective-item';
        li.dataset.id = obj.id;
        li.dataset.description = obj.description;

        li.innerHTML = `
            <input type="checkbox" ${obj.is_completed ? 'checked' : ''}>
            <span class="task-text">${obj.description}</span>
            <button class="generate-btn" title="Generate SQL Query">✨</button>
        `;

        if (obj.is_completed) li.classList.add('completed');
        
        li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => updateObjectiveStatus(obj.id, e.target.checked));
        li.querySelector('.generate-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents clicks from bubbling up
            handleQueryGeneration(li);
        });

        return li;
    };

    const handleQueryGeneration = async (listItem) => {
        const objectiveText = listItem.dataset.description;
        
        // Highlight the selected item
        document.querySelectorAll('.objective-item').forEach(item => item.classList.remove('active'));
        listItem.classList.add('active');
        
        // Display user prompt in terminal
        queryOutput.innerHTML = `<div class="user-prompt"><span class="role user">Objective:</span><p>${objectiveText}</p></div>`;
        const thinkingHTML = `<div class="ai-response"><span class="role ai">AI:</span><p class="typing"></p></div>`;
        queryOutput.innerHTML += thinkingHTML;
        
        const thinkingElement = queryOutput.querySelector('.typing');
        typewriterEffect(thinkingElement, "Analyzing objective and generating query...");

        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: objectiveText }),
            });
            const result = await response.json();

            let finalResponseText;
            if (result.generated_sql && result.generated_sql !== 'N/A') {
                finalResponseText = `Here is a suggested query:\n<pre>${result.generated_sql}</pre>`;
            } else {
                finalResponseText = "This objective doesn't seem to require a data query. I can only assist with data-related tasks.";
            }
            thinkingElement.parentElement.innerHTML = `<span class="role ai">AI:</span><div class="typing-container"></div>`;
            typewriterEffect(thinkingElement.parentElement.querySelector('.typing-container'), finalResponseText, true);

        } catch (error) {
            thinkingElement.parentElement.innerHTML = `<span class="role ai">AI:</span><p>Error connecting to the AI service. Please check the backend.</p>`;
        }
    };
    
    const typewriterEffect = (element, text, isHtml = false) => {
        let i = 0;
        element.innerHTML = "";
        const interval = setInterval(() => {
            if (i < text.length) {
                if (isHtml) {
                    element.innerHTML = text.slice(0, i+1);
                } else {
                    element.textContent += text.charAt(i);
                }
                i++;
                queryOutput.scrollTop = queryOutput.scrollHeight;
            } else {
                clearInterval(interval);
            }
        }, 20); // Adjust typing speed here
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

    const updateObjectiveStatus = async (id, is_completed) => {
        if (id.startsWith('s')) return; // Don't try to update sample data
        await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_completed: is_completed ? 1 : 0 })
        });
        await fetchObjectives();
    };

    // --- INITIALIZATION ---
    addBtn.addEventListener('click', addObjective);
    newObjectiveInput.addEventListener('keypress', (e) => e.key === 'Enter' && addObjective());
    fetchObjectives();
});
