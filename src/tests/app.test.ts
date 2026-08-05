import { jest, describe, beforeEach, afterEach, expect, it } from '@jest/globals';

const mockUse = jest.fn();
const mockExpressApp = { use: mockUse };
const mockExpress = Object.assign(jest.fn(() => mockExpressApp), {
    json: jest.fn(() => 'json-middleware'),
    urlencoded: jest.fn(() => 'urlencoded-middleware'),
});

const mockCors = jest.fn(() => 'cors-middleware');
const mockInitDB = jest.fn();
const mockConnectKafka = jest.fn();
const mockRedisConnect = jest.fn();

jest.unstable_mockModule('express', () => ({
    default: mockExpress,
}));

jest.unstable_mockModule('cors', () => ({
    default: mockCors,
}));

jest.unstable_mockModule('../config/connect.js', () => ({
    initDB: mockInitDB,
}));

jest.unstable_mockModule('../producer.js', () => ({
    connectKafka: mockConnectKafka,
}));

jest.unstable_mockModule('../redis/redis.js', () => ({
    redisConnect: mockRedisConnect,
}));

jest.unstable_mockModule('../routes/authRoutes.js', () => ({
    default: {},
}));

describe('app cors configuration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        delete process.env.FRONTEND_URL;
    });

    afterEach(() => {
        delete process.env.FRONTEND_URL;
    });

    it('allows requests when no frontend url is configured', async () => {
        const { buildCorsOptions } = await import('../../src/app.js');

        const options = buildCorsOptions();
        const callback = jest.fn();

        options.origin(undefined as unknown as string, callback);

        expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('allows configured frontend origins and rejects others', async () => {
        process.env.FRONTEND_URL = 'http://localhost:3000,http://localhost:5173';

        const { buildCorsOptions } = await import('../../src/app.js');

        const options = buildCorsOptions();
        const allowCallback = jest.fn();
        const denyCallback = jest.fn();

        options.origin('http://localhost:3000', allowCallback);
        options.origin('http://evil.example', denyCallback);

        expect(allowCallback).toHaveBeenCalledWith(null, true);
        expect(denyCallback).toHaveBeenCalledWith(null, false);
    });
});
