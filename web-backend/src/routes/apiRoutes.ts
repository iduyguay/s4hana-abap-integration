import { Router } from 'express';
import {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  completeSalesOrder
} from '../controllers/salesOrderController';

const router = Router();

router.get('/orders', getSalesOrders);
router.get('/orders/:id', getSalesOrderById);
router.post('/orders', createSalesOrder);
router.post('/orders/:id/complete', completeSalesOrder);

export default router;
