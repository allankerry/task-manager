const express = require('express');   // load Express
const fs = require('fs');             // built-in: read and write files
const path = require('path');         // built-in: build file paths safely

const app = express();                // create the server
const DATA_FILE = path.join(__dirname, 'tasks.json');   // where tasks are saved

app.use(express.json());              // lets the server read JSON sent by the page
app.use(express.static(path.join(__dirname, 'public')));   // serve the web page

// read all tasks from the file (empty list if the file doesn't exist yet)
function readTasks() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// save the tasks list back to the file
function saveTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

// READ: send all tasks
app.get('/api/tasks', (req, res) => {
  res.json(readTasks());
});

// CREATE: add a new task
app.post('/api/tasks', (req, res) => {
  const title = (req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const tasks = readTasks();

  const task = { id: Date.now(), title, done: false };   // id = current time in ms
  tasks.push(task);
  saveTasks(tasks);
  res.status(201).json(task);
});

// UPDATE: change a task's title or done status
app.patch('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const task = tasks.find((t) => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (typeof req.body.done === 'boolean') task.done = req.body.done;
  if (typeof req.body.title === 'string' && req.body.title.trim()) {
    task.title = req.body.title.trim();
  }
  saveTasks(tasks);
  res.json(task);
});

// DELETE: remove a task
app.delete('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const remaining = tasks.filter((t) => t.id !== Number(req.params.id));
  if (remaining.length === tasks.length) {
    return res.status(404).json({ error: 'Task not found' });
  }
  saveTasks(remaining);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;   // hosts pick the port, your PC uses 3000

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});