var _u=atob("aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4WWI5TVlDOHl5U3VUNjRlY1V0QmN6TVdBVEpUR2s1ZUlYcmVLaE0wOU1LNFp6TUpPaHh5MVlRMW4tZVE3Rk41ODAvZXhlYw==");
async function loadData(){var r=await fetch(_u);return await r.json();}
async function postToApi(p){var r=await fetch(_u,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(p)});return await r.json();}
