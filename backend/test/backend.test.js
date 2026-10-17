import crypto from 'crypto';

const BASE_URL = 'http://127.0.0.1:3002';

async function runTests() {
  console.log('--- Starting SecureFile Backend Test Suite ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  PASS: ${message}`);
      passed++;
    } else {
      console.error(`  FAIL: ${message}`);
      failed++;
    }
  }

  // Test 1: Health Check
  try {
    const health = await fetch(`${BASE_URL}/api/health`).then((r) => r.json());
    assert(health.status === 'ok', 'Health status is "ok"');
    assert(health.service === 'SecureFile Backend', 'Service is "SecureFile Backend"');
    assert(health.port === 3002, 'Port reports 3002');
    assert(Array.isArray(health.features) && health.features.includes('batch-hash'), 'Features include batch-hash');
  } catch (err) {
    assert(false, `Health check exception: ${err.message}`);
  }

  // Test 2: Single-File Known SHA-256 Digest
  try {
    const sampleText = 'hello world';
    const expectedHash = crypto.createHash('sha256').update(sampleText).digest('hex');

    const form = new FormData();
    form.append('file', new Blob([sampleText]), 'test.txt');

    const singleRes = await fetch(`${BASE_URL}/api/hash`, { method: 'POST', body: form });
    const singleData = await singleRes.json();

    assert(singleRes.status === 200, 'Single hash endpoint returns HTTP 200');
    assert(singleData.hash === expectedHash, 'Single hash matches expected SHA-256 digest');
    assert(singleData.algorithm === 'SHA-256', 'Algorithm specifies SHA-256');
  } catch (err) {
    assert(false, `Single hash exception: ${err.message}`);
  }

  // Test 3: Single-File Missing File Error Handling
  try {
    const res = await fetch(`${BASE_URL}/api/hash`, { method: 'POST', body: new FormData() });
    const data = await res.json();
    assert(res.status === 400, 'Empty upload returns HTTP 400 Bad Request');
    assert(data.error === 'No file uploaded', 'Error message indicates no file uploaded');
  } catch (err) {
    assert(false, `Empty single hash exception: ${err.message}`);
  }

  // Test 4: Batch-Hash Endpoint
  try {
    const file1 = 'Content for file 1';
    const file2 = 'Content for file 2';
    const expectedHash1 = crypto.createHash('sha256').update(file1).digest('hex');
    const expectedHash2 = crypto.createHash('sha256').update(file2).digest('hex');

    const batchForm = new FormData();
    batchForm.append('files', new Blob([file1]), 'file1.txt');
    batchForm.append('files', new Blob([file2]), 'file2.txt');

    const batchRes = await fetch(`${BASE_URL}/api/batch-hash`, { method: 'POST', body: batchForm });
    const batchData = await batchRes.json();

    assert(batchRes.status === 200, 'Batch hash endpoint returns HTTP 200');
    assert(batchData.count === 2, 'Batch count equals 2');
    assert(batchData.files[0].hash === expectedHash1, 'File 1 matches cryptographic digest');
    assert(batchData.files[1].hash === expectedHash2, 'File 2 matches cryptographic digest');
  } catch (err) {
    assert(false, `Batch hash exception: ${err.message}`);
  }

  // Test 5: Batch-Hash Missing Files Error Handling
  try {
    const res = await fetch(`${BASE_URL}/api/batch-hash`, { method: 'POST', body: new FormData() });
    const data = await res.json();
    assert(res.status === 400, 'Empty batch returns HTTP 400 Bad Request');
    assert(data.error === 'No files uploaded for batch hashing', 'Error indicates no files uploaded for batch');
  } catch (err) {
    assert(false, `Empty batch exception: ${err.message}`);
  }

  console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
