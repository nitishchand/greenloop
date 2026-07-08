import express from 'express';

const app = express();
app.use(express.json());

// The verifier's backend-up preflight and docker-compose healthcheck both hit this.
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`backend listening on :${port}`);
});

export default app;
