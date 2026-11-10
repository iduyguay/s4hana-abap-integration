import express from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes/apiRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'SAP S/4HANA & ABAP Integration Web Gateway',
    sapDestination: process.env.SAP_ODATA_BASE_URL || 'Mock Environment Active'
  });
});

app.use('/api/v1/sap', apiRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[SAP-Integration] Service running on port ${PORT}`);
    console.log(`[SAP-Integration] Health: http://localhost:${PORT}/health`);
    console.log(`[SAP-Integration] Sales Orders API: http://localhost:${PORT}/api/v1/sap/orders`);
  });
}

export default app;
