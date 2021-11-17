const axios = require('axios');

const serverIP = '127.0.0.1';
const serverPort = '8081';

function sendHeartbeat() {
	console.log("Calling hearbeat");
	axios.post(`http://${serverIP}:${serverPort}/log-heartbeat`)
	.then(response => {
		console.log(response.data);
	})
	.catch(err => {
		console.log('Err: ' + err);
	});
}

setInterval(sendHeartbeat, 5000)