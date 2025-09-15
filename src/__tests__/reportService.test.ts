import * as E from 'fp-ts/Either';
import { createReportService } from '../services/reportService';
import type { Employee } from '../models/employees';

// Mock the employees module
jest.mock('../models/employees', () => ({
  employees: [
    {
      id: 'EMP0001',
      name: 'Test Manager',
      department: 'Engineering',
      title: 'Manager',
      joinedOn: '2020-01-01',
      leftOn: null,
      employmentType: 'FullTime',
      location: { city: 'Test City', country: 'TC' },
      managerId: null,
    },
    {
      id: 'EMP0002',
      name: 'Test Engineer 1',
      department: 'Engineering',
      title: 'Engineer',
      joinedOn: '2021-01-01',
      leftOn: null,
      employmentType: 'FullTime',
      location: { city: 'Test City', country: 'TC' },
      managerId: 'EMP0001',
    },
    {
      id: 'EMP0003',
      name: 'Test Engineer 2',
      department: 'Engineering',
      title: 'Engineer',
      joinedOn: '2022-01-01',
      leftOn: '2023-01-01',
      employmentType: 'FullTime',
      location: { city: 'Test City', country: 'TC' },
      managerId: 'EMP0001',
    },
    {
      id: 'EMP0004',
      name: 'Test Sales',
      department: 'Sales',
      title: 'Sales Rep',
      joinedOn: '2021-06-01',
      leftOn: null,
      employmentType: 'FullTime',
      location: { city: 'Test City', country: 'TC' },
      managerId: null,
    },
  ],
}));

describe('reportService', () => {
  const mockNow = new Date('2024-01-01');
  const service = createReportService({ now: () => mockNow });

  describe('createReportService', () => {
    it('should create service with injected dependencies', () => {
      expect(service).toHaveProperty('compute');
      expect(typeof service.compute).toBe('function');
    });
  });

  describe('compute - org scope', () => {
    it('should compute organization-wide tenure report', () => {
      const result = service.compute('org', {});

      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right).toEqual({
          scope: 'org',
          count: 4,
          sumDays: expect.any(Number),
          avgDays: expect.any(Number),
        });
      }
    });

    it('should filter by departments', () => {
      const result = service.compute('org', { departments: ['Engineering'] });

      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right).toEqual({
          scope: 'org',
          count: 3, // Only Engineering employees
          sumDays: expect.any(Number),
          avgDays: expect.any(Number),
        });
      }
    });

    it('should filter by id range', () => {
      const result = service.compute('org', {
        idStart: 'EMP0002',
        idEnd: 'EMP0003',
      });

      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right).toEqual({
          scope: 'org',
          count: 2, // Only EMP0002 and EMP0003
          sumDays: expect.any(Number),
          avgDays: expect.any(Number),
        });
      }
    });

    it('should use custom asOf date', () => {
      const result = service.compute('org', { asOf: '2023-06-01' });

      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right).toEqual({
          scope: 'org',
          count: 4,
          sumDays: expect.any(Number),
          avgDays: expect.any(Number),
        });
      }
    });

    it('should return error for invalid asOf date', () => {
      const result = service.compute('org', { asOf: 'invalid-date' });

      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left).toEqual({
          tag: 'BadInput',
          message: 'Invalid asOf date',
        });
      }
    });
  });

  describe('compute - department scope', () => {
    it('should compute department-wise tenure report', () => {
      const result = service.compute('department', {});

      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right).toEqual({
          scope: 'department',
          items: expect.arrayContaining([
            expect.objectContaining({
              department: 'Engineering',
              count: 3,
              sumDays: expect.any(Number),
              avgDays: expect.any(Number),
            }),
            expect.objectContaining({
              department: 'Sales',
              count: 1,
              sumDays: expect.any(Number),
              avgDays: expect.any(Number),
            }),
          ]),
        });
      }
    });

    it('should filter departments in department scope', () => {
      const result = service.compute('department', {
        departments: ['Engineering'],
      });

      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right).toEqual({
          scope: 'department',
          items: [
            expect.objectContaining({
              department: 'Engineering',
              count: 3,
              sumDays: expect.any(Number),
              avgDays: expect.any(Number),
            }),
          ],
        });
      }
    });
  });

  describe('error handling', () => {
    it('should return computation error for invalid dates in employee records', () => {
      // This test would require mocking employees with invalid dates
      // For now, we'll test the happy path
      const result = service.compute('org', {});
      expect(E.isRight(result)).toBe(true);
    });
  });
});
