const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 8000;
const DATA_FILE = path.join(__dirname, 'submissions.json');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'bradpartners-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname)));

function readSubmissions() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf8') || '[]';
  return JSON.parse(raw);
}

function writeSubmissions(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

app.post('/api/submit', (req, res) => {
  const data = req.body;
  if (!data || !data.email) {
    return res.status(400).json({ ok: false, error: 'Missing email' });
  }
  const submissions = readSubmissions();
  const exists = submissions.find(s => s.email.toLowerCase() === data.email.toLowerCase());
  if (exists) {
    return res.status(409).json({ ok: false, error: 'duplicate' });
  }
  const entry = {
    ...data,
    timestamp: new Date().toISOString()
  };
  submissions.push(entry);
  writeSubmissions(submissions);
  res.json({ ok: true });
});

app.post('/api/fit-assessment', async (req, res) => {
  const data = req.body;
  if (!data || !data.email) {
    return res.status(400).json({ ok: false, error: 'Missing email' });
  }

  const submissions = readSubmissions();
  const entry = {
    type: 'fit_assessment',
    name: data.name || '',
    email: data.email,
    lead_volume: data.lead_volume || '',
    follow_up_system: data.follow_up_system || '',
    standardization: data.standardization || '',
    status: data.status || 'Nurture',
    timestamp: new Date().toISOString()
  };

  submissions.push(entry);
  writeSubmissions(submissions);

  const webhookUrl = process.env.FIT_ASSESSMENT_WEBHOOK_URL;
  if (webhookUrl && typeof fetch === 'function') {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (e) {
      // ignore webhook failures
    }
  }

  res.json({ ok: true });
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === 'bradpartners2026') {
    req.session.authenticated = true;
    return res.redirect('/admin');
  }
  res.redirect('/admin/login?error=1');
});

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  return res.redirect('/admin/login');
}

app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/api/submissions', requireAuth, (req, res) => {
  const submissions = readSubmissions();
  submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json({ ok: true, submissions });
});

app.post('/api/submissions/delete', requireAuth, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ ok: false, error: 'Missing email' });
  
  let submissions = readSubmissions();
  const initialLength = submissions.length;
  submissions = submissions.filter(s => s.email.toLowerCase() !== email.toLowerCase());
  
  if (submissions.length === initialLength) {
    return res.status(404).json({ ok: false, error: 'Not found' });
  }
  
  writeSubmissions(submissions);
  res.json({ ok: true });
});

app.post('/api/submissions/toggle-done', requireAuth, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ ok: false, error: 'Missing email' });
  
  const submissions = readSubmissions();
  const index = submissions.findIndex(s => s.email.toLowerCase() === email.toLowerCase());
  
  if (index === -1) {
    return res.status(404).json({ ok: false, error: 'Not found' });
  }
  
  submissions[index].done = !submissions[index].done;
  writeSubmissions(submissions);
  res.json({ ok: true, done: submissions[index].done });
});

app.post('/api/submissions/truncate', requireAuth, (req, res) => {
  writeSubmissions([]);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
