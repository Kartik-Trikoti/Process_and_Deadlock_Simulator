import { runFCFSScheduling } from './algorithim/FCFS.js';
import { runSJFScheduling } from './algorithim/SJF.js'
import { runPriorityScheduling } from './algorithim/PriorityQueeue.js'
import {runRoundRobinScheduling} from './algorithim/RoundRobbin.js'

const modal = document.getElementById('process-modal');
const openModalBtn = document.getElementById('open-process-modal');
const closeModalBtn = document.getElementById('close-modal');
const processForm = document.getElementById('process-form');
const processTableBody = document.getElementById('process-table-body');
const submitButton = processForm.querySelector('button[type="submit"]');
const deadlockInfo = document.getElementById('deadlock-info');

let processes = [];
let editingProcessId = null;  // track if editing

openModalBtn.addEventListener('click', () => {
    editingProcessId = null; // Clear edit mode
    submitButton.textContent = 'Add';
    openModal();
});

closeModalBtn.addEventListener('click', closeModal);

processForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addOrEditProcess();

});

function openModal() {
    resetModal();
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
}

function resetModal() {
    document.getElementById('pid').value = '';
    document.getElementById('arrivalTime').value = '';
    document.getElementById('burstTime').value = '';
    document.getElementById('priority').value = '';

    const resourceCheckboxes = document.querySelectorAll('input[name="resources"]');
    resourceCheckboxes.forEach(cb => cb.checked = false);
    document.querySelector('.tag').textContent = 'Add'

}

function addOrEditProcess() {
    const name = document.getElementById('pid').value.trim();
    const arrivalTime = Number(document.getElementById('arrivalTime').value);
    const burstTime = Number(document.getElementById('burstTime').value);
    const priority = Number(document.getElementById('priority').value);

    const selectedResources = [];
    document.querySelectorAll('input[name="resources"]:checked').forEach(cb => {
        selectedResources.push(cb.value);
    });

    if (!name) {
        alert('Please enter process ID');
        return;
    }
    if (isNaN(arrivalTime) || arrivalTime < 0) {
        alert('Enter a valid arrival time (>= 0)');
        return;
    }
    if (isNaN(burstTime) || burstTime <= 0) {
        alert('Enter a valid CPU burst time (> 0)');
        return;
    }
    if (isNaN(priority) || priority < 0) {
        alert('Enter a valid priority (>= 0)');
        return;
    }

    if (editingProcessId !== null) {
        // EDIT mode: update the existing process
        const index = processes.findIndex(p => p.id === editingProcessId);
        if (index !== -1) {
            processes[index] = {
                id: editingProcessId,
                name,
                arrivalTime,
                burstTime,
                priority,
                resources: selectedResources,
            };
        }
    } else {
        // ADD mode: create new process
        const process = {
            id: Date.now(),
            name,
            arrivalTime,
            burstTime,
            priority,
            resources: selectedResources,
        };
        processes.push(process);
    }

    updateProcessTable();
    closeModal();
}

// Update process table UI with Edit and Delete buttons
function updateProcessTable() {
    processTableBody.innerHTML = '';

    processes.forEach(proc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${proc.name}</td>           <!-- PID -->
      <td>${proc.burstTime}</td>      <!-- Burst Time -->
      <td>${proc.arrivalTime}</td>    <!-- Arrival Time -->
      <td>${proc.priority}</td>       <!-- Priority -->
      <td>${proc.resources.join(', ')}</td> <!-- Resources -->
      <td>                           <!-- Options -->
        <button class="edit-btn" data-id="${proc.id}">Edit</button>
        <button class="delete-btn" data-id="${proc.id}">Delete</button>
      </td>
    `;
        processTableBody.appendChild(tr);
    });

    // Attach event listeners for Edit and Delete buttons (as before)
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = Number(e.target.getAttribute('data-id'));
            // console.log(id)
            openEditModal(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = Number(e.target.getAttribute('data-id'));
            deleteProcess(id);
        });
    });
}

// Open modal in edit mode, populate fields
function openEditModal(id) {
    const process = processes.find(p => p.id === id);
    if (!process) return;

    editingProcessId = id;
    document.querySelector('.tag').textContent = 'Edit'
    submitButton.textContent = 'Save';
    console.log(process)

    document.getElementById('pid').value = process.name;
    document.getElementById('arrivalTime').value = process.arrivalTime;
    document.getElementById('burstTime').value = process.burstTime;
    document.getElementById('priority').value = process.priority;

    const resourceCheckboxes = document.querySelectorAll('input[name="resources"]');
    resourceCheckboxes.forEach(cb => {
        cb.checked = process.resources.includes(cb.value);
    });

    // openModal();
    modal.classList.remove('hidden');
    //  document.getElementById('submitProcessBtn').textContent = 'Save Changes';
}

// Delete a process by id
function deleteProcess(id) {
    const confirmed = confirm('Are you sure you want to delete this process?');
    if (!confirmed) return;

    const index = processes.findIndex(p => p.id === id);
    if (index !== -1) {
        processes.splice(index, 1);
        updateProcessTable();
    }
}


// Add this to the bottom of your script.js file

// Load Chart.js dynamically (if not already loaded)
const chartScript = document.createElement('script');
chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
document.head.appendChild(chartScript);

chartScript.onload = () => {
    console.log('Chart.js loaded');
};

const quantumModal = document.getElementById('quantum-modal');
const openQuantumInput = document.getElementById('start-simulation');
const closeQuantumModal = document.getElementById('close-quantum-modal');
const quantumForm = document.getElementById('quantum-form');
const quantumInput = document.getElementById('quantum-input');

closeQuantumModal.addEventListener('click', () => {
    quantumModal.classList.add('hidden');
});

quantumForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const quantum = parseInt(quantumInput.value);
    if (isNaN(quantum) || quantum <= 0) {
        alert("Please enter a valid positive quantum.");
        return;
    }

    quantumModal.classList.add('hidden'); // Hide modal
    runRoundRobinScheduling(processes, quantum, deadlockInfo); // Run RR
});


function runSelectedScheduling() {
    const selectedAlgorithm = document.getElementById('algorithm').value.toLowerCase();
    deadlockInfo.innerHTML = ''; // Clear previous messages

    if (selectedAlgorithm === 'fcfs') {
        runFCFSScheduling(processes, deadlockInfo);
    } else if (selectedAlgorithm === 'sjf') {
        runSJFScheduling(processes, deadlockInfo);
    } else if (selectedAlgorithm === 'priority') { 
        runPriorityScheduling(processes, deadlockInfo); 
    } else if(selectedAlgorithm == 'roundrobin') {
        quantumModal.classList.remove('hidden');
    } 
    else {
        alert('Selected algorithm not implemented yet.');
    }
}


// Add this at the bottom of your script, outside chartScript.onload
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-simulation');
    if (startBtn) {
        startBtn.addEventListener('click', runSelectedScheduling);
        console.log('Attached click listener to start button');
    } else {
        console.error('Start button not found on DOMContentLoaded');
    }
});



// Back to Setup

document.getElementById('back-to-setup').addEventListener('click', () => {
    document.getElementById('output-section').classList.add('hide-from-view');
    document.getElementById('output-section').classList.remove('output-section');
    document.getElementById('setup-section').classList.remove('hide-from-view');
});
