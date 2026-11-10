import { Injectable, inject } from '@angular/core';
import { SettingsService } from './settings.service';
import { Order, OrderLine } from '../models/models';
import { formatEgyptDateTime } from '../../shared/utils/date-utils';

export interface InvoiceSharePayload {
  order: Order;
  imageDataUrl?: string;
  blob?: Blob;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly settingsService = inject(SettingsService);

  get storeName(): string {
    return this.settingsService.settings().restaurantName || 'المتجر';
  }

  get storeTagline(): string {
    return this.settingsService.settings().tagline || 'متجرك الإلكتروني المفضل';
  }

  get storePhone(): string {
    return this.settingsService.settings().phone || '';
  }

  get storeAddress(): string {
    return this.settingsService.settings().address || '';
  }

  get currencySymbol(): string {
    return this.settingsService.settings().currencySymbol || 'ج.م';
  }

  getOrderTotal(order: Order): number {
    return Number(order.finalTotal ?? order.estimatedTotal ?? 0);
  }

  getOrderSubtotal(order: Order): number {
    return Number(order.finalSubtotal ?? order.estimatedSubtotal ?? 0);
  }

  getStatusLabel(status: string): string {
    const map: { [key: string]: string } = {
      Pending: 'قيد المراجعة',
      Confirmed: 'تم التأكيد',
      Preparing: 'قيد التجهيز',
      ReadyForPickup: 'جاهز للاستلام',
      OutForDelivery: 'خرج للتوصيل',
      Completed: 'مكتمل ومسَلَّم',
      Cancelled: 'ملغي',
      Rejected: 'مرفوض'
    };
    return map[status] || status;
  }

  getOrderTypeLabel(type: string): string {
    return type === 'Pickup' ? 'استلام من الفرع' : 'توصيل منزلي';
  }

  getPaymentMethodLabel(method: string): string {
    const map: { [key: string]: string } = {
      CashOnDelivery: 'الدفع عند الاستلام',
      CardOnDelivery: 'بطاقة عند الاستلام',
      OnlineCard: 'دفع إلكتروني',
      InstaPay: 'انستاباي / تحويل بنكي',
      VodafoneCash: 'فودافون كاش / محفظة إلكترونية'
    };
    return map[method] || 'الدفع عند الاستلام';
  }

