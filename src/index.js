const os = require('os');
const axios = require('axios');
const exec = require('child_process').exec;

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

function sendSystemStats() {
	let systemStats = {
		total_memory: os.totalmem(),
		free_memory: os.freemem()
	};
	console.log('Calling log system stats');
	axios.post(`http://${serverIP}:${serverPort}/log-system-stats`, systemStats)
	.then(response => {
		console.log(response.data);
	})
	.catch(err => {
		console.log('Err: ' + err);
	});
}

function getBlockchainSize() {
	console.log('Calling log blockchain size');

	let command = 'du -s /home/metalface/.chia/mainnet/db';
    exec(command, (error, stdout, stderr) => {
		let split = stdout.split('\t');

		axios.get(`http://${serverIP}:${serverPort}/log-blockchain-size?size=${split[0]}`)
		.then(response => {
			console.log(response.data);
		})
		.catch(err => {
			console.log('Err: ' + err);
		});
	});
};

function init() {
	setInterval(sendHeartbeat, 30000);
	sendHeartbeat();

	setInterval(sendSystemStats, 5000);
	sendSystemStats();

	setInterval(getBlockchainSize, 60000);
	getBlockchainSize();
}

init();