import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface SalesOrderEntity {
  SalesOrderID: string;
  CustomerID: string;
  CustomerName?: string;
  OrderType?: string;
  SalesOrg?: string;
  GrossAmount: number;
  CurrencyCode: string;
  OverallStatus: string;
  CreatedAt?: string;
}

export interface SalesOrderItemEntity {
  SalesOrderID: string;
  ItemPosition: string;
  Material: string;
  MaterialDescription?: string;
  TargetQuantity: number;
  TargetQuantityUnit: string;
  NetAmount: number;
  CurrencyCode: string;
}

export class SapOdataClient {
  private client: AxiosInstance;
  private csrfToken: string | null = null;
  private cookies: string[] = [];
  private mockMode: boolean;

  private mockSalesOrders: SalesOrderEntity[] = [
    {
      SalesOrderID: '0000000010',
      CustomerID: '0001000001',
      CustomerName: 'Acme Corp',
      OrderType: 'OR',
      SalesOrg: '1010',
      GrossAmount: 1450.0,
      CurrencyCode: 'EUR',
      OverallStatus: 'Open',
      CreatedAt: '2026-11-01'
    },
    {
      SalesOrderID: '0000000020',
      CustomerID: '0001000002',
      CustomerName: 'Global Logistics AG',
      OrderType: 'OR',
      SalesOrg: '1010',
      GrossAmount: 5200.75,
      CurrencyCode: 'EUR',
      OverallStatus: 'Completed',
      CreatedAt: '2026-11-05'
    }
  ];

  constructor(mockMode: boolean = process.env.SAP_MOCK_MODE === 'true' || true) {
    this.mockMode = mockMode;
    const baseURL = process.env.SAP_ODATA_BASE_URL || 'https://s4hana-host:443/sap/opu/odata4/sap/zui_salesorder_o4/srvd/sap/zui_salesorder_o4/0001';

    this.client = axios.create({
      baseURL,
      auth: {
        username: process.env.SAP_USER || 'DEVELOPER',
        password: process.env.SAP_PASSWORD || 'Secret123'
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  public async fetchCsrfToken(): Promise<string> {
    if (this.mockMode) {
      this.csrfToken = 'MOCK_SAP_CSRF_TOKEN_2026';
      return this.csrfToken;
    }

    try {
      const response: AxiosResponse = await this.client.get('/', {
        headers: { 'X-CSRF-Token': 'Fetch' }
      });

      this.csrfToken = response.headers['x-csrf-token'] || null;
      if (response.headers['set-cookie']) {
        this.cookies = response.headers['set-cookie'];
      }

      if (!this.csrfToken) {
        throw new Error('SAP Gateway did not return an X-CSRF-Token.');
      }

      return this.csrfToken;
    } catch (error: any) {
      throw new Error(`Failed to fetch CSRF token from SAP Gateway: ${error.message}`);
    }
  }

  public async getSalesOrders(top: number = 20, skip: number = 0, statusFilter?: string): Promise<SalesOrderEntity[]> {
    if (this.mockMode) {
      let result = [...this.mockSalesOrders];
      if (statusFilter) {
        result = result.filter(o => o.OverallStatus.toLowerCase() === statusFilter.toLowerCase());
      }
      return result.slice(skip, skip + top);
    }

    const params: Record<string, any> = {
      $top: top,
      $skip: skip
    };

    if (statusFilter) {
      params.$filter = `OverallStatus eq '${statusFilter}'`;
    }

    const response = await this.client.get('/SalesOrder', { params });
    return response.data.value;
  }

  public async getSalesOrderById(salesOrderId: string): Promise<SalesOrderEntity | null> {
    if (this.mockMode) {
      const order = this.mockSalesOrders.find(o => o.SalesOrderID === salesOrderId);
      return order || null;
    }

    try {
      const response = await this.client.get(`/SalesOrder('${salesOrderId}')`, {
        params: { $expand: '_Items' }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  public async createSalesOrder(orderData: Omit<SalesOrderEntity, 'SalesOrderID' | 'CreatedAt'>): Promise<SalesOrderEntity> {
    if (this.mockMode) {
      const newOrder: SalesOrderEntity = {
        ...orderData,
        SalesOrderID: `00000000${this.mockSalesOrders.length + 10}`,
        CreatedAt: new Date().toISOString().split('T')[0]
      };
      this.mockSalesOrders.push(newOrder);
      return newOrder;
    }

    const token = await this.fetchCsrfToken();
    const response = await this.client.post('/SalesOrder', orderData, {
      headers: {
        'X-CSRF-Token': token,
        'Cookie': this.cookies.join('; ')
      }
    });

    return response.data;
  }

  public async completeOrder(salesOrderId: string): Promise<SalesOrderEntity> {
    if (this.mockMode) {
      const order = this.mockSalesOrders.find(o => o.SalesOrderID === salesOrderId);
      if (!order) {
        throw new Error(`Order ${salesOrderId} not found.`);
      }
      order.OverallStatus = 'Completed';
      return order;
    }

    const token = await this.fetchCsrfToken();
    const response = await this.client.post(
      `/SalesOrder('${salesOrderId}')/com.sap.gateway.srvd.zui_salesorder_o4.v0001.setOrderCompleted`,
      {},
      {
        headers: {
          'X-CSRF-Token': token,
          'Cookie': this.cookies.join('; ')
        }
      }
    );

    return response.data;
  }
}
