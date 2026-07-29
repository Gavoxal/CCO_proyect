const fs = require('fs');

fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'tutor@cco.org', password: '123' })
}).then(res => res.json()).then(console.log).catch(console.error);
