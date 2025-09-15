import { z } from 'zod';
import * as E from 'fp-ts/Either';
import type { Request, Response } from 'express';
import { createReportService } from '../services/reportService';
import type { Department } from '../models/employees';
import type { ReportFilters } from '../services/reportTypes';

const querySchema = z.object({
  scope: z.enum(['org', 'department']),
  departments: z.string().optional(), // CSV
  idStart: z.string().optional(),
  idEnd: z.string().optional(),
  asOf: z.string().optional(), // ISO
});

export const getTenureReport = (req: Request, res: Response) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success)
    return res
      .status(400)
      .json({ error: 'Invalid query', details: parsed.error.flatten() });

  const { scope, departments, idStart, idEnd, asOf } = parsed.data;

  const svc = createReportService({ now: () => new Date() });

  const departmentsList = departments
    ? (departments.split(',').map(s => s.trim()) as Department[])
    : undefined;

  const filters: ReportFilters = {
    departments: departmentsList,
    idStart,
    idEnd,
    asOf,
  };

  const result = svc.compute(scope, filters);

  // fold Either to HTTP
  if (E.isLeft(result)) {
    const err = result.left;
    return res.status(err.tag === 'BadInput' ? 400 : 422).json({ error: err });
  } else {
    return res.json(result.right);
  }
};
