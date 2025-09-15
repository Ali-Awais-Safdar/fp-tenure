import type { Department } from '../models/employees';

export type Scope = 'org' | 'department';

export type ReportFilters = {
  departments?: Department[] | undefined;
  idStart?: string | undefined;
  idEnd?: string | undefined;
  asOf?: string | undefined; // ISO date, optional
};

export type OrgReport = {
  scope: 'org';
  count: number;
  sumDays: number;
  avgDays: number;
};

export type DeptReportItem = {
  department: Department;
  count: number;
  sumDays: number;
  avgDays: number;
};

export type DeptReport = {
  scope: 'department';
  items: DeptReportItem[];
};

export type TenureReport = OrgReport | DeptReport;

export type DomainError =
  | { tag: 'BadInput'; message: string }
  | { tag: 'ComputationError'; message: string };
