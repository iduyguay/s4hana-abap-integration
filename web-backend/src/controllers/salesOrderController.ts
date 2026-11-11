import { Request, Response } from 'express';
import { SapOdataClient } from '../services/sapOdataClient';

const sapClient = new SapOdataClient();

export function parseSalesOrderQuery(query: Request["query"]) {
  const parseInteger = (value: unknown, fallback: number) => {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
  };

  const top = parseInteger(query.top, 20);
  const skip = parseInteger(query.skip, 0);
  const status = query.status;

  if (
    top === null ||
    top < 1 ||
    top > 100 ||
    skip === null ||
    skip > 100000 ||
    (status !== undefined && typeof status !== "string") ||
    (typeof status === "string" && status.trim().length > 40)
  ) {
    return null;
  }

  return {
    top,
    skip,
    status: typeof status === "string" && status.trim() ? status.trim() : undefined,
  };
}

export const getSalesOrders = async (req: Request, res: Response) => {
  try {
    const query = parseSalesOrderQuery(req.query);
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Use top=1..100, skip=0..100000, and a single status value up to 40 characters.",
      });
    }

    const orders = await sapClient.getSalesOrders(query.top, query.skip, query.status);
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