  /**
   * Generates a thermal receipt HTML and prints it via an isolated hidden iframe
   */
  printInvoice(order: Order): void {
    if (typeof window === 'undefined') return;

    const store = this.settingsService.settings();
    const storeName = this.storeName;
    const storeTagline = this.storeTagline;
    const storePhone = this.storePhone;
    const storeAddress = this.storeAddress;
    const currency = this.currencySymbol;
    const orderTotal = this.getOrderTotal(order);
    const orderSubtotal = this.getOrderSubtotal(order);
    const dateFormatted = formatEgyptDateTime(order.createdAt);
    const orderType = this.getOrderTypeLabel(order.orderType);
    const paymentMethod = this.getPaymentMethodLabel(order.paymentMethod);
    const statusLabel = this.getStatusLabel(order.status);
    const customerAddress = order.deliveryAddress || order.deliveryZoneName || (order.orderType === 'Pickup' ? 'استلام من الفرع' : '-');

    const linesHtml = order.orderLines.map((line, index) => {
      const lineTotal = Number(line.finalLineTotal ?? line.estimatedLineTotal ?? (line.unitPriceSnapshot * line.quantityUnits));
      const prep = line.preparationOptionNameAr ? `<div class="item-sub">طريقة التجهيز: ${line.preparationOptionNameAr}</div>` : '';
      const weight = line.actualWeightGrams
        ? `<div class="item-sub">الوزن الفعلي: ${line.actualWeightGrams} جم</div>`
        : (line.estimatedWeightGrams ? `<div class="item-sub">الوزن التقديري: ${line.estimatedWeightGrams} جم</div>` : '');
      const modifiers = line.modifiers && line.modifiers.length > 0
        ? `<div class="item-sub">+ ${line.modifiers.map(m => m.modifierOptionNameAr).join(', ')}</div>`
        : '';

      return `
        <tr>
          <td class="col-num">${index + 1}</td>
          <td class="col-name">
            <strong>${line.productNameAr}</strong>
            ${prep}
            ${weight}
            ${modifiers}
          </td>
          <td class="col-qty">${line.quantityUnits}</td>
          <td class="col-price">${line.unitPriceSnapshot.toFixed(2)}</td>
          <td class="col-total">${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const deliveryRow = order.deliveryFee > 0
      ? `<tr><td colspan="4" class="text-start">رسوم التوصيل:</td><td class="text-end">${Number(order.deliveryFee).toFixed(2)} ${currency}</td></tr>`
      : '';

    const discountRow = order.discountAmount > 0
      ? `<tr><td colspan="4" class="text-start">الخصم:</td><td class="text-end text-danger">- ${Number(order.discountAmount).toFixed(2)} ${currency}</td></tr>`
      : '';

    const notesRow = order.notes
      ? `<div class="receipt-notes"><strong>ملاحظات العميل:</strong> ${order.notes}</div>`
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>فاتورة طلب #${order.orderNumber} - ${storeName}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 2mm 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
            font-size: 12px;
            color: #000000;
            background: #ffffff;
            direction: rtl;
            width: 78mm;
            max-width: 78mm;
            margin: 0 auto;
            padding: 4mm 3mm;
            line-height: 1.35;
          }
          .receipt-header {
            text-align: center;
            padding-bottom: 6px;
            border-bottom: 2px dashed #000;
            margin-bottom: 6px;
          }
          .store-title {
            font-size: 18px;
            font-weight: 900;
            letter-spacing: -0.5px;
            margin-bottom: 2px;
          }
          .store-subtitle {
            font-size: 11px;
            color: #333;
            margin-bottom: 4px;
          }
          .store-contact {
            font-size: 10.5px;
            color: #222;
          }
          .receipt-badge {
            margin: 6px 0;
            text-align: center;
            background: #000;
            color: #fff;
            padding: 4px 6px;
            font-size: 13px;
            font-weight: 800;
            border-radius: 4px;
            letter-spacing: 0.5px;
          }
          .receipt-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2px 8px;
            font-size: 10.5px;
            padding-bottom: 6px;
            border-bottom: 1px dashed #000;
            margin-bottom: 6px;
          }
          .meta-item {
            display: flex;
            justify-content: space-between;
          }
          .meta-lbl {
            color: #555;
          }
          .meta-val {
            font-weight: 700;
          }
          .customer-box {
            padding: 4px 0;
            font-size: 11px;
            border-bottom: 1px dashed #000;
            margin-bottom: 6px;
          }
          .customer-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 6px;
          }
          .items-table th {
            border-bottom: 1px solid #000;
            border-top: 1px solid #000;
            padding: 4px 2px;
            font-weight: 800;
            text-align: right;
          }
          .items-table td {
            padding: 4px 2px;
            vertical-align: top;
            border-bottom: 1px dotted #ccc;
          }
          .col-num { width: 14px; text-align: center; }
          .col-name { width: auto; }
          .col-qty { width: 22px; text-align: center; font-weight: 700; }
          .col-price { width: 42px; text-align: left; }
          .col-total { width: 48px; text-align: left; font-weight: 700; }
          .item-sub {
            font-size: 9.5px;
            color: #444;
            margin-top: 1px;
          }
          .summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11.5px;
            margin-top: 4px;
          }
          .summary-table td {
            padding: 2px 0;
          }
          .text-start { text-align: right; }
          .text-end { text-align: left; font-weight: 700; }
          .text-danger { color: #000; }
          .total-box {
            margin-top: 6px;
            padding: 6px 4px;
            border: 2px solid #000;
            background: #f4f4f4;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 15px;
            font-weight: 900;
          }
          .receipt-notes {
            margin-top: 6px;
            padding: 4px;
            border: 1px dashed #777;
            font-size: 10px;
            background: #fafafa;
          }
          .receipt-footer {
            margin-top: 8px;
            padding-top: 6px;
            border-top: 2px dashed #000;
            text-align: center;
            font-size: 10px;
            color: #333;
          }
          .barcode-mock {
            margin: 6px auto;
            letter-spacing: 4px;
            font-family: monospace;
            font-weight: bold;
            font-size: 12px;
          }
          @media print {
            body {
              width: 100%;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <div class="store-title">${storeName}</div>
          ${storeTagline ? `<div class="store-subtitle">${storeTagline}</div>` : ''}
          ${storePhone ? `<div class="store-contact">هاتف: ${storePhone}</div>` : ''}
          ${storeAddress ? `<div class="store-contact">${storeAddress}</div>` : ''}
        </div>

        <div class="receipt-badge">
          فاتورة طلب #${order.orderNumber}
        </div>

        <div class="receipt-meta-grid">
          <div class="meta-item"><span class="meta-lbl">التاريخ:</span><span class="meta-val">${dateFormatted}</span></div>
          <div class="meta-item"><span class="meta-lbl">النوع:</span><span class="meta-val">${orderType}</span></div>
          <div class="meta-item"><span class="meta-lbl">الدفع:</span><span class="meta-val">${paymentMethod}</span></div>
          <div class="meta-item"><span class="meta-lbl">الحالة:</span><span class="meta-val">${statusLabel}</span></div>
        </div>

        <div class="customer-box">
          <div class="customer-row"><span>العميل:</span><strong>${order.customerName || 'عميل'}</strong></div>
          <div class="customer-row"><span>الهاتف:</span><strong dir="ltr">${order.customerPhone || '-'}</strong></div>
          <div class="customer-row"><span>العنوان:</span><strong>${customerAddress}</strong></div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th class="col-num">#</th>
              <th class="col-name">الصنف</th>
              <th class="col-qty">العدد</th>
              <th class="col-price">السعر</th>
              <th class="col-total">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${linesHtml}
          </tbody>
        </table>

        <table class="summary-table">
          <tr>
            <td colspan="4" class="text-start">المجموع الفرعي:</td>
            <td class="text-end">${orderSubtotal.toFixed(2)} ${currency}</td>
          </tr>
          ${deliveryRow}
          ${discountRow}
        </table>

        <div class="total-box">
          <span>الإجمالي المطلوب:</span>
          <span>${orderTotal.toFixed(2)} ${currency}</span>
        </div>

        ${notesRow}

        <div class="receipt-footer">
          <div class="barcode-mock">*MC-${order.orderNumber}*</div>
          <div>شكراً لتعاملكم واختياركم لنا ❤️</div>
          <div style="font-size: 9px; color: #666; margin-top: 2px;">تم إصدار الفاتورة إلكترونياً عبر MeCart</div>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    // Create hidden iframe to trigger print cleanly
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print iframe error:', e);
        }
        setTimeout(() => {
          iframe.remove();
        }, 3000);
      }, 400);
    }
  }

  /**
   * Generates a high-resolution, beautifully designed PNG image of the invoice using HTML5 Canvas.
   */
  async generateInvoiceImage(order: Order): Promise<string> {
    const canvas = await this.renderInvoiceToCanvas(order);
    return canvas.toDataURL('image/png');
  }

  /**
   * Generates a Blob of the invoice image for sharing or saving
   */
  async generateInvoiceBlob(order: Order): Promise<Blob> {
    const canvas = await this.renderInvoiceToCanvas(order);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob failed'));
      }, 'image/png');
    });
  }

  /**
   * Downloads the invoice image to the user's device
   */
  async downloadInvoiceImage(order: Order): Promise<void> {
    const dataUrl = await this.generateInvoiceImage(order);
    const link = document.createElement('a');
    link.download = `فاتورة-طلب-${order.orderNumber}.png`;
    link.href = dataUrl;
    link.click();
  }

  /**
   * Shares the invoice using native Web Share API (with file) or opens fallback
   */
  async shareInvoice(order: Order): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const blob = await this.generateInvoiceBlob(order);
        const file = new File([blob], `فاتورة-طلب-${order.orderNumber}.png`, { type: 'image/png' });
        const textSummary = this.buildWhatsAppText(order);

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `فاتورة طلب #${order.orderNumber} - ${this.storeName}`,
            text: textSummary,
            files: [file]
          });
          return true;
        } else {
          await navigator.share({
            title: `فاتورة طلب #${order.orderNumber} - ${this.storeName}`,
            text: textSummary
          });
          return true;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return false; // user cancelled share sheet
        console.warn('Native share failed, fallback to whatsapp', err);
      }
    }

    // Fallback: Open WhatsApp share
    this.openWhatsAppShare(order);
    return true;
  }

  /**
   * Builds rich, formatted WhatsApp text for the invoice
   */
  buildWhatsAppText(order: Order): string {
    const storeName = this.storeName;
    const currency = this.currencySymbol;
    const total = this.getOrderTotal(order);
    const subtotal = this.getOrderSubtotal(order);
    const orderType = this.getOrderTypeLabel(order.orderType);
    const dateFormatted = formatEgyptDateTime(order.createdAt);
    const address = order.deliveryAddress || order.deliveryZoneName || (order.orderType === 'Pickup' ? 'استلام من الفرع' : '');

    let msg = `🧾 *فاتورة مبيعات - طلب #${order.orderNumber}*\n`;
    msg += `🏪 *${storeName}*\n`;
    msg += `📅 *التاريخ:* ${dateFormatted}\n`;
    msg += `👤 *العميل:* ${order.customerName || 'عميل كريم'}\n`;
    if (order.customerPhone) msg += `📱 *الهاتف:* ${order.customerPhone}\n`;
    msg += `🚚 *النوع:* ${orderType}\n`;
    if (address) msg += `📍 *العنوان:* ${address}\n`;
    msg += `──────────────────\n`;
    msg += `📦 *تفاصيل الأصناف:*\n`;

    order.orderLines.forEach((line, i) => {
      const lineTotal = Number(line.finalLineTotal ?? line.estimatedLineTotal ?? (line.unitPriceSnapshot * line.quantityUnits));
      msg += `${i + 1}. *${line.productNameAr}*\n`;
      msg += `   └ الكمية: ${line.quantityUnits} × ${line.unitPriceSnapshot.toFixed(2)} = *${lineTotal.toFixed(2)} ${currency}*\n`;
      if (line.actualWeightGrams) msg += `   └ الوزن الفعلي: ${line.actualWeightGrams} جم\n`;
      if (line.preparationOptionNameAr) msg += `   └ التجهيز: ${line.preparationOptionNameAr}\n`;
    });

    msg += `──────────────────\n`;
    msg += `💰 *المجموع الفرعي:* ${subtotal.toFixed(2)} ${currency}\n`;
    if (order.deliveryFee > 0) {
      msg += `🛵 *رسوم التوصيل:* ${Number(order.deliveryFee).toFixed(2)} ${currency}\n`;
    }
    if (order.discountAmount > 0) {
      msg += `🏷️ *الخصم:* -${Number(order.discountAmount).toFixed(2)} ${currency}\n`;
    }
    msg += `✨ *الإجمالي النهائي:* *${total.toFixed(2)} ${currency}*\n`;
    msg += `──────────────────\n`;
    if (order.notes) {
      msg += `📝 *ملاحظات:* ${order.notes}\n`;
      msg += `──────────────────\n`;
    }

    if (typeof window !== 'undefined') {
      const trackingUrl = `${window.location.origin}/track/${order.publicTrackingToken || order.orderNumber}`;
      msg += `🔗 *رابط تتبع الطلب والفاتورة:*\n${trackingUrl}\n\n`;
    }
    msg += `شكراً لتعاملكم واختياركم لنا ❤️`;
    return msg;
  }

  /**
   * Opens WhatsApp with prefilled invoice message to the customer or general share
   */
  openWhatsAppShare(order: Order): void {
    const text = encodeURIComponent(this.buildWhatsAppText(order));
    const rawPhone = (order.customerPhone || '').replace(/\D/g, '');
    let url = '';

    if (rawPhone.length >= 10) {
      // Egyptian numbers: ensure +20 or formatted international
      const intlPhone = rawPhone.startsWith('20') ? rawPhone : (rawPhone.startsWith('0') ? '2' + rawPhone : '20' + rawPhone);
      url = `https://api.whatsapp.com/send?phone=${intlPhone}&text=${text}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${text}`;
    }

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Core 2D Canvas Renderer for the Invoice Image
   */
  private async renderInvoiceToCanvas(order: Order): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const width = 760;
    const currency = this.currencySymbol;
    const storeName = this.storeName;
    const storeTagline = this.storeTagline;
    const storePhone = this.storePhone;
    const storeAddress = this.storeAddress;
    const total = this.getOrderTotal(order);
    const subtotal = this.getOrderSubtotal(order);
    const dateFormatted = formatEgyptDateTime(order.createdAt);
    const orderType = this.getOrderTypeLabel(order.orderType);
    const paymentMethod = this.getPaymentMethodLabel(order.paymentMethod);
    const statusLabel = this.getStatusLabel(order.status);
    const customerAddress = order.deliveryAddress || order.deliveryZoneName || (order.orderType === 'Pickup' ? 'استلام من الفرع' : 'غير محدد');

    // Dynamic height calculation
    const baseHeight = 520;
    const itemHeight = 44;
    const itemsHeight = order.orderLines.length * itemHeight;
    const notesHeight = order.notes ? 60 : 0;
    const totalHeight = baseHeight + itemsHeight + notesHeight;

    canvas.width = width;
    canvas.height = totalHeight;

    // Background - Clean pure white with subtle off-white border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, totalHeight);

    // Decorative top colored bar (Brand Navy + Accent Gradient)
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#0d2b45');
    grad.addColorStop(0.5, '#1b4965');
    grad.addColorStop(1, '#e63946');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, 10);

    // Outer subtle border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, totalHeight - 2);

    ctx.direction = 'rtl';
    ctx.textAlign = 'right';

    let y = 46;

    // Store Name & Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 30px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.fillText(storeName, width - 40, y);

    y += 24;
    if (storeTagline) {
      ctx.fillStyle = '#64748b';
      ctx.font = '600 14px "Cairo", "Segoe UI", Tahoma, sans-serif';
      ctx.fillText(storeTagline, width - 40, y);
      y += 20;
    }

    if (storePhone || storeAddress) {
      ctx.fillStyle = '#475569';
      ctx.font = '13px "Cairo", "Segoe UI", Tahoma, sans-serif';
      const contactText = [storePhone ? `هاتف: ${storePhone}` : '', storeAddress].filter(Boolean).join('  |  ');
      ctx.fillText(contactText, width - 40, y);
      y += 18;
    }

    // Dashed divider
    y += 8;
    this.drawDashedLine(ctx, 40, y, width - 40, y);
    y += 24;

    // Order Badge Pill (Right side) & Date (Left side)
    const badgeText = `فاتورة طلب #${order.orderNumber}`;
    ctx.font = 'bold 18px "Cairo", "Segoe UI", Tahoma, sans-serif';
    const badgeWidth = ctx.measureText(badgeText).width + 30;

    // Draw badge background
    this.roundRect(ctx, width - 40 - badgeWidth, y - 22, badgeWidth, 34, 8, '#0f172a');
    ctx.fillStyle = '#ffffff';
    ctx.fillText(badgeText, width - 55, y);

    // Date & Status on Left
    ctx.textAlign = 'left';
    ctx.font = '600 13px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(dateFormatted, 40, y - 4);
    ctx.fillStyle = '#059669';
    ctx.fillText(`الحالة: ${statusLabel}`, 40, y + 14);

    y += 34;

    // Customer & Order Info Card (Full Width Box)
    ctx.textAlign = 'right';
    const cardHeight = 84;
    this.roundRect(ctx, 40, y, width - 80, cardHeight, 10, '#f8fafc', '#e2e8f0');

    ctx.fillStyle = '#334155';
    ctx.font = '14px "Cairo", "Segoe UI", Tahoma, sans-serif';

    // Col 1 (Right): Customer name and phone
    ctx.fillText(`العميل: ${order.customerName || 'عميل'}`, width - 60, y + 28);
    ctx.fillText(`الهاتف: ${order.customerPhone || '-'}`, width - 60, y + 54);

    // Col 2 (Left): Order type and address
    ctx.fillText(`طريقة الاستلام: ${orderType}`, width / 2 - 20, y + 28);
    const shortAddress = customerAddress.length > 36 ? customerAddress.substring(0, 36) + '...' : customerAddress;
    ctx.fillText(`العنوان: ${shortAddress}`, width / 2 - 20, y + 54);

    y += cardHeight + 20;

    // Items Table Header
    this.roundRect(ctx, 40, y, width - 80, 36, 6, '#f1f5f9');
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px "Cairo", "Segoe UI", Tahoma, sans-serif';

    ctx.fillText('الصنف والمواصفات', width - 60, y + 24);
    ctx.textAlign = 'center';
    ctx.fillText('الكمية', width - 360, y + 24);
    ctx.fillText('سعر الوحدة', width - 480, y + 24);
    ctx.textAlign = 'left';
    ctx.fillText('الإجمالي', 60, y + 24);

    y += 44;

    // Items Rows
    order.orderLines.forEach((line, index) => {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#0f172a';
      ctx.font = '600 14px "Cairo", "Segoe UI", Tahoma, sans-serif';

      let itemName = line.productNameAr;
      if (line.actualWeightGrams) itemName += ` (${line.actualWeightGrams} جم)`;
      if (itemName.length > 30) itemName = itemName.substring(0, 30) + '...';

      ctx.fillText(`${index + 1}. ${itemName}`, width - 60, y + 8);

      // Preparation / modifier subtitle
      if (line.preparationOptionNameAr || (line.modifiers && line.modifiers.length)) {
        ctx.fillStyle = '#64748b';
        ctx.font = '11px "Cairo", "Segoe UI", Tahoma, sans-serif';
        const prepStr = [line.preparationOptionNameAr, line.modifiers?.map(m => m.modifierOptionNameAr).join(', ')].filter(Boolean).join(' - ');
        ctx.fillText(`   └ ${prepStr}`, width - 75, y + 24);
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 14px "Cairo", "Segoe UI", Tahoma, sans-serif';
      ctx.fillText(String(line.quantityUnits), width - 360, y + 14);

      ctx.font = '500 13px "Cairo", "Segoe UI", Tahoma, sans-serif';
      ctx.fillText(`${line.unitPriceSnapshot.toFixed(2)} ${currency}`, width - 480, y + 14);

      ctx.textAlign = 'left';
      ctx.font = 'bold 14px "Cairo", "Segoe UI", Tahoma, sans-serif';
      const lineTotal = Number(line.finalLineTotal ?? line.estimatedLineTotal ?? (line.unitPriceSnapshot * line.quantityUnits));
      ctx.fillText(`${lineTotal.toFixed(2)} ${currency}`, 60, y + 14);

      // Light row divider
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, y + 36);
      ctx.lineTo(width - 40, y + 36);
      ctx.stroke();

      y += itemHeight;
    });

    y += 10;

    // Financial Breakdown
    ctx.textAlign = 'right';
    ctx.font = '14px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('المجموع الفرعي:', width - 460, y + 14);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`${subtotal.toFixed(2)} ${currency}`, 60, y + 14);
    y += 24;

    if (order.deliveryFee > 0) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#475569';
      ctx.fillText('رسوم التوصيل:', width - 460, y + 14);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`${Number(order.deliveryFee).toFixed(2)} ${currency}`, 60, y + 14);
      y += 24;
    }

    if (order.discountAmount > 0) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#e11d48';
      ctx.fillText('الخصم:', width - 460, y + 14);
      ctx.textAlign = 'left';
      ctx.fillText(`- ${Number(order.discountAmount).toFixed(2)} ${currency}`, 60, y + 14);
      y += 24;
    }

    // Grand Total Highlight Box
    y += 8;
    this.roundRect(ctx, 40, y, width - 80, 52, 10, '#0d2b45');

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.fillText('الإجمالي النهائي المطلوب:', width - 65, y + 33);

    ctx.textAlign = 'left';
    ctx.font = '900 22px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${total.toFixed(2)} ${currency}`, 65, y + 34);

    y += 66;

    // Notes (if present)
    if (order.notes) {
      this.roundRect(ctx, 40, y, width - 80, 44, 8, '#fffbeb', '#fde68a');
      ctx.textAlign = 'right';
      ctx.fillStyle = '#92400e';
      ctx.font = '600 13px "Cairo", "Segoe UI", Tahoma, sans-serif';
      ctx.fillText(`ملاحظات العميل: ${order.notes}`, width - 55, y + 27);
      y += 56;
    }

    // Footer
    this.drawDashedLine(ctx, 40, y, width - 40, y);
    y += 22;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.fillText('شكراً لتعاملكم واختياركم لنا ❤️', width / 2, y);

    y += 18;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.fillText('فاتورة رسمية صادرة إلكترونياً من متجر MeCart المعتمد', width / 2, y);

    return canvas;
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fillColor?: string,
    strokeColor?: string
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.stroke();
    }
  }

  private drawDashedLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }
}

