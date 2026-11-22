import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { RUNX_LOGO_BASE64 } from '../../../core/constants/runx-logo.base64';
import { buildWhatsAppUrl } from './platform-content';

@Component({
  selector: 'app-platform-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './platform-nav.component.html',
  styleUrl: './platform-nav.component.scss'
})
export class PlatformNavComponent implements OnInit, OnDestroy {
  readonly language = inject(LanguageService);
  readonly runxLogo = RUNX_LOGO_BASE64;

  readonly scrolled = signal(false);
  readonly menuOpen = signal(false);
  readonly whatsappUrl = computed(() => buildWhatsAppUrl(this.language.currentLang()));

  private readonly onScroll = () => {
    if (typeof window === 'undefined') return;
    const isScrolled = window.scrollY > 12;
    if (isScrolled !== this.scrolled()) {
      this.scrolled.set(isScrolled);
    }
  };

  private readonly onResize = () => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 768 && this.menuOpen()) {
      this.menuOpen.set(false);
    }
  };

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.onScroll();
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize, { passive: true });
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);
    }
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleLang(): void {
    this.language.toggleLanguage();
  }
}
