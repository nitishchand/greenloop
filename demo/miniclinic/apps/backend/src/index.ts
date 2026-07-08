import express from 'express';
import { patientsRouter } from './patients.js';

const app = express();
app.use(express.json());

// The verifier's backend-up preflight and docker-compose healthcheck both hit this.
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(patientsRouter);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`backend listening on :${port}`);
});

export default app;
