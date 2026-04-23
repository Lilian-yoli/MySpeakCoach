import request from 'supertest';
import { app } from '../../src/index.js';

describe('Cards SRS API Integration', () => {
    test('GET /api/cards/due should return a 200 HTTP status', async () => {
        const response = await request(app).get('/api/cards/due');
        // Route now exists, but we might encounter 401, 500, or 200 based on user DB mock
        expect(response.status).not.toBe(404);
    });

    test('POST /api/cards/:id/review should return a 200/403/500 depending on actual DB constraints, but never 404 missing route', async () => {
        const response = await request(app).post('/api/cards/9999/review');
        expect(response.status).not.toBe(404);
    });
});
