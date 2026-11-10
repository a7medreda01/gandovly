import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../../core/models/models';
import { InvoiceService } from '../../../core/services/invoice.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StoreDialogDirective } from '../../directives/store-dialog.directive';

@Component({
  selector: 'app-invoice-modal',
  standalone: true,
  imports: [CommonModule, StoreDialogDirective],
  templateUrl: './invoice-modal.component.html',
  styleUrl: './invoice-modal.component.scss'
})
export class InvoiceModalComponent implements OnChanges {
  readonly invoiceService = inject(InvoiceService);
  private readonly toast = inject(NotificationService);

  @Input() order: Order | null = null;
  @Output() close = new EventEmitter<void>();

  imageDataUrl = signal<string | null>(null);
  isGeneratingImage = signal<boolean>(false);
  activeTab = signal<'card' | 'image'>('card');
  copied = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['order'] && this.order) {
      this.generatePreviewImage();
    }
  }

  async generatePreviewImage() {
    if (!this.order) return;
    try {
      this.isGeneratingImage.set(true);
      const url = await this.invoiceService.generateInvoiceImage(this.order);
      this.imageDataUrl.set(url);
    } catch (e) {
      console.error('Failed to generate invoice image:', e);
    } finally {
      this.isGeneratingImage.set(false);
    }
  }

  onPrint() {
    if (!this.order) return;
    this.invoiceService.printInvoice(this.order);
    this.toast.info('تم إرسال أمر طباعة البون بنجاح');
  }

  async onShare() {
    if (!this.order) return;
    await this.invoiceService.shareInvoice(this.order);
  }

  onWhatsApp() {
    if (!this.order) return;
    this.invoiceService.openWhatsAppShare(this.order);
  }

  async onDownload() {
    if (!this.order) return;
    try {
      await this.invoiceService.downloadInvoiceImage(this.order);
      this.toast.success('تم تحميل صورة الفاتورة بنجاح');
    } catch {
      this.toast.error('حدث خطأ أثناء تحميل الصورة');
    }
  }

  async onCopyText() {
    if (!this.order) return;
    const text = this.invoiceService.buildWhatsAppText(this.order);
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
      this.toast.success('تم نسخ نص الفاتورة للحافظة');
      setTimeout(() => this.copied.set(false), 2500);
    } catch {
      this.toast.error('تعذر النسخ إلى الحافظة');
    }
  }

  onClose() {
    this.close.emit();
  }
}

