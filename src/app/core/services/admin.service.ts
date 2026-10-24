import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import {
  DashboardStats,
  DeliveryZone,
  MenuCategory,
  Order,
  OrderStatus,
  PagedResult,
  PreparationOption,
  PreparationOptionGroup,
  ModifierGroup,
  Product,
  ProductImage,
  SalesReport,
  StorefrontSettings,
  WeightVarianceReport,
  WhatsAppGatewaySettings,
  VisitAnalytics
} from '../models/models';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  // Settings
  getSettings() {
    return this.api.get<StorefrontSettings>('admin/settings');
  }

  updateSettings(dto: Partial<StorefrontSettings>) {
    return this.api.put<StorefrontSettings>('admin/settings', dto);
  }

  // Catalog Categories
  getCategories() {
    return this.api.get<MenuCategory[]>('admin/catalog/categories');
  }

  createCategory(dto: any) {
    return this.api.post<MenuCategory>('admin/catalog/categories', dto);
  }

  updateCategory(id: number, dto: any) {
    return this.api.put<MenuCategory>(`admin/catalog/categories/${id}`, dto);
  }

  deleteCategory(id: number) {
    return this.api.delete<boolean>(`admin/catalog/categories/${id}`);
  }

  // Catalog Products
  getProducts(categoryId?: number) {
    return this.api.get<Product[]>('admin/catalog/products', { categoryId });
  }

  createProduct(dto: any) {
    return this.api.post<Product>('admin/catalog/products', dto);
  }

  updateProduct(id: number, dto: any) {
    return this.api.put<Product>(`admin/catalog/products/${id}`, dto);
  }

  toggleProductAvailability(id: number, isAvailable: boolean) {
    return this.api.patch<boolean>(`admin/catalog/products/${id}/availability`, isAvailable);
  }

  deleteProduct(id: number) {
    return this.api.delete<boolean>(`admin/catalog/products/${id}`);
  }

  addProductImage(productId: number, imageUrl: string, isPrimary = false) {
    return this.api.post<ProductImage>(`admin/catalog/products/${productId}/images`, { imageUrl, isPrimary });
  }

  deleteProductImage(productId: number, imageId: number) {
    return this.api.delete<boolean>(`admin/catalog/products/${productId}/images/${imageId}`);
  }

  setPrimaryProductImage(productId: number, imageId: number) {
    return this.api.put<boolean>(`admin/catalog/products/${productId}/images/${imageId}/primary`, {});
  }

  getPreparationGroups() {
    return this.api.get<PreparationOptionGroup[]>('admin/catalog/preparation-groups');
  }

  createPreparationOption(groupId: number, dto: { nameAr: string; nameEn?: string; price: number; displayOrder?: number }) {
    return this.api.post<PreparationOption>(`admin/catalog/preparation-groups/${groupId}/options`, dto);
  }

  updatePreparationOption(id: number, dto: { nameAr: string; nameEn?: string; price: number; isAvailable?: boolean; displayOrder?: number }) {
    return this.api.put<PreparationOption>(`admin/catalog/preparation-options/${id}`, dto);
  }

  deletePreparationOption(id: number) {
    return this.api.delete<boolean>(`admin/catalog/preparation-options/${id}`);
  }

  getModifierGroups() {
    return this.api.get<ModifierGroup[]>('admin/catalog/modifier-groups');
  }

  // Delivery Zones
  getDeliveryZones() {
    return this.api.get<DeliveryZone[]>('admin/delivery-zones');
  }

  createDeliveryZone(dto: any) {
    return this.api.post<DeliveryZone>('admin/delivery-zones', dto);
  }

  updateDeliveryZone(id: number, dto: any) {
    return this.api.put<DeliveryZone>(`admin/delivery-zones/${id}`, dto);
  }

  deleteDeliveryZone(id: number) {
    return this.api.delete<boolean>(`admin/delivery-zones/${id}`);
  }

  // Orders
  getOrders(status?: OrderStatus, fromDate?: string, toDate?: string, searchTerm?: string, pageIndex = 1, pageSize = 20) {
    return this.api.get<PagedResult<Order>>('admin/orders', {
      status,
      fromDate,
      toDate,
      searchTerm,
      pageIndex,
      pageSize
    });
  }

  getOrderById(id: number) {
    return this.api.get<Order>(`admin/orders/${id}`);
  }

  getKitchenOrders() {
    return this.api.get<Order[]>('admin/orders/kitchen');
  }

  updateOrderStatus(orderId: number, newStatus: OrderStatus, note?: string, changedBy = 'المسؤول') {
    return this.api.put<Order>(`admin/orders/${orderId}/status`, { newStatus, note, changedBy });
  }

  updateActualWeights(orderId: number, items: { orderLineId: number; actualWeightGrams: number; quantityUnits?: number }[], updatedBy = 'المطبخ', reasonOrNotes?: string) {
    return this.api.put<Order>(`admin/orders/${orderId}/actual-weights`, { items, updatedBy, reasonOrNotes });
  }

  resendNotification(orderId: number) {
    return this.api.post<boolean>(`admin/orders/${orderId}/resend-notification`, {});
  }

  // Reports
  getDashboardStats() {
    return this.api.get<DashboardStats>('admin/reports/dashboard');
  }

  getSalesReport(fromDate?: string, toDate?: string) {
    return this.api.get<SalesReport>('admin/reports/sales', { fromDate, toDate });
  }

  getWeightVarianceReport(fromDate?: string, toDate?: string) {
    return this.api.get<WeightVarianceReport[]>('admin/reports/weight-variance', { fromDate, toDate });
  }

  // Local WhatsApp Gateway Settings
  getGatewaySettings() {
    return this.api.get<WhatsAppGatewaySettings>('admin/notifications/gateway-settings');
  }

  updateGatewaySettings(dto: WhatsAppGatewaySettings) {
    return this.api.put<WhatsAppGatewaySettings>('admin/notifications/gateway-settings', dto);
  }

  sendTestNotification(recipientPhone: string, messageText: string) {
    return this.api.post<boolean>('admin/notifications/test', { recipientPhone, messageText });
  }

  // Local WhatsApp Gateway & Multi-Session Accounts
  getWhatsAppAccounts(): Observable<any> {
    return this.api.get<any>('admin/whatsapp/accounts');
  }

  createWhatsAppAccount(data: { displayName: string; sessionId?: string }): Observable<any> {
    return this.api.post<any>('admin/whatsapp/accounts', data);
  }

  getWhatsAppAccountQr(sessionId: string): Observable<any> {
    return this.api.get<any>(`admin/whatsapp/accounts/${sessionId}/qr`);
  }

  requestWhatsAppAccountPairCode(sessionId: string, phoneNumber: string): Observable<any> {
    return this.api.post<any>(`admin/whatsapp/accounts/${sessionId}/pair-code`, { phoneNumber });
  }

  setDefaultWhatsAppAccount(sessionId: string): Observable<any> {
    return this.api.post<any>(`admin/whatsapp/accounts/${sessionId}/set-default`, {});
  }

  logoutWhatsAppAccount(sessionId: string): Observable<any> {
    return this.api.post<any>(`admin/whatsapp/accounts/${sessionId}/logout`, {});
  }

  restartWhatsAppAccount(sessionId: string): Observable<any> {
    return this.api.post<any>(`admin/whatsapp/accounts/${sessionId}/restart`, {});
  }

  deleteWhatsAppAccount(sessionId: string): Observable<any> {
    return this.api.delete<any>(`admin/whatsapp/accounts/${sessionId}`);
  }

  getWhatsAppStatus(sessionId?: string) {
    const url = sessionId ? `admin/whatsapp/status?sessionId=${encodeURIComponent(sessionId)}` : 'admin/whatsapp/status';
    return this.api.get<any>(url);
  }

  getWhatsAppQr(sessionId?: string) {
    const url = sessionId ? `admin/whatsapp/qr?sessionId=${encodeURIComponent(sessionId)}` : 'admin/whatsapp/qr';
    return this.api.get<any>(url);
  }

  requestWhatsAppPairCode(phoneNumber: string, sessionId?: string) {
    const url = sessionId ? `admin/whatsapp/pair-code?sessionId=${encodeURIComponent(sessionId)}` : 'admin/whatsapp/pair-code';
    return this.api.post<any>(url, { phoneNumber });
  }

  logoutWhatsApp(sessionId?: string) {
    const url = sessionId ? `admin/whatsapp/logout?sessionId=${encodeURIComponent(sessionId)}` : 'admin/whatsapp/logout';
    return this.api.post<any>(url, {});
  }

  restartWhatsApp(sessionId?: string) {
    const url = sessionId ? `admin/whatsapp/restart?sessionId=${encodeURIComponent(sessionId)}` : 'admin/whatsapp/restart';
    return this.api.post<any>(url, {});
  }

  sendWhatsAppTestMessage(recipientPhone: string, messageText: string, sessionId?: string) {
    return this.api.post<any>('admin/whatsapp/test-send', { recipientPhone, messageText, sessionId });
  }

  // WhatsApp Marketing Campaigns & Sheets
  previewContactsSheet(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: boolean; data: any; message: string }>(`${this.api.baseUrl}/admin/whatsapp-campaigns/preview-sheet`, formData)
      .pipe(map(res => res.data));
  }

  importContactsSheet(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: boolean; data: any; message: string }>(`${this.api.baseUrl}/admin/whatsapp-campaigns/import-sheet`, formData)
      .pipe(map(res => res.data));
  }

  getMarketingContacts(page = 1, pageSize = 50, search = ''): Observable<any> {
    return this.api.get<any>(`admin/whatsapp-campaigns/contacts?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`);
  }

  getContactsStats(): Observable<any> {
    return this.api.get<any>('admin/whatsapp-campaigns/contacts/stats');
  }

  createWhatsAppCampaign(req: any): Observable<any> {
    return this.api.post<any>('admin/whatsapp-campaigns', req);
  }

  getWhatsAppCampaigns(): Observable<any[]> {
    return this.api.get<any[]>('admin/whatsapp-campaigns');
  }

  getWhatsAppCampaignDetails(campaignId: number): Observable<any> {
    return this.api.get<any>(`admin/whatsapp-campaigns/${campaignId}`);
  }

  getWhatsAppDashboardStats(): Observable<any> {
    return this.api.get<any>('admin/whatsapp-campaigns/dashboard');
  }

  syncWebCustomers(): Observable<any> {
    return this.api.post<any>('admin/whatsapp-campaigns/sync-web-customers', {});
  }

  updateWhatsAppCampaign(campaignId: number, req: any): Observable<any> {
    return this.api.put<any>(`admin/whatsapp-campaigns/${campaignId}`, req);
  }

  pauseWhatsAppCampaign(campaignId: number): Observable<boolean> {
    return this.api.put<boolean>(`admin/whatsapp-campaigns/${campaignId}/pause`, {});
  }

  resumeWhatsAppCampaign(campaignId: number): Observable<boolean> {
    return this.api.put<boolean>(`admin/whatsapp-campaigns/${campaignId}/resume`, {});
  }

  cancelWhatsAppCampaign(campaignId: number): Observable<boolean> {
    return this.api.delete<boolean>(`admin/whatsapp-campaigns/${campaignId}`);
  }

  getPostDeliverySettings(): Observable<any> {
    return this.api.get<any>('admin/whatsapp-campaigns/post-delivery-settings');
  }

  updatePostDeliverySettings(settings: any): Observable<any> {
    return this.api.put<any>('admin/whatsapp-campaigns/post-delivery-settings', settings);
  }

  // Traffic & Visits Analytics
  getVisitAnalytics(timeRange = 'week'): Observable<VisitAnalytics> {
    return this.api.get<VisitAnalytics>('admin/analytics/visits', { timeRange });
  }

  clearSimulatedVisits(): Observable<boolean> {
    return this.api.post<boolean>('admin/analytics/clear-simulated', {});
  }

  // Upload Media
  uploadImage(file: File, folder = 'general'): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    return this.http.post<{ success: boolean; data: string; message: string }>(`${this.api.baseUrl}/admin/media/upload`, formData)
      .pipe(map((res: { success: boolean; data: string; message: string }) => res.data));
  }
}

