import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockSql = jest.fn<() => Promise<any>>();

jest.unstable_mockModule('../utils/db.js', () => ({
    sql: mockSql,
}));

const { initDB } = await import('../config/connect.js');

describe('initDB', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize the database successfully', async () => {
        mockSql.mockResolvedValue([]);

        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        await initDB();

        expect(mockSql).toHaveBeenCalled();

        expect(consoleSpy).toHaveBeenCalledWith(
            'Database initialized successfully'
        );

        consoleSpy.mockRestore();
    });

    it('should log error when sql throws', async () => {
        const error = new Error('DB connection failed');

        mockSql.mockRejectedValue(error);

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await initDB();

        expect(consoleSpy).toHaveBeenCalledWith(
            `Error initializing database:, ${error}`
        );

        consoleSpy.mockRestore();
    });
});