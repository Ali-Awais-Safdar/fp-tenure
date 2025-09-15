import { Request, Response } from 'express';
import { getTenureReport } from '../controllers/reportController';
import * as E from 'fp-ts/Either';

// Mock the report service
jest.mock('../services/reportService', () => ({
  createReportService: jest.fn(() => ({
    compute: jest.fn(),
  })),
}));

describe('reportController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      query: {},
    };

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
  });

  describe('getTenureReport', () => {
    it('should return 400 for invalid query parameters', () => {
      mockRequest.query = { scope: 'invalid' };

      getTenureReport(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid query',
        details: expect.any(Object),
      });
    });

    it('should return 400 for missing scope parameter', () => {
      mockRequest.query = {};

      getTenureReport(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid query',
        details: expect.any(Object),
      });
    });

    it('should handle valid org scope request', () => {
      const { createReportService } = require('../services/reportService');
      const mockCompute = jest.fn().mockReturnValue(
        E.right({
          scope: 'org',
          count: 100,
          sumDays: 10000,
          avgDays: 100,
        })
      );

      createReportService.mockReturnValue({ compute: mockCompute });

      mockRequest.query = { scope: 'org' };

      getTenureReport(mockRequest as Request, mockResponse as Response);

      expect(mockCompute).toHaveBeenCalledWith('org', {
        departments: undefined,
        idStart: undefined,
        idEnd: undefined,
        asOf: undefined,
      });
      expect(mockJson).toHaveBeenCalledWith({
        scope: 'org',
        count: 100,
        sumDays: 10000,
        avgDays: 100,
      });
    });

    it('should handle valid department scope request', () => {
      const { createReportService } = require('../services/reportService');
      const mockCompute = jest.fn().mockReturnValue(
        E.right({
          scope: 'department',
          items: [
            {
              department: 'Engineering',
              count: 50,
              sumDays: 5000,
              avgDays: 100,
            },
          ],
        })
      );

      createReportService.mockReturnValue({ compute: mockCompute });

      mockRequest.query = {
        scope: 'department',
        departments: 'Engineering,Sales',
        idStart: 'EMP0010',
        idEnd: 'EMP0020',
        asOf: '2024-01-01',
      };

      getTenureReport(mockRequest as Request, mockResponse as Response);

      expect(mockCompute).toHaveBeenCalledWith('department', {
        departments: ['Engineering', 'Sales'],
        idStart: 'EMP0010',
        idEnd: 'EMP0020',
        asOf: '2024-01-01',
      });
      expect(mockJson).toHaveBeenCalledWith({
        scope: 'department',
        items: [
          {
            department: 'Engineering',
            count: 50,
            sumDays: 5000,
            avgDays: 100,
          },
        ],
      });
    });

    it('should handle BadInput error', () => {
      const { createReportService } = require('../services/reportService');
      const mockCompute = jest.fn().mockReturnValue(
        E.left({
          tag: 'BadInput',
          message: 'Invalid asOf date',
        })
      );

      createReportService.mockReturnValue({ compute: mockCompute });

      mockRequest.query = { scope: 'org', asOf: 'invalid-date' };

      getTenureReport(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: {
          tag: 'BadInput',
          message: 'Invalid asOf date',
        },
      });
    });

    it('should handle ComputationError', () => {
      const { createReportService } = require('../services/reportService');
      const mockCompute = jest.fn().mockReturnValue(
        E.left({
          tag: 'ComputationError',
          message: 'Some records have invalid dates',
        })
      );

      createReportService.mockReturnValue({ compute: mockCompute });

      mockRequest.query = { scope: 'org' };

      getTenureReport(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(422);
      expect(mockJson).toHaveBeenCalledWith({
        error: {
          tag: 'ComputationError',
          message: 'Some records have invalid dates',
        },
      });
    });

    it('should parse departments CSV correctly', () => {
      const { createReportService } = require('../services/reportService');
      const mockCompute = jest.fn().mockReturnValue(
        E.right({
          scope: 'org',
          count: 0,
          sumDays: 0,
          avgDays: 0,
        })
      );

      createReportService.mockReturnValue({ compute: mockCompute });

      mockRequest.query = {
        scope: 'org',
        departments: 'Engineering, Sales, Marketing',
      };

      getTenureReport(mockRequest as Request, mockResponse as Response);

      expect(mockCompute).toHaveBeenCalledWith('org', {
        departments: ['Engineering', 'Sales', 'Marketing'],
        idStart: undefined,
        idEnd: undefined,
        asOf: undefined,
      });
    });
  });
});
