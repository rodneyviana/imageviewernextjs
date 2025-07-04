// Run with: node loadtest.js
const autocannon = require('autocannon');

const url = 'http://localhost:3000/api/children?folder=%2Fsrv%2Fgenerated%2F&offset=0&limit=100';

autocannon({
  url,
  connections: 10, // concurrent connections
  duration: 20,    // test duration in seconds
  pipelining: 1,
  headers: {
    'Accept': 'application/json'
  }
}, (err, result) => {
  if (err) throw err;
  console.log(autocannon.printResult(result));
});
