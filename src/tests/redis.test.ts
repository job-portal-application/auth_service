import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockConnect = jest.fn<() => Promise<any>>();

jest.unstable_mockModule('redis', () => ({
    createClient: jest.fn(() => ({
        connect: mockConnect,
    })),
}));

jest.unstable_mockModule('dotenv', () => ({
    default: {
        config: jest.fn(),
    },
}));

describe('redis config', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('should throw error if REDIS_URL is missing', async () => {
        delete process.env.REDIS_URL;

        await expect(import('../redis/redis.js'))
            .rejects
            .toThrow('REDIS_URL environment variable is required');
    });

    it('should create redis client successfully', async () => {
        process.env.REDIS_URL = 'redis://localhost:6379';

        const module = await import('../redis/redis.js');

        expect(module.redisClient).toBeDefined();
    });

    it('should connect to redis successfully', async () => {
        process.env.REDIS_URL = 'redis://localhost:6379';

        mockConnect.mockResolvedValue(undefined);

        const consoleSpy = jest
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        const { redisConnect } = await import('../redis/redis.js');

        await redisConnect();

        expect(mockConnect).toHaveBeenCalled();

        expect(consoleSpy).toHaveBeenCalledWith(
            'Connected to Redis'
        );

        consoleSpy.mockRestore();
    });

    it('should handle redis connection failure', async () => {
        process.env.REDIS_URL = 'redis://localhost:6379';

        const error = new Error('Redis connection failed');

        mockConnect.mockRejectedValue(error);

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        const { redisConnect } = await import('../redis/redis.js');

        await redisConnect();

        expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to connect to Redis:',
            error
        );

        consoleSpy.mockRestore();
    });
});