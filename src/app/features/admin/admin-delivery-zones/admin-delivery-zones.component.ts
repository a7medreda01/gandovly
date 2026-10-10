import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DeliveryZone } from '../../../core/models/models';

import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-admin-delivery-zones',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingStateComponent],
  templateUrl: './admin-delivery-zones.component.html',
  styleUrl: './admin-delivery-zones.component.scss'
})
export class AdminDeliveryZonesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(NotificationService);

  zones = signal<DeliveryZone[]>([]);
  isLoading = signal<boolean>(false);
  searchQuery = signal<string>('');

  filteredZones = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.zones();
    if (!q) return list;
    return list.filter(z =>
      (z.name && z.name.toLowerCase().includes(q)) ||
      (z.city && z.city.toLowerCase().includes(q)) ||
      (z.parentZoneName && z.parentZoneName.toLowerCase().includes(q)) ||
      (z.neighborhoodKeywords && z.neighborhoodKeywords.toLowerCase().includes(q))
    );
  });

  showZoneModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);

  zoneForm = {
    id: 0,
    name: '',
    city: 'الجيزة',
    parentZoneId: null as number | null,
    level: 'Sub' as 'Macro' | 'Sub' | 'Micro',
    neighborhoodKeywords: '',
    deliveryFee: 25,
    minimumOrder: 50,
    estimatedDeliveryTimeMinutes: 45,
    isActive: true,
    displayOrder: 1
  };

  ngOnInit() {
    this.loadZones();
  }

  loadZones() {
    this.isLoading.set(true);
    this.adminService.getDeliveryZones().subscribe(z => {
      this.zones.set(z || []);
      this.isLoading.set(false);
    });
  }

  openNewZoneModal() {
    this.isEditing.set(false);
    this.zoneForm = {
      id: 0,
      name: '',
      city: 'الجيزة',
      parentZoneId: null,
      level: 'Micro',
      neighborhoodKeywords: '',
      deliveryFee: 25,
      minimumOrder: 50,
      estimatedDeliveryTimeMinutes: 45,
      isActive: true,
      displayOrder: this.zones().length + 1
    };
    this.showZoneModal.set(true);
  }

  openEditZoneModal(zone: DeliveryZone) {
    this.isEditing.set(true);
    this.zoneForm = {
      id: zone.id,
      name: zone.name,
      city: zone.city,
      parentZoneId: zone.parentZoneId || null,
      level: zone.level || 'Sub',
      neighborhoodKeywords: zone.neighborhoodKeywords,
      deliveryFee: zone.deliveryFee,
      minimumOrder: zone.minimumOrder,
      estimatedDeliveryTimeMinutes: zone.estimatedDeliveryTimeMinutes,
      isActive: zone.isActive,
      displayOrder: zone.displayOrder
    };
    this.showZoneModal.set(true);
  }

  saveZone() {
    if (!this.zoneForm.name.trim()) {
      this.toast.error('يرجى إدخال اسم المنطقة.');
      return;
    }

    if (this.isEditing()) {
      this.adminService.updateDeliveryZone(this.zoneForm.id, this.zoneForm).subscribe({
        next: () => {
          this.toast.success('تم تعديل منطقة التوصيل بنجاح.');
          this.showZoneModal.set(false);
          this.loadZones();
        }
      });
    } else {
      this.adminService.createDeliveryZone(this.zoneForm).subscribe({
        next: () => {
          this.toast.success('تم إضافة منطقة التوصيل بنجاح.');
          this.showZoneModal.set(false);
          this.loadZones();
        }
      });
    }
  }

  deleteZone(zone: DeliveryZone) {
    if (confirm(`هل أنت متأكد من حذف منطقة (${zone.name})؟`)) {
      this.adminService.deleteDeliveryZone(zone.id).subscribe({
        next: () => {
          this.toast.success('تم حذف المنطقة.');
          this.loadZones();
        }
      });
    }
  }
}
