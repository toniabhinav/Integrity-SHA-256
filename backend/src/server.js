import express from 'express';
import crypto from 'crypto';
import multer from 'multer';

const app = express();
const PORT = 3002; // Authoritative backend port for SecureFile

// Configure multer for in-memory storage (20 MB limit per file)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB limit
  },
});

// Middleware for CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// JSON body parser
app.use(express.json());

// Health check endpoint with version, PID, and feature discovery
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SecureFile Backend',
    version: '2.0.0',
    port: PORT,
    pid: process.pid,
    uptime: Math.floor(process.uptime()),
    features: ['sha256', 'batch-hash', 'single-hash'],
    timestamp: new Date().toISOString(),
  });
});

// Single file hash generation endpoint (preserved for backward compatibility)
app.post('/api/hash', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
      });
    }

    // Calculate SHA-256 hash strictly from file buffer
    const hash = crypto.createHash('sha256');
    hash.update(req.file.buffer);
    const sha256Hash = hash.digest('hex');

    res.json({
      filename: req.file.originalname,
      size: req.file.size,
      hash: sha256Hash,
      algorithm: 'SHA-256',
    });
  } catch (error) {
    console.error('Error processing single file:', error);
    res.status(500).json({
      error: 'Failed to process file',
    });
  }
});

// Batch file hash generation handler
const handleBatchHash = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded for batch hashing',
      });
    }

    // Process each file strictly in memory
    const results = req.files.map((file) => {
      const hash = crypto.createHash('sha256');
      hash.update(file.buffer);
      const sha256Hash = hash.digest('hex');

      return {
        filename: file.originalname,
        size: file.size,
        hash: sha256Hash,
        algorithm: 'SHA-256',
      };
    });

    res.json({
      count: results.length,
      files: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing batch files:', error);
    res.status(500).json({
      error: 'Failed to process batch files',
    });
  }
};

// Batch endpoints: support both /api/batch-hash and /api/hash/batch (up to 100 files)
app.post('/api/batch-hash', upload.array('files', 100), handleBatchHash);
app.post('/api/hash/batch', upload.array('files', 100), handleBatchHash);

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File size exceeds limit (maximum 20 MB per file)',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files uploaded (maximum 100 files per batch)',
      });
    }
    return res.status(400).json({
      error: `Upload error: ${err.message}`,
    });
  }

  // Handle malformed JSON payload gracefully
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON payload in request body',
    });
  }

  console.error('Unhandled server error:', err.stack);
  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server with safe EADDRINUSE diagnosis and lifecycle management
const server = app.listen(PORT);

server.on('listening', () => {
  console.log(`\n===============================================================`);
  console.log(` SecureFile Backend v2.0 listening on http://localhost:${PORT}`);
  console.log(` - Process ID (PID): ${process.pid}`);
  console.log(` - Project Root:     ${process.cwd()}`);
  console.log(` - Status:           READY`);
  console.log(` - Press Ctrl+C in this terminal to stop the server.`);
  console.log(`===============================================================\n`);
});

server.on('error', async (err) => {
  if (err.code === 'EADDRINUSE') {
    // Port 3002 is occupied. Probe existing service to give a helpful non-crashing response
    try {
      const probeRes = await fetch(`http://127.0.0.1:${PORT}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });

      if (probeRes.ok) {
        const data = await probeRes.json().catch(() => null);

        if (data && data.service === 'SecureFile Backend') {
          const hasBatch = Array.isArray(data.features) && data.features.includes('batch-hash');

          if (hasBatch) {
            console.log(`\n===============================================================`);
            console.log(` [SecureFile Backend] ALREADY RUNNING & HEALTHY!`);
            console.log(` - An instance of SecureFile Backend is already active on http://localhost:${PORT}`);
            console.log(` - Existing PID: ${data.pid || 'running'}`);
            console.log(` - Status:       ONLINE (HTTP 200 OK)`);
            console.log(` - Features:     ${(data.features || []).join(', ')}`);
            console.log(` You do NOT need to start another backend instance.`);
            console.log(` To stop the existing server, run: npm run dev:stop`);
            console.log(`===============================================================\n`);
            process.exit(0);
            return;
          } else {
            console.warn(`\n===============================================================`);
            console.warn(` [SecureFile Backend WARNING] Outdated backend on port ${PORT}!`);
            console.warn(` - The existing server is missing the required batch-hash endpoint.`);
            console.warn(` - To update: Run "npm run dev:stop" then "npm start".`);
            console.warn(`===============================================================\n`);
            process.exit(1);
            return;
          }
        }
      }
    } catch {
      // Probe failed or timed out
    }

    // Occupied by foreign/unknown process
    console.error(`\n===============================================================`);
    console.error(` [SecureFile Backend ERROR] Port ${PORT} is occupied!`);
    console.error(` - Error: Address already in use (EADDRINUSE :${PORT})`);
    console.error(` To inspect the process occupying port ${PORT}: run "npm run dev:status"`);
    console.error(` To stop verified SecureFile processes:         run "npm run dev:stop"`);
    console.error(`===============================================================\n`);
    process.exit(1);
  } else {
    console.error(`[SecureFile Backend ERROR] Failed to bind to port ${PORT}:`, err.message);
    process.exit(1);
  }
});

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log('\n[SecureFile Backend] Shutting down gracefully (closing port 3002)...');
  server.close(() => {
    console.log('[SecureFile Backend] Server stopped successfully. Port 3002 released.\n');
    process.exit(0);
  });
  // Force exit after 3 seconds if requests hang
  setTimeout(() => process.exit(0), 3000).unref();
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
