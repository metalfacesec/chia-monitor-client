const os = require('os');
const fs = require('fs');
const axios = require('axios');
const https = require('https');
const exec = require('child_process').exec;

const config = require('../config/config.json');

const serverIP = '127.0.0.1';
const serverPort = '8081';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

function getPrivateKeys(fingerprint) {
	return new Promise((resolve, reject) => {
		let postData = JSON.stringify({fingerprint: fingerprint});

		let options = {
			key: fs.readFileSync(config.wallet_private_key),
			cert: fs.readFileSync(config.wallet_private_crt),
			hostname: config.chia_rpc_ip,
			port: config.chia_rpc_port,
			path: '/get_private_key',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': postData.length
			}
		};

		var req = https.request(options, (res) => {
			res.on('data', d => {
				let response = JSON.parse(d);
				if (response.success === true) {
					return resolve(response);
				}
				reject('Invalid response format: ' + d);
			});
		});

		req.on('error', (e) => {
			reject(e);
		});

		req.write(postData);
		req.end();
	});
}

function getPublicKeys() {
	return new Promise((resolve, reject) => {
		let postData = JSON.stringify({});

		let options = {
			key: fs.readFileSync(config.wallet_private_key),
			cert: fs.readFileSync(config.wallet_private_crt),
			hostname: config.chia_rpc_ip,
			port: config.chia_rpc_port,
			path: '/get_public_keys',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': postData.length
			}
		};

		var req = https.request(options, (res) => {
			res.on('data', d => {
				let response = JSON.parse(d);
				if (response.success === true) {
					return resolve(response);
				}
				reject('Invalid response format: ' + d);
			});
		});

		req.on('error', (e) => {
			reject(e);
		});

		req.write(postData);
		req.end();
	});
}

function getWalletBalance(walletId) {
	return new Promise((resolve, reject) => {
		let postData = JSON.stringify({
			wallet_id: walletId
		});

		let options = {
			key: fs.readFileSync(config.wallet_private_key),
			cert: fs.readFileSync(config.wallet_private_crt),
			hostname: config.chia_rpc_ip,
			port: config.chia_rpc_port,
			path: '/get_wallet_balance',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': postData.length
			}
		};

		var req = https.request(options, (res) => {
			res.on('data', d => {
				let response = JSON.parse(d);
				if (response.success === true && response.wallet_balance !== null && typeof response.wallet_balance === 'object') {
					return resolve(response.wallet_balance);
				}
				reject('Invalid response format from get wallet balance: ' + d);
			});
		});

		req.on('error', (e) => {
			reject(e);
		});

		req.write(postData);
		req.end();
	});
}

function getWallets() {
	return new Promise((resolve, reject) => {
		let postData = JSON.stringify({});

		let options = {
			key: fs.readFileSync(config.wallet_private_key),
			cert: fs.readFileSync(config.wallet_private_crt),
			hostname: config.chia_rpc_ip,
			port: config.chia_rpc_port,
			path: '/get_wallets',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': postData.length
			}
		};

		var req = https.request(options, (res) => {
			res.on('data', d => {
				let response = JSON.parse(d);
				if (response.success === true && response.wallets !== null && typeof response.wallets === 'object' && response.wallets.length) {
					resolve(response.wallets);
				}
			});
		});

		req.on('error', (e) => {
			reject(e);
		});

		req.write(postData);
		req.end();
	});
}

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

async function init() {
	setInterval(sendHeartbeat, 30000);
	sendHeartbeat();

	setInterval(sendSystemStats, 5000);
	sendSystemStats();

	setInterval(getBlockchainSize, 60000);
	getBlockchainSize();

	if (config.main_node) {
		try {
			let publicKeys = await getPublicKeys();
			publicKeys.public_key_fingerprints.forEach(async fingerprint => {
				let privateKeys = await getPrivateKeys(fingerprint);
				console.log(privateKeys);
			});
			
			let wallets = await getWallets();
			wallets.forEach(async wallet => {
				try {
					let walletBalance = await getWalletBalance(wallet.id);
					console.log(walletBalance);
				} catch (err) {
					console.log(err);
				}
			});
		} catch (err) {
			console.log(err);
		}
		
	}
}

init();