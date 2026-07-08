import { Router } from 'express';

// In-memory by design: the demo needs no migration step, and the list resetting on
// backend restart is specified behaviour (see prd.md data lifecycle).
type Patient = { id: number; name: string };
const patients: Patient[] = [];

export const patientsRouter = Router();

patientsRouter.get('/patients', (_req, res) => {
  res.json(patients);
});

patientsRouter.post('/patients', (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  if (!name) {
    res.status(400).json({ error: 'name required' });
    return;
  }
  const patient = { id: patients.length + 1, name };
  patients.push(patient);
  res.status(201).json(patient);
});
