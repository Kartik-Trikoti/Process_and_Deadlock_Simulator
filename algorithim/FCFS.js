export function runFCFSScheduling(processes, deadlockInfo) {
    let readyQueue = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    const timeline = [];
    console.log("Got in")
    readyQueue = resolveDeadlocks(readyQueue, deadlockInfo);

    let time = 0;
    const chartData = [];
    const metrics = [];

    for (const p of readyQueue) {
        if (time < p.arrivalTime) time = p.arrivalTime;
        const start = time;
        time += p.burstTime;
        const end = time;

        chartData.push({ label: p.name, start, end });
        metrics.push({
            pid: p.name,       // Note: you used 'pid' or 'name'? You should be consistent.
            start,
            end,
            turnaroundTime: end - p.arrivalTime,
            waitingTime: start - p.arrivalTime
        });
    }

    showGanttChart(chartData);
    showMetrics(metrics);
    // After generating chart and metrics, switch UI view:
    document.getElementById('setup-section').classList.add('hide-from-view');
    document.getElementById('output-section').classList.remove('hide-from-view');
    document.getElementById('output-section').classList.add('output-section')

    // Optionally scroll to output section
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
    console.log("Function End")
}

export function resolveDeadlocks(readyQueue,deadlockInfo) {
  let deadlockFound = true;
   let deadlockMessage = ""; // Store all messages here


  while (deadlockFound) {
    deadlockFound = false;

    // Group by arrival time
    const groups = {};
    readyQueue.forEach(process => {
      if (!groups[process.arrivalTime]) groups[process.arrivalTime] = [];
      groups[process.arrivalTime].push(process);
    });

    for (const arrivalTime in groups) {
      const group = groups[arrivalTime];

      // Only consider if more than 1 process arrived at the same time
      if (group.length > 1) {
        // Check if any share resources
        let hasConflict = false;
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            if (
              group[i].resources.some(resource => group[j].resources.includes(resource))
            ) {
              hasConflict = true;
              break;
            }
          }
          if (hasConflict) break;
        }

        if (hasConflict) {
          if (!deadlockMessage)
            deadlockMessage = '<strong>⚠️ Deadlock detected!</strong> Resolved using Process Termination.';

          group.sort((a, b) => {
            // 1. Priority: higher priority number is less important (lower priority)
            if (a.priority !== b.priority) return b.priority - a.priority;

            // 2. Burst time: longer burst time is worse (so descending)
            if (a.burstTime !== b.burstTime) return b.burstTime - a.burstTime;

            // 3. Number of resources held: more resources is worse (descending)
            if (a.resources.length !== b.resources.length) return b.resources.length - a.resources.length;

            // 4. Name fallback (alphabetical descending so that 'Z' is removed before 'A')
            return b.name.localeCompare(a.name);
          });

          const toKill = group[0]; // least worthy

          // Remove from readyQueue
          const index = readyQueue.findIndex(p => p.id === toKill.id);
          if (index !== -1) readyQueue.splice(index, 1);

          // Remove from global process list
          processes = processes.filter(p => p.id !== toKill.id);

          console.log(`Deadlock resolved by terminating process: ${toKill.name}`);
          deadlockMessage += `<br>🗑️ Terminated Process: <strong>${toKill.name}</strong>`;

          deadlockFound = true;
          break; // restart loop after removing a process
        }
      }
    }
  }
  deadlockInfo.innerHTML = deadlockMessage;

  return readyQueue;
}



let ganttChart = null; // global chart instance

export function showGanttChart(schedule) {
    const ctx = document.getElementById('gantt-canvas').getContext('2d');

    if (ganttChart) {
        ganttChart.destroy();
    }

    const data = {
        labels: ['Gantt Chart'],
        datasets: schedule.map((proc, i) => ({
            label: proc.label, // or proc.name if renamed
            data: [{ x: [proc.start, proc.end], y: 'Gantt Chart' }],
            backgroundColor: `hsl(${(i * 70) % 360}, 70%, 60%)`,
            borderColor: 'black',
            borderWidth: 1
        }))
    };

    ganttChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            indexAxis: 'y',
            scales: {
                x: { min: 0, title: { display: true, text: 'Time' } },
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const { x } = ctx.raw;
                            return `${ctx.dataset.label}: ${x[0]} → ${x[1]}`;
                        }
                    }
                }
            },
            responsive: true
        }
    });
}


export function showMetrics(schedule) {
    const container = document.getElementById('metrics-table');

    let totalTAT = 0, totalWT = 0;

    schedule.forEach(proc => {
      if (typeof proc.turnaroundTime == "number") {
        totalTAT += proc.turnaroundTime;
      }
      if (typeof proc.waitingTime == "number") {
        totalWT += proc.waitingTime;
        
      }
    });

    const avgTAT = (totalTAT / schedule.length).toFixed(2);
    const avgWT = (totalWT / schedule.length).toFixed(2);

    let html = `<table><thead><tr><th>PID</th><th>Start</th><th>End</th><th>Turnaround Time</th><th>Waiting Time</th></tr></thead><tbody>`;

    schedule.forEach(proc => {
        html += `<tr><td>${proc.pid}</td><td>${proc.start}</td><td>${proc.end}</td><td>${proc.turnaroundTime}</td><td>${proc.waitingTime}</td></tr>`;
    });

    html += `</tbody></table>`;
    html += `<p><strong>Average Turnaround Time:</strong> ${avgTAT}</p>`;
    html += `<p><strong>Average Waiting Time:</strong> ${avgWT}</p>`;

    container.innerHTML = html;
}


// function detectDeadlock(queue) {
//     const resourceMap = {};
//     const pidResourceMap = {};

//     for (const p of queue) {
//         pidResourceMap[p.name] = p.resources;

//         p.resources.forEach(r => {
//             if (!resourceMap[r]) resourceMap[r] = [];
//             resourceMap[r].push(p.name);
//         });
//     }

//     const deadlockedPIDs = new Set();

//     Object.values(resourceMap).forEach(pids => {
//         if (pids.length > 1) {
//             pids.forEach(pid => deadlockedPIDs.add(pid));
//         }
//     });

//     return [...deadlockedPIDs]; // returns array of pids involved in deadlock
// }


// function showDeadlockInfo(deadlocked) {
//     const container = document.getElementById('deadlock-info');
//     if (deadlocked) {
//         container.innerHTML = `
//       <div class="alert">
//         <p>⚠️ <strong>Deadlock detected!</strong></p>
//         <button onclick="resolveDeadlock()">Resolve Automatically</button>
//       </div>
//     `;
//     } else {
//         container.innerHTML = '<p>✅ No deadlock detected.</p>';
//     }
// }

// function resolveDeadlock() {
//     alert("Deadlock resolved using preemption simulation.");
//     document.getElementById('deadlock-info').innerHTML = '<p>✅ Deadlock resolved.</p>';
// }
