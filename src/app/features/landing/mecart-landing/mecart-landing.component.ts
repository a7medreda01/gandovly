import { Component, OnInit, inject, signal } from '@angular/core';
import { ProjectPreviewComponent } from '../../../shared/components/project-preview/project-preview.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectsService, ProjectItem } from '../../../core/services/projects.service';
import { RUNX_LOGO_BASE64 } from '../../../core/constants/runx-logo.base64';

export interface ServiceItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  features: string[];
}

@Component({
  selector: 'app-mecart-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, ProjectPreviewComponent],
  templateUrl: './mecart-landing.component.html',
  styleUrls: ['./mecart-landing.component.scss']
})
export class MecartLandingComponent implements OnInit {
  private readonly projectsService = inject(ProjectsService);

  readonly runxLogo = RUNX_LOGO_BASE64;
  readonly whatsappOrderUrl = 'https://wa.me/201080225502?text=' + encodeURIComponent('مرحباً فريق RunX، أرغب في طلب خدمة استضافة متجر سحابي على منصة MeCart');

  latestProjects = signal<ProjectItem[]>([]);
  isLoadingProjects = signal<boolean>(true);

  storeTypes = [
    {label:'سوبر ماركت وبقالة',icon:'bi-basket'}, {label:'صيدليات ومستحضرات',icon:'bi-capsule'},
    {label:'مطاعم وكافيهات',icon:'bi-cup-hot'}, {label:'إلكترونيات وأجهزة',icon:'bi-laptop'},
    {label:'قطع غيار ومستلزمات',icon:'bi-gear'}, {label:'أثاث ومحلات وتجارة عامة',icon:'bi-shop'}
  ];
  services: ServiceItem[] = [
    {
      id: 'hosting',
      title: 'استضافة سحابية مدارة بالكامل',
      icon: 'bi-cloud-check-fill',
      description: 'خوادم سحابية فائقة السرعة مع شبكة CDN لتوزيع المحتوى وحماية متقدمة ومعدل استقرار 99.99%.',
      features: ['سرعة تصفح أقل من ثانية', 'استقرار وجاهزية 99.99%', 'حماية SSL تلقائية']
    },
    {
      id: 'domain',
      title: 'نطاقات مخصصة ونطاقات فرعية',
      icon: 'bi-globe2',
      description: 'احصل على نطاق فرعي فوري yourstore.mecart.app أو اربط دومينك المستقل الخاص yourbrand.com بسهولة.',
      features: ['ربط دومينك الخاص مجاناً', 'نطاق فرعي سحابي فوري', 'شهادة أمان مشفرة']
    },
    {
      id: 'seed-engine',
      title: 'محرك نقل البيانات (Seed Engine)',
      icon: 'bi-file-earmark-zip-fill',
      description: 'إمكانية تصدير ونسخ ونقل كامل بيانات المتجر والصور بضغطة زر واحدة دون أي تعقيد تقني.',
      features: ['نسخ احتياطي فوري', 'تصدير كامل المنتجات والصور', 'نقل سلس بين السيرفرات']
    },
    {
      id: 'whatsapp',
      title: 'ربط واتساب التجاري السحابي',
      icon: 'bi-whatsapp',
      description: 'إرسال فواتير الطلبات، تحديثات الشحن، وتأكيد المبيعات تلقائياً للعملاء عبر واتساب من رقمك التجاري.',
      features: ['إرسال فواتير الطلب آلياً', 'تتبع حالة الشحن', 'تأكيد مباشر مع العميل']
    },
    {
      id: 'delivery',
      title: 'حساب مناطق ورسوم التوصيل',
      icon: 'bi-geo-alt-fill',
      description: 'تسعير تلقائي للشحن حسب المنطقة أو المدينة، مع توجيه الطلبات للمناديب ومتابعة حالات التجهيز.',
      features: ['تسعير حسب الأحياء والمدن', 'تخصيص أوقات التوصيل', 'توجيه لمندوب الشحن']
    },
    {
      id: 'multi-industry',
      title: 'تهيئة وتخصيص لكافة الأنشطة',
      icon: 'bi-shop',
      description: 'أنظمة معدة خصيصاً للسوبر ماركت، المطاعم، الصيدليات، قطع الغيار، الأجهزة، والأزياء والتجارة العامة.',
      features: ['تسعير بالوزن أو بالقطعة', 'منيو مطاعم وشاشات مطبخ', 'فلاتر دقيقة للأجهزة وقطع الغيار']
    }
  ];

  ngOnInit(): void {
    this.loadLatestProjects();
  }

  loadLatestProjects(): void {
    this.isLoadingProjects.set(true);
    // Fetch latest 10 projects for homepage
    this.projectsService.getProjects(1, 10).subscribe({
      next: (res) => {
        this.latestProjects.set(res.items);
        this.isLoadingProjects.set(false);
      },
      error: () => {
        this.isLoadingProjects.set(false);
      }
    });
  }

  getProjectWhatsAppUrl(project: ProjectItem): string {
    const text = `مرحباً فريق RunX، أود طلب خدمة استضافة متجر مماثل لـ (${project.name}) في مجال (${project.domainLabel})`;
    return `https://wa.me/201080225502?text=${encodeURIComponent(text)}`;
  }
}
