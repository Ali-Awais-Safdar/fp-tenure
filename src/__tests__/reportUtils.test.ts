import {
  parseIsoSafe,
  inDepartments,
  betweenIds,
  tenureInDays,
  sum,
  avg,
  groupByDept,
  pickTenures,
} from '../services/reportUtils';
import type { Employee, Department } from '../models/employees';

describe('reportUtils', () => {
  describe('parseIsoSafe', () => {
    it('should parse valid ISO date string', () => {
      const result = parseIsoSafe('2023-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(15);
    });

    it('should return null for invalid date string', () => {
      const result = parseIsoSafe('invalid-date');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseIsoSafe('');
      expect(result).toBeNull();
    });
  });

  describe('inDepartments', () => {
    const employee: Employee = {
      id: 'EMP001',
      name: 'Test Employee',
      department: 'Engineering',
      title: 'Developer',
      joinedOn: '2023-01-01',
      leftOn: null,
      employmentType: 'FullTime',
      location: { city: 'Test City', country: 'TC' },
      managerId: null,
    };

    it('should return true when no departments filter is provided', () => {
      const filter = inDepartments(undefined);
      expect(filter(employee)).toBe(true);
    });

    it('should return true when employee department is in allowed list', () => {
      const filter = inDepartments(['Engineering', 'Sales']);
      expect(filter(employee)).toBe(true);
    });

    it('should return false when employee department is not in allowed list', () => {
      const filter = inDepartments(['Sales', 'Marketing']);
      expect(filter(employee)).toBe(false);
    });

    it('should return true when allowed list is empty', () => {
      const filter = inDepartments([]);
      expect(filter(employee)).toBe(true);
    });
  });

  describe('betweenIds', () => {
    const employee1: Employee = {
      id: 'EMP0010',
      name: 'Test Employee 1',
      department: 'Engineering',
      title: 'Developer',
      joinedOn: '2023-01-01',
      leftOn: null,
      employmentType: 'FullTime',
      location: { city: 'Test City', country: 'TC' },
      managerId: null,
    };

    const employee2: Employee = {
      id: 'EMP0020',
      name: 'Test Employee 2',
      department: 'Engineering',
      title: 'Developer',
      joinedOn: '2023-01-01',
      leftOn: null,
      employmentType: 'FullTime',
      location: { city: 'Test City', country: 'TC' },
      managerId: null,
    };

    it('should return true when no id filters are provided', () => {
      const filter = betweenIds(undefined, undefined);
      expect(filter(employee1)).toBe(true);
      expect(filter(employee2)).toBe(true);
    });

    it('should return true when employee id is within range', () => {
      const filter = betweenIds('EMP0005', 'EMP0015');
      expect(filter(employee1)).toBe(true);
      expect(filter(employee2)).toBe(false);
    });

    it('should return true when only start id is provided', () => {
      const filter = betweenIds('EMP0005', undefined);
      expect(filter(employee1)).toBe(true);
      expect(filter(employee2)).toBe(true);
    });

    it('should return true when only end id is provided', () => {
      const filter = betweenIds(undefined, 'EMP0015');
      expect(filter(employee1)).toBe(true);
      expect(filter(employee2)).toBe(false);
    });
  });

  describe('tenureInDays', () => {
    const asOf = new Date('2024-01-01');

    const currentEmployee: Employee = {
      id: 'EMP001',
      name: 'Current Employee',
      department: 'Engineering',
      title: 'Developer',
      joinedOn: '2023-01-01',
      leftOn: null,
      employmentType: 'FullTime',
      location: { city: 'Test City', country: 'TC' },
      managerId: null,
    };

    const formerEmployee: Employee = {
      id: 'EMP002',
      name: 'Former Employee',
      department: 'Engineering',
      title: 'Developer',
      joinedOn: '2022-01-01',
      leftOn: '2023-06-01',
      employmentType: 'FullTime',
      location: { city: 'Test City', country: 'TC' },
      managerId: null,
    };

    it('should calculate tenure for current employee', () => {
      const tenureFn = tenureInDays(asOf);
      const result = tenureFn(currentEmployee);
      expect(result).toBe(365); // 2024-01-01 - 2023-01-01 = 365 days
    });

    it('should calculate tenure for former employee', () => {
      const tenureFn = tenureInDays(asOf);
      const result = tenureFn(formerEmployee);
      // Former employee: joined 2022-01-01, left 2023-06-01
      // Tenure = 2023-06-01 - 2022-01-01 = 516 days
      expect(result).toBe(516);
    });

    it('should return NaN for invalid dates', () => {
      const invalidEmployee: Employee = {
        id: 'EMP003',
        name: 'Invalid Employee',
        department: 'Engineering',
        title: 'Developer',
        joinedOn: 'invalid-date',
        leftOn: null,
        employmentType: 'FullTime',
        location: { city: 'Test City', country: 'TC' },
        managerId: null,
      };

      const tenureFn = tenureInDays(asOf);
      const result = tenureFn(invalidEmployee);
      expect(result).toBeNaN();
    });
  });

  describe('sum', () => {
    it('should sum array of numbers', () => {
      expect(sum([1, 2, 3, 4, 5])).toBe(15);
    });

    it('should return 0 for empty array', () => {
      expect(sum([])).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(sum([-1, -2, 3])).toBe(0);
    });
  });

  describe('avg', () => {
    it('should calculate average of array of numbers', () => {
      expect(avg([1, 2, 3, 4, 5])).toBe(3);
    });

    it('should return 0 for empty array', () => {
      expect(avg([])).toBe(0);
    });

    it('should handle decimal results', () => {
      expect(avg([1, 2, 3])).toBe(2);
    });
  });

  describe('groupByDept', () => {
    const employees: Employee[] = [
      {
        id: 'EMP001',
        name: 'Engineer 1',
        department: 'Engineering',
        title: 'Developer',
        joinedOn: '2023-01-01',
        leftOn: null,
        employmentType: 'FullTime',
        location: { city: 'Test City', country: 'TC' },
        managerId: null,
      },
      {
        id: 'EMP002',
        name: 'Engineer 2',
        department: 'Engineering',
        title: 'Developer',
        joinedOn: '2023-01-01',
        leftOn: null,
        employmentType: 'FullTime',
        location: { city: 'Test City', country: 'TC' },
        managerId: null,
      },
      {
        id: 'EMP003',
        name: 'Sales Person',
        department: 'Sales',
        title: 'Sales Rep',
        joinedOn: '2023-01-01',
        leftOn: null,
        employmentType: 'FullTime',
        location: { city: 'Test City', country: 'TC' },
        managerId: null,
      },
    ];

    it('should group employees by department', () => {
      const result = groupByDept(employees);
      expect(result.Engineering).toHaveLength(2);
      expect(result.Sales).toHaveLength(1);
    });
  });

  describe('pickTenures', () => {
    const asOf = new Date('2024-01-01');
    const employees: Employee[] = [
      {
        id: 'EMP001',
        name: 'Employee 1',
        department: 'Engineering',
        title: 'Developer',
        joinedOn: '2023-01-01',
        leftOn: null,
        employmentType: 'FullTime',
        location: { city: 'Test City', country: 'TC' },
        managerId: null,
      },
      {
        id: 'EMP002',
        name: 'Employee 2',
        department: 'Engineering',
        title: 'Developer',
        joinedOn: '2022-01-01',
        leftOn: null,
        employmentType: 'FullTime',
        location: { city: 'Test City', country: 'TC' },
        managerId: null,
      },
    ];

    it('should calculate tenures for all employees', () => {
      const result = pickTenures(asOf)(employees);
      expect(result).toEqual([365, 730]);
    });
  });
});
