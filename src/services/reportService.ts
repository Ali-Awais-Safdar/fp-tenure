import * as R from 'ramda';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import type { Either } from 'fp-ts/Either';
import { employees } from '../models/employees';
import type { Employee, Department } from '../models/employees';
import {
  inDepartments,
  betweenIds,
  groupByDept,
  pickTenures,
  sum,
  avg,
  parseIsoSafe,
} from './reportUtils';
import type {
  ReportFilters,
  TenureReport,
  DeptReportItem,
  DomainError,
  Scope,
} from './reportTypes';

// factory so we can inject a clock for tests (keeps controllers thin & code testable)
export const createReportService = (deps: { now: () => Date }) => {
  const compute = (
    scope: Scope,
    filters: ReportFilters
  ): Either<DomainError, TenureReport> => {
    // boundary validation -> Result/Either (no exceptions bubbling)
    const asOfOption = filters.asOf ? parseIsoSafe(filters.asOf) : O.some(deps.now());
    if (O.isNone(asOfOption)) return E.left({ tag: 'BadInput', message: 'Invalid asOf date' });
    const asOf = asOfOption.value;

    // declarative filter pipeline (currying + composition)
    const filtered: ReadonlyArray<Employee> = R.pipe(
      R.filter(inDepartments(filters.departments) as (e: Employee) => boolean),
      R.filter(betweenIds(filters.idStart, filters.idEnd) as (e: Employee) => boolean)
    )(employees);

    const tenures = pickTenures(asOf)(filtered);
    if (tenures.some(Number.isNaN)) {
      return E.left({
        tag: 'ComputationError',
        message: 'Some records have invalid dates',
      });
    }

    if (scope === 'org') {
      return E.right({
        scope: 'org',
        count: filtered.length,
        sumDays: sum(tenures),
        avgDays: avg(tenures),
      });
    }

    // scope === 'department'
    const byDept = groupByDept(filtered);
    const items: DeptReportItem[] = R.pipe(
      R.toPairs, // [dept, Employee[]][]
      R.map(([dept, list]) => {
        const employeeList = list as Employee[];
        const t = pickTenures(asOf)(employeeList);
        return {
          department: dept as Department,
          count: employeeList.length,
          sumDays: sum(t),
          avgDays: avg(t),
        };
      })
    )(byDept);

    return E.right({ scope: 'department', items });
  };

  return { compute };
};
