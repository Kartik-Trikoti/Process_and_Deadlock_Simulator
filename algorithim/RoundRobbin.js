import { showGanttChart, showMetrics } from './FCFS.js';

export function runRoundRobinScheduling(processes, quantum, deadlockInfoContainer) {
    let time = 0;
    const readyQueue = [];
    const ganttChartData = [];
    const metrics = new Map();
    const terminatedProcesses = new Set();

    const remainingBurst = {};
    const resourceHeldBy = {};

    // Initialize
    processes.forEach(p => {
        remainingBurst[p.name] = p.burstTime;
        metrics.set(p.name, {
            pid: p.name,
            slices: [],
            arrivalTime: p.arrivalTime,
            burstTime: p.burstTime,
        });
    });

    function canRun(process) {
        return !process.resources.some(r => resourceHeldBy[r] && resourceHeldBy[r] !== process.name);
    }

    function addArrivals() {
        processes.forEach(p => {
            if (p.arrivalTime <= time && !readyQueue.find(q => q.name === p.name) && remainingBurst[p.name] > 0 && !terminatedProcesses.has(p.name)) {
                readyQueue.push(p);
            }
        });
    }

    function anyCanRun() {
        return readyQueue.some(p => {
            if (terminatedProcesses.has(p.name) || remainingBurst[p.name] <= 0) return false;
            return canRun(p);
        });
    }

    addArrivals();

    while (true) {
        addArrivals();

        const hasRunnable = anyCanRun();
        const hasFutureArrivals = processes.some(p =>
            p.arrivalTime > time && !terminatedProcesses.has(p.name) && remainingBurst[p.name] > 0
        );

        if (readyQueue.length === 0) {
            const unfinished = processes.some(p => remainingBurst[p.name] > 0 && !terminatedProcesses.has(p.name));
            if (!unfinished) break;
            ganttChartData.push({ label: "Idle", start: time, end: time + 1 });
            time++;
            continue;
        }

        if (!hasRunnable && !hasFutureArrivals) {
            const killed = resolveDeadlocks(readyQueue, terminatedProcesses, remainingBurst, metrics, resourceHeldBy);
            if (!killed) break;
            continue;
        }

        let progressMade = false;
        const currentCycle = [...readyQueue];
        for (const current of currentCycle) {
            if (terminatedProcesses.has(current.name) || remainingBurst[current.name] <= 0) {
                const idx = readyQueue.findIndex(p => p.name === current.name);
                if (idx !== -1) readyQueue.splice(idx, 1);
                continue;
            }

            if (!canRun(current)) continue;

            current.resources.forEach(r => {
                resourceHeldBy[r] = current.name;
            });

            const runTime = Math.min(quantum, remainingBurst[current.name]);
            ganttChartData.push({ label: current.name, start: time, end: time + runTime });
            metrics.get(current.name).slices.push({ start: time, end: time + runTime });

            time += runTime;
            remainingBurst[current.name] -= runTime;
            progressMade = true;

            if (remainingBurst[current.name] <= 0) {
                current.resources.forEach(r => {
                    if (resourceHeldBy[r] === current.name) {
                        delete resourceHeldBy[r];
                    }
                });
            }

            if (remainingBurst[current.name] <= 0) {
                const idx = readyQueue.findIndex(p => p.name === current.name);
                if (idx !== -1) readyQueue.splice(idx, 1);
            }

            addArrivals();
        }

        if (!progressMade) break;
    }

    const finalMetrics = [];
    let totalTurnaround = 0;
    let totalWaiting = 0;
    let counted = 0;

    for (const [name, m] of metrics.entries()) {
        if (terminatedProcesses.has(name)) {
            finalMetrics.push({
                pid: name,
                start: 'Terminated',
                end: 'Terminated',
                turnaroundTime: 'N/A',
                waitingTime: 'N/A',
            });
        } else if (m.slices.length > 0) {
            const start = m.slices[0].start;
            const end = m.slices[m.slices.length - 1].end;
            const turnaroundTime = end - m.arrivalTime;
            const waitingTime = turnaroundTime - m.burstTime;
            totalTurnaround += turnaroundTime;
            totalWaiting += waitingTime;
            counted++;
            finalMetrics.push({ pid: name, start, end, turnaroundTime, waitingTime });
        } else {
            finalMetrics.push({ pid: name, start: null, end: null, turnaroundTime: 0, waitingTime: 0 });
        }
    }

    showGanttChart(ganttChartData);
    showMetrics(finalMetrics);

    document.getElementById('setup-section').classList.add('hide-from-view');
    document.getElementById('output-section').classList.remove('hide-from-view');
    document.getElementById('output-section').classList.add('output-section');
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });

    deadlockInfoContainer.innerHTML = terminatedProcesses.size > 0
        ? `<strong>⚠️ Deadlock detected and resolved by terminating processes:</strong><br>` + Array.from(terminatedProcesses).map(p => `🗑️ <strong>${p}</strong>`).join('<br>')
        : 'No deadlocks detected.';
}

function resolveDeadlocks(readyQueue, terminatedProcesses, remainingBurst, metrics, resourceHeldBy) {
    if (readyQueue.length === 0) return false;

    readyQueue.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.burstTime !== b.burstTime) return b.burstTime - a.burstTime;
        return a.name.localeCompare(b.name);
    });

    const toKill = readyQueue.shift();
    terminatedProcesses.add(toKill.name);
    remainingBurst[toKill.name] = 0;
    if (metrics.has(toKill.name)) {
        metrics.get(toKill.name).slices = [];
    }

    for (const r in resourceHeldBy) {
        if (resourceHeldBy[r] === toKill.name) {
            delete resourceHeldBy[r];
        }
    }

    return true;
}
