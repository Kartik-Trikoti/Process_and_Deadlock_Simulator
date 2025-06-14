import {showGanttChart, showMetrics} from './FCFS.js'

export function runSJFScheduling(processes, deadlockInfo) {
  let readyQueue = [...processes];

  // Apply deadlock resolution
  readyQueue = resolveDeadlocksSJF(readyQueue, deadlockInfo);

  const timeline = [];
  const chartData = [];
  const metrics = [];
  let time = 0;

  while (readyQueue.length > 0) {
    const available = readyQueue.filter(p => p.arrivalTime <= time);
    
    if (available.length === 0) {
      time = readyQueue[0].arrivalTime;
      continue;
    }

    // Select process with the shortest burst
    available.sort((a, b) => {
      if (a.burstTime !== b.burstTime) return a.burstTime - b.burstTime;
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.name.localeCompare(b.name);
    });

    const current = available[0];
    const index = readyQueue.findIndex(p => p.id === current.id);
    readyQueue.splice(index, 1);

    const start = time;
    time += current.burstTime;
    const end = time;

    chartData.push({ label: current.name, start, end });
    metrics.push({
      pid: current.name,
      start,
      end,
      turnaroundTime: end - current.arrivalTime,
      waitingTime: start - current.arrivalTime
    });
  }

  showGanttChart(chartData);
  showMetrics(metrics);

  document.getElementById('setup-section').classList.add('hide-from-view');
    document.getElementById('output-section').classList.remove('hide-from-view');
    document.getElementById('output-section').classList.add('output-section')
  document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
}


export function resolveDeadlocksSJF(queue, deadlockInfo) {
  let deadlockFound = true;
  let deadlockMessage = "";

  while (deadlockFound) {
    deadlockFound = false;

    // Simulate available resource set
    const availableResources = new Set();
    const blocked = [];

    // Track which processes can run
    for (const process of queue) {
      const isBlocked = queue.some(
        other =>
          other.id !== process.id &&
          other.resources.some(r => process.resources.includes(r))
      );

      if (isBlocked) {
        blocked.push(process);
      } else {
        // Pretend this process runs and releases resources
        process.resources.forEach(res => availableResources.add(res));
      }
    }

    // If all are blocked and none could proceed => real deadlock
    if (blocked.length === queue.length) {
      deadlockFound = true;
      if (!deadlockMessage)
            deadlockMessage = '<strong>⚠️ Deadlock detected!</strong> Resolved using Process Termination.';

    //   deadlockInfo.innerHTML = '<strong>⚠️ Deadlock detected!</strong> Resolved using Process Termination.';

      // Sort blocked by:
      // 1. Highest burst time
      // 2. Lowest priority
      // 3. More resources used
      // 4. Name fallback
      blocked.sort((a, b) => {
        if (a.burstTime !== b.burstTime) return b.burstTime - a.burstTime; // remove longest first
        if (a.priority !== b.priority) return b.priority - a.priority;
        if (a.resources.length !== b.resources.length) return b.resources.length - a.resources.length;
        return b.name.localeCompare(a.name);
      });

      const toKill = blocked[0];

      const index = queue.findIndex(p => p.id === toKill.id);
      if (index !== -1) queue.splice(index, 1);

      // Also remove from global list
      if (typeof processes !== 'undefined') {
        processes = processes.filter(p => p.id !== toKill.id);
      }

      deadlockMessage += `<br>🗑️ Terminated Process: <strong>${toKill.name}</strong>`;
    }
  }
deadlockInfo.innerHTML = deadlockMessage;
  return queue;
}
