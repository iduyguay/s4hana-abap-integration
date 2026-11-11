import { odataKeySegment, odataStringLiteral, SapOdataClient } from '../src/services/sapOdataClient';
import { parseSalesOrderQuery } from '../src/controllers/salesOrderController';

describe('SAP OData Client Integration Suite', () => {
  let client: SapOdataClient;

  beforeEach(() => {
    client = new SapOdataClient(true);
  });

  test('should successfully fetch CSRF token handshake', async () => {
    const token = await client.fetchCsrfToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token).toContain('MOCK_SAP_CSRF_TOKEN');
  });

  test('should retrieve initial list of Sales Orders', async () => {
    const orders = await client.getSalesOrders(10, 0);
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0]).toHaveProperty('SalesOrderID');
    expect(orders[0]).toHaveProperty('GrossAmount');
  });

  test('should filter Sales Orders by OverallStatus', async () => {
    const openOrders = await client.getSalesOrders(10, 0, 'Open');
    expect(openOrders.every(o => o.OverallStatus === 'Open')).toBe(true);

    const completedOrders = await client.getSalesOrders(10, 0, 'Completed');
    expect(completedOrders.every(o => o.OverallStatus === 'Completed')).toBe(true);
  });

  test('should create a new Sales Order in SAP', async () => {
    const newOrderPayload = {
      CustomerID: '0001000999',
      OrderType: 'OR',
      SalesOrg: '1010',
      GrossAmount: 980.50,
      CurrencyCode: 'EUR',
      OverallStatus: 'Open'
    };

    const created = await client.createSalesOrder(newOrderPayload);
    expect(created.SalesOrderID).toBeDefined();
    expect(created.CustomerID).toBe('0001000999');
    expect(created.GrossAmount).toBe(980.50);

    const fetched = await client.getSalesOrderById(created.SalesOrderID);
    expect(fetched).not.toBeNull();
    expect(fetched?.SalesOrderID).toBe(created.SalesOrderID);
  });

  test('should execute RAP custom action setOrderCompleted', async () => {
    const orders = await client.getSalesOrders(10, 0, 'Open');
    const orderToComplete = orders[0];

    const updated = await client.completeOrder(orderToComplete.SalesOrderID);
    expect(updated.OverallStatus).toBe('Completed');
  });
});

describe('OData query and input boundaries', () => {
  test('escapes apostrophes and encodes key segments', () => {
    expect(odataStringLiteral("O'Brien")).toBe("'O''Brien'");
    expect(odataKeySegment("O'Brien / 10")).toBe("%27O%27%27Brien%20%2F%2010%27");
  });

  test('uses bounded pagination defaults and rejects malformed query values', () => {
    expect(parseSalesOrderQuery({} as any)).toEqual({
      top: 20,
      skip: 0,
      status: undefined
    });
    expect(parseSalesOrderQuery({ top: '100', skip: '100000', status: ' Open ' } as any)).toEqual({
      top: 100,
      skip: 100000,
      status: 'Open'
    });
    expect(parseSalesOrderQuery({ top: '101' } as any)).toBeNull();
    expect(parseSalesOrderQuery({ skip: '-1' } as any)).toBeNull();
    expect(parseSalesOrderQuery({ top: ['10', '20'] } as any)).toBeNull();
    expect(parseSalesOrderQuery({ status: 'x'.repeat(41) } as any)).toBeNull();
  });

  test('rejects invalid page values in the client too', async () => {
    const client = new SapOdataClient(true);
    await expect(client.getSalesOrders(0)).rejects.toThrow(/top must be/);
    await expect(client.getSalesOrders(101)).rejects.toThrow(/top must be/);
    await expect(client.getSalesOrders(20, -1)).rejects.toThrow(/skip must be/);
    await expect(client.getSalesOrders(20, 0, 'x'.repeat(41))).rejects.toThrow(/status must be/);
  });
});
