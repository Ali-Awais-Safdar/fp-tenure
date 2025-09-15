import * as R from 'ramda';
import * as O from 'fp-ts/Option';
import { differenceInDays, parseISO } from 'date-fns';
import type { Employee, Department } from '../models/employees';

// ----- small, pure building blocks -----
export const parseIsoSafe = (s: string): O.Option<Date> => {
  const d = parseISO(s);
  return isNaN(d.valueOf()) ? O.none : O.some(d);
};

const idToNum = (id: string) => Number(id.replace(/\D/g, ''));

// curry-friendly predicates (HOFs)
export const inDepartments = R.curry(
  (allowed: Department[] | undefined, e: Employee): boolean =>
    !allowed?.length || allowed.includes(e.department)
);

export const betweenIds = R.curry(
  (start: string | undefined, end: string | undefined, e: Employee): boolean => {
    const n = idToNum(e.id);
    const okStart = start ? n >= idToNum(start) : true;
    const okEnd = end ? n <= idToNum(end) : true;
    return okStart && okEnd;
  }
);

// functor usage: map over array to compute tenures
export const tenureInDays =
  (asOf: Date) =>
  (e: Employee): number => {
    const start = parseIsoSafe(e.joinedOn);
    const end = e.leftOn ? parseIsoSafe(e.leftOn) : O.some(asOf);
    
    if (O.isNone(start) || O.isNone(end)) return NaN;
    return differenceInDays(end.value, start.value);
  };

// aggregation helpers (reusable/generic)
export const sum = (xs: number[]) => R.sum(xs);
export const avg = (xs: number[]) => (xs.length ? R.mean(xs) : 0);

export const groupByDept = R.groupBy<Employee>(e => e.department);

export const pickTenures = (asOf: Date) => R.map(tenureInDays(asOf));
