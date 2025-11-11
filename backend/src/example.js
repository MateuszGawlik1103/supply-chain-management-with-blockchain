import * as grpc from '@grpc/grpc-js';
import crypto from 'crypto';
import fabricGateway from '@hyperledger/fabric-gateway';
const { connect, hash, signers } = fabricGateway;
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const channelName = 'mychannel';
const chaincodeName = 'coffee';
const mspId = 'Org1MSP';

const certPath = process.env.CERT_PATH || '/run/secrets/cert.pem';
const keyPath = '/run/secrets/key.pem';
const tlsCertPath = process.env.TLS_CERT_PATH || '/run/secrets/ca.crt';

const peerEndpoint = process.env.PEER_ENDPOINT || 'peer0.org1.example.com:7051';

function prettyJSONString(inputString) {
	try {
		return JSON.stringify(JSON.parse(inputString), null, 2);
	} catch (e) {
		return inputString;
	}
}

async function main(orderId, batchId) {
	try {
		console.log('Loading certificates and keys...');

		// Private key
		const privateKeyPem = fs.readFileSync(keyPath, 'utf8');
		const privateKeyObject = crypto.createPrivateKey(privateKeyPem);
		const signer = signers.newPrivateKeySigner(privateKeyObject);

		// Public certificate
		const certPem = fs.readFileSync(certPath, 'utf8');

		// TLS certificate
		const tlsRootCert = fs.readFileSync(tlsCertPath);
		const credentials = grpc.credentials.createSsl(tlsRootCert);

		const client = new grpc.Client(peerEndpoint, credentials);

		console.log('Connecting to Fabric Gateway...');
		const gateway = connect({
			client,
			identity: { mspId, credentials: Buffer.from(certPem) },
			signer,
			hash: hash.sha256,
			evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
			endorseOptions: () => ({ deadline: Date.now() + 15000 }),
			submitOptions: () => ({ deadline: Date.now() + 15000 }),
			commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
		});

		try {
			console.log('Getting network and contract...');
			const network = gateway.getNetwork(channelName);
			const contract = network.getContract(chaincodeName);

			console.log('Connected to the Fabric Gateway');

			console.log('Invoking placeOrder...');
			await contract.submitTransaction('placeOrder', orderId, 'Arabica', '100', 'ORG3', '2025-11-10');
			console.log('Order placed successfully');

			console.log('Invoking createBatch...');
			await contract.submitTransaction('createBatch', batchId, orderId, '100', 'ORG1');
			console.log('Batch created successfully');

			console.log('Invoking shipBatch...');
			await contract.submitTransaction('shipBatch', batchId, 'ORG2');
			console.log('Batch shipped successfully');

			console.log('🌡️ Updating temperature and humidity...');
			await contract.submitTransaction('updateTemperatureAndHumidity', batchId, '30', '10');
			await new Promise((r) => setTimeout(r, 3000));
			await contract.submitTransaction('updateTemperatureAndHumidity', batchId, '32', '12');
			console.log('Temperature updates committed');

			console.log('Delivering batch...');
			await contract.submitTransaction('deliverBatch', batchId, 'ORG3');
			console.log('Batch delivered successfully');

			console.log('Fetching order history...');
			const resultOrderBytes  = await contract.evaluateTransaction('getOrderHistory', orderId);
			const resultOrderString = Buffer.from(resultOrderBytes).toString('utf8');
			console.log(prettyJSONString(resultOrderString));

			console.log('Fetching batch history...');
			const resultBatchBytes = await contract.evaluateTransaction('getBatchHistory', batchId);
			const resultBatchString = Buffer.from(resultBatchBytes).toString('utf8');
			console.log(prettyJSONString(resultBatchString));

			console.log('All operations completed successfully');
		} finally {
			gateway.close();
			client.close();
		}

	} catch (error) {
		console.error(`Failed to run the application: ${error.message}`);
		console.error(error);
		process.exit(1);
	}
}

let number = 25;
main(`ORDER${number}`, `O${number}_batch1`);
