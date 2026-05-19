import apiClient from './client';

export interface BookData {
  id?: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publishedYear?: number | string;
  edition?: string;
  category?: string;
  subCategory?: string;
  language?: string;
  type?: string;
  condition?: string;
  price?: number | string;
  description?: string;
  totalCopies: number | string;
  availableCopies?: number | string;
  location?: string;
  shelfLocation?: string;
  shelf?: string;
  status?: string;
}

export interface IssueBookInput {
  bookId: string;
  borrowerId?: string;
  borrowerType?: 'STUDENT' | 'TEACHER' | 'STAFF' | string;
  studentId?: string;
  dueDate?: string;
  remarks?: string;
}

export interface ReserveBookInput {
  bookId: string;
  borrowerId: string;
  borrowerType: 'STUDENT' | 'TEACHER' | 'STAFF';
}

export interface InventoryItemData {
  id?: string;
  name?: string;
  sku?: string;
  itemCode?: string;
  category?: string;
  unit?: string;
  unitPrice?: number | string;
  quantity?: number | string;
  minQuantity?: number | string;
  minStockLevel?: number | string;
  location?: string;
  description?: string;
}

export interface InventoryMovementData {
  itemId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE';
  quantity: number;
  unitPrice?: number;
  reference?: string;
  remarks?: string;
  issuedToId?: string;
}

export interface ResourceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  borrowerId?: string;
  bookId?: string;
  studentId?: string;
  itemId?: string;
  movementType?: string;
  startDate?: string;
  endDate?: string;
}

export const libraryAPI = {
  getBooks: async (params?: ResourceQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/library/books', { params });
    return data;
  },

  getBook: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/library/books/${id}`);
    return data;
  },

  createBook: async (bookData: BookData): Promise<any> => {
    const { data } = await apiClient.post('/library/books', bookData);
    return data;
  },

  updateBook: async (id: string, updates: Partial<BookData>): Promise<any> => {
    const { data } = await apiClient.put(`/library/books/${id}`, updates);
    return data;
  },

  issueBook: async (issueData: IssueBookInput): Promise<any> => {
    const { data } = await apiClient.post('/library/issue', issueData);
    return data;
  },

  returnBook: async (returnData: { issueId: string; conditionOnReturn?: string; remarks?: string }): Promise<any> => {
    const { data } = await apiClient.post('/library/return', returnData);
    return data;
  },

  renewBook: async (renewData: { issueId: string; newDueDate?: string }): Promise<any> => {
    const { data } = await apiClient.post('/library/renew', renewData);
    return data;
  },

  reserveBook: async (reserveData: ReserveBookInput): Promise<any> => {
    const { data } = await apiClient.post('/library/reserve', reserveData);
    return data;
  },

  getReservations: async (params?: ResourceQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/library/reservations', { params });
    return data;
  },

  getIssues: async (params?: ResourceQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/library/issues', { params });
    return data;
  },

  getOverdue: async (): Promise<any> => {
    const { data } = await apiClient.get('/library/overdue');
    return data;
  },
};

export const inventoryAPI = {
  getItems: async (params?: ResourceQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/inventory/items', { params });
    return data;
  },

  getItem: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/inventory/items/${id}`);
    return data;
  },

  createItem: async (itemData: InventoryItemData): Promise<any> => {
    const { data } = await apiClient.post('/inventory/items', itemData);
    return data;
  },

  updateItem: async (id: string, updates: Partial<InventoryItemData>): Promise<any> => {
    const { data } = await apiClient.put(`/inventory/items/${id}`, updates);
    return data;
  },

  recordMovement: async (movementData: InventoryMovementData): Promise<any> => {
    const { data } = await apiClient.post('/inventory/movements', movementData);
    return data;
  },

  getMovements: async (params?: ResourceQueryParams): Promise<any> => {
    const { data } = await apiClient.get('/inventory/movements', { params });
    return data;
  },

  getLowStock: async (): Promise<any> => {
    const { data } = await apiClient.get('/inventory/low-stock');
    return data;
  },

  getSummary: async (): Promise<any> => {
    const { data } = await apiClient.get('/inventory/summary');
    return data;
  },
};
