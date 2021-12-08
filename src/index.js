const { Wallet } = require('chia-javascript');

const os = require('os');
const axios = require('axios');

const serverIP = '192.168.0.199';
const serverPort = '8081';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

let wallet = new Wallet();

async function getWallets() {
	let walletResponse = await wallet.getWallets();

	if (walletResponse === null || typeof walletResponse !== 'object') {
		console.log('Get wallets invalid reponse format');
		return [];
	}

	if (!walletResponse.success) {
		console.log('Get wallets response success false');
		return [];
	}

	if (!walletResponse.wallets === null || typeof walletResponse.wallets !== 'object') {
		console.log('Get wallets response has no wallets key');
		return [];
	}

	let walletBalances = [];
	for (let i = 0; i < walletResponse.wallets.length; i++) {
		let balanceInfo = await wallet.getWalletBalance(walletResponse.wallets[i].id);
		walletBalances.push(balanceInfo.wallet_balance);
	}

	console.log("Sending wallet info");
	axios.post(`http://${serverIP}:${serverPort}/log_wallet_info`, { wallets: walletBalances })
	.then(response => {
		console.log(response.data);
	})
	.catch(err => {
		console.log('Err: ' + err);
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

async function init() {
	const FIVE_SECONDS = 30000;
	const FIVE_MINUTES = 300000;
	const THIRTY_MINUTES = FIVE_MINUTES * 6;
	
	setInterval(sendHeartbeat, FIVE_SECONDS);
	sendHeartbeat();

	setInterval(sendSystemStats, FIVE_MINUTES);
	sendSystemStats();

	setInterval(getWallets, THIRTY_MINUTES);
	getWallets();
}

init();