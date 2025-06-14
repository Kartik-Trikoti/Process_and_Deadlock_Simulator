# Process and Deadlock Simulator

This project is a simple yet effective simulator for process scheduling and deadlock handling. It allows users to input key details for each process—such as **Process ID (PID), Burst Time, Arrival Time, Priority, and Required Resources**.

Once the input is provided, you can choose a scheduling algorithm (e.g., **FCFS, SJF, Priority, or Round Robin**). The simulator will then:

- ✅ **Schedule** the processes based on the selected algorithm  
- ⚠️ **Detect** any deadlocks that may occur during execution  
- 🛠️ **Resolve** deadlocks by terminating one of the involved processes

Each scheduling algorithm has its own custom deadlock resolution logic, which decides which process to terminate based on conditions such as burst time, arrival time, or priority.

---

## 🔧 Features

- 📋 Multiple scheduling algorithms (FCFS, SJF, Priority, Round Robin)
- 📊 Visual Gantt Chart for process execution
- 🔍 Real-time deadlock detection and resolution
- 🧩 Simple and interactive user interface

---

## 🚀 Getting Started

This project is built using **Vanilla JavaScript**, **HTML**, and **CSS**, and runs entirely in the browser. Just open the `index.html` file locally, or try the hosted version below.

---

## 🔗 Live Demo

👉 [Click here to try it on GitHub Pages](https://your-username.github.io/process-deadlock-simulator)

> ⚠️ *Replace the above link with the actual one once your project is hosted.*
