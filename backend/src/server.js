import express from 'express';
import * as grpc from '@grpc/grpc-js';
import crypto from 'crypto';
import { connect, hash, signers } from '@hyperledger/fabric-gateway';
import fs from 'fs';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db.js';
import cors from 'cors';

dotenv.config();


// === Configuration ===
const channelName = 'mychannel';
const chaincodeName = 'coffee';
const mspId = 'Org1MSP';
const userId = process.env.APP_USER;
const certificatesPath = process.env.CERTS_PATH;
const certPath = `${certificatesPath}/${userId}-cert.pem`;
const tlsCertPath = `${certificatesPath}/${userId}-ca.pem`;
const keyPath = process.env.KEY_PATH;
const peerEndpoint = process.env.PEER_ENDPOINT || 'peer0.org1.example.com:7051';
const JWT_SECRET = process.env.JWT_SECRET;

console.log(userId)
console.log(certificatesPath)

function prettyJSONString(inputString) {
	try {
		return JSON.stringify(JSON.parse(inputString), null, 2);
	} catch (e) {
		return inputString;
	}
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}


// === Connect to Fabric Gateway once ===
async function connectGateway() {
	console.log('Connecting to Fabric Gateway...');

	const privateKeyPem = fs.readFileSync(keyPath, 'utf8');
	const privateKeyObject = crypto.createPrivateKey(privateKeyPem);
	const signer = signers.newPrivateKeySigner(privateKeyObject);

	const certPem = fs.readFileSync(certPath, 'utf8');
	const tlsRootCert = fs.readFileSync(tlsCertPath);
	const credentials = grpc.credentials.createSsl(tlsRootCert);
	const client = new grpc.Client(peerEndpoint, credentials);

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

	const network = gateway.getNetwork(channelName);
	const contract = network.getContract(chaincodeName);

	return { gateway, client, contract };
}

// === Express app setup ===
const app = express();
app.use(express.json());

// Allow requests from localhost:3000
app.use(cors({
  origin: 'http://frontend:80', // frontend dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Create a connection when the server starts
let fabricConnection;

(async () => {
	fabricConnection = await connectGateway();
	console.log('Fabric connection ready.');
})();

// === Routes ===

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashed]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
  const user = result.rows[0];
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Logout route
app.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Successfully logged out' });
});



// Query order history
app.get('/order/:id/history', async (req, res) => {
	const { id } = req.params;
	try {
		const resultBytes = await fabricConnection.contract.evaluateTransaction('getOrderHistory', id);
		const resultString = Buffer.from(resultBytes).toString('utf8');
		res.json(JSON.parse(resultString));
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
});

app.get('/order/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const resultBytes = await fabricConnection.contract.evaluateTransaction('queryOrder', id);
    const resultString = Buffer.from(resultBytes).toString('utf8');
    res.json(JSON.parse(resultString));
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: err.message });
  }
});

app.get('/batch/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const resultBytes = await fabricConnection.contract.evaluateTransaction('queryBatch', id);

    // Zamiana bajtów na string i parsowanie do JSON
    const resultString = Buffer.from(resultBytes).toString('utf8');
    const batchData = JSON.parse(resultString);

    res.json(batchData);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: err.message || 'Batch not found' });
  }
});

// Query batch history
app.get('/batch/:id/history', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // First check in ledger if batch_id exists
    const resultBytes = await fabricConnection.contract.evaluateTransaction('getBatchHistory', id);
    const resultString = Buffer.from(resultBytes).toString('utf8');
    const batchData = JSON.parse(resultString);

    // If batch_id exists then save in database
    if (batchData && batchData.length > 0) {
      await pool.query(
        'INSERT INTO user_batches (user_id, batch_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.userId, id]
      );
    }

    res.json(batchData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/my-history', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    console.log(userId);
    const result = await pool.query(
      'SELECT batch_id FROM user_batches WHERE user_id = $1 ORDER BY id DESC',
      [userId]
    );

    res.json({ history: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Health check
app.get('/', (req, res) => {
	res.json({ status: 'Fabric Gateway backend running' });
});

// === Start the server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));

// Handle graceful shutdown
process.on('SIGINT', () => {
	console.log('Closing Fabric Gateway...');
	fabricConnection?.gateway?.close();
	fabricConnection?.client?.close();
	process.exit(0);
});
