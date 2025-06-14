import {showGanttChart, showMetrics} from './FCFS.js'

export function runPriorityScheduling(processList, deadlockInfoElement) {
    const processes = JSON.parse(JSON.stringify(processList)); // deep clone
    let currentTime = 0;
    let ganttData = [];
    let completed = [];

    // Resolve deadlocks
    const safeProcesses = resolveDeadlocks([...processes], deadlockInfoElement);

    // Sort by arrivalTime and priority first
    safeProcesses.sort((a, b) => {
        if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
        return a.priority - b.priority;
    });

    while (safeProcesses.length > 0) {
        const available = safeProcesses.filter(p => p.arrivalTime <= currentTime);

        if (available.length === 0) {
            currentTime = safeProcesses[0].arrivalTime;
            continue;
        }

        // Select process with highest priority (lowest number)
        available.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.arrivalTime - b.arrivalTime;
        });

        const current = available[0];

        const start = currentTime;
        const end = currentTime + current.burstTime;

        ganttData.push({
            label: current.name,
            start,
            end,
        });

        completed.push({
            ...current,
            pid : current.name,
            start,
            end,
            turnaroundTime: end - current.arrivalTime,
            waitingTime: start - current.arrivalTime,
        });

        currentTime = end;

        // Remove from ready queue
        const index = safeProcesses.findIndex(p => p.id === current.id);
        safeProcesses.splice(index, 1);
    }

    showGanttChart(ganttData);
    showMetrics(completed);

    document.getElementById('setup-section').classList.add('hide-from-view');
    document.getElementById('output-section').classList.remove('hide-from-view');
    document.getElementById('output-section').classList.add('output-section')

    // Optionally scroll to output section
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
}

function resolveDeadlocks(queue, deadlockInfo) {
    let found = true;
    let deadlockMessage = '';
    while (found) {
        found = false;

        const groups = {};
        queue.forEach(p => {
            const key = `${p.arrivalTime}-${p.priority}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });

        for (const key in groups) {
            const group = groups[key];
            if (group.length > 1) {
                let conflict = false;

                for (let i = 0; i < group.length; i++) {
                    for (let j = i + 1; j < group.length; j++) {
                        if (group[i].resources.some(r => group[j].resources.includes(r))) {
                            conflict = true;
                            break;
                        }
                    }
                    if (conflict) break;
                }

                if (conflict) {
                    if(!deadlockMessage) {
                        deadlockMessage = '<strong>⚠️ Deadlock detected! Resolving using process termination.</strong>';

                    }
                    group.sort((a, b) => {
                        if (a.priority !== b.priority) return a.priority - b.priority;
                        if (a.burstTime !== b.burstTime) return b.burstTime - a.burstTime;
                        return b.name.localeCompare(a.name);
                    });

                    const toKill = group[0];
                    queue.splice(queue.findIndex(p => p.id === toKill.id), 1);
                    queue = queue.filter(p => p.id !== toKill.id);

                    deadlockMessage += `<br>🗑️ Terminated: ${toKill.name}`;
                    found = true;
                    break;
                }
            }
        }
    }
    deadlockInfo.innerHTML = deadlockMessage;
    return queue;
}

