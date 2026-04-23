import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import SwaggerParser from '@apidevtools/swagger-parser';

import healthRoute from './routes/health.js';
import cardsRoute from './routes/cards.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoute);
app.use('/api/cards', cardsRoute);

// Setup Swagger UI
const swaggerDocPath = path.join(__dirname, '../doc/swagger.yaml');
SwaggerParser.dereference(swaggerDocPath)
    .then((api) => {
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(api));
        console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    })
    .catch((err) => {
        console.error('Failed to load Swagger docs', err);
    });

export const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
