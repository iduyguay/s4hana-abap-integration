import { Request, Response } from 'express';
import { SapOdataClient } from '../services/sapOdataClient';

const sapClient = new SapOdataClient();

export const getSalesOrders = async (req: Request, res: Response) => {
  try {
    const top = req.query.top ? parseInt(req.query.top as string, 10) : 20;
    const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;
    const status = req.query.status as string | undefined;

    const orders = await sapClient.getSalesOrders(top, skip, status);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSalesOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await sapClient.getSalesOrderById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: `Sales order ${id} not found.` });
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createSalesOrder = async (req: Request, res: Response) => {
  try {
    const { CustomerID, OrderType, SalesOrg, GrossAmount, CurrencyCode, OverallStatus } = req.body;

    if (!CustomerID) {
      return res.status(400).json({ success: false, message: 'CustomerID is required.' });
    }

    const newOrder = await sapClient.createSalesOrder({
      CustomerID,
      OrderType: OrderType || 'OR',
      SalesOrg: SalesOrg || '1010',
      GrossAmount: GrossAmount || 0.0,
      CurrencyCode: CurrencyCode || 'EUR',
      OverallStatus: OverallStatus || 'Open'
    });

    res.status(201).json({ success: true, data: newOrder });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const completeSalesOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedOrder = await sapClient.completeOrder(id);
    res.json({ success: true, message: `Sales order ${id} completed successfully.`, data: updatedOrder });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
