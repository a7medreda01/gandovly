import { Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { MobileNavService } from '../../../core/services/mobile-nav.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { Product } from '../../../core/models/models';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, ImageUrlPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  readonly settingsService = inject(SettingsService);
  readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  readonly languageService = inject(LanguageService);
  readonly wishlistService = inject(WishlistService);
  readonly mobileNavService = inject(MobileNavService);
  readonly catalogService = inject(CatalogService);
  private readonly router = inject(Router);

  @ViewChild('liveSearchInput') liveSearchInput?: ElementRef<HTMLInputElement>;

  // Live Search States
  readonly isSearchOpen = signal(false);
  readonly searchQuery = signal('');
  readonly searchResults = signal<Product[]>([]);
  readonly totalSearchCount = signal(0);
  readonly isSearching = signal(false);
  readonly hasSearched = signal(false);

  private readonly searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  ngOnInit() {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged()
    ).subscribe(query => {
      this.executeLiveSearch(query);
    });
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  get isNavbarSearchEnabled(): boolean {
    const s = this.settingsService.settings();
    return s.showNavbarSearch === true || s.storeLayout?.showNavbarSearch === true;
  }

  get isMobileMenuOpen(): boolean {
    return this.mobileNavService.isOpen();
  }

  get whatsappUrl() {
    return 'https://wa.me/' + (this.settingsService.settings().whatsapp || '').replace(/\D/g, '');
  }

  toggleMobileMenu() {
    if (this.isSearchOpen()) this.closeSearch();
    this.mobileNavService.toggle();
  }

  closeMobileMenu() {
    this.mobileNavService.close();
  }

  // --- Live Search Actions ---
  toggleSearch() {
    const nextState = !this.isSearchOpen();
    this.isSearchOpen.set(nextState);
    if (nextState) {
      this.closeMobileMenu();
      setTimeout(() => {
        try {
          this.liveSearchInput?.nativeElement?.focus({ preventScroll: true });
        } catch {
          this.liveSearchInput?.nativeElement?.focus();
        }
      }, 60);
    } else {
      this.clearSearch();
    }
  }

  closeSearch() {
    this.isSearchOpen.set(false);
    this.clearSearch();
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.totalSearchCount.set(0);
    this.hasSearched.set(false);
    this.isSearching.set(false);
  }

  onSearchInput(val: string) {
    const clean = val || '';
    this.searchQuery.set(clean);
    if (!clean.trim()) {
      this.searchResults.set([]);
      this.totalSearchCount.set(0);
      this.hasSearched.set(false);
      this.isSearching.set(false);
      return;
    }
    this.isSearching.set(true);
    this.searchSubject.next(clean);
  }

  onSearchEnter() {
    const q = this.searchQuery().trim();
    if (q) {
      this.router.navigate(['/menu'], { queryParams: { search: q } });
      this.closeSearch();
    }
  }

  openProduct(p: Product) {
    this.closeSearch();
    this.router.navigate(['/product', p.id]);
  }

  productName(p: any): string {
    if (this.languageService.currentLang() === 'en') {
      return p.nameEn || p.name || p.nameAr || '';
    }
    return p.nameAr || p.name || p.nameEn || '';
  }

  currencySymbol(): string {
    return this.settingsService.settings().currencySymbol || 'ج.م';
  }

  private executeLiveSearch(query: string) {
    const q = (query || '').trim();
    if (!q) {
      this.searchResults.set([]);
      this.totalSearchCount.set(0);
      this.hasSearched.set(false);
      this.isSearching.set(false);
      return;
    }

    this.isSearching.set(true);
    this.catalogService.getProducts({ search: q, pageSize: 8 }).subscribe({
      next: res => {
        this.searchResults.set(res.items || []);
        this.totalSearchCount.set(res.totalCount || (res.items || []).length);
        this.isSearching.set(false);
        this.hasSearched.set(true);
      },
      error: () => {
        this.searchResults.set([]);
        this.totalSearchCount.set(0);
        this.isSearching.set(false);
        this.hasSearched.set(true);
      }
    });
  }

  get isKitchenAllowed(): boolean {
    const role = this.authService.currentAdmin()?.role;
    return role === 'SuperAdmin' || role === 'Manager' || role === 'KitchenStaff';
  }

  get isAdminAllowed(): boolean {
    const role = this.authService.currentAdmin()?.role;
    return role === 'SuperAdmin' || role === 'Manager';
  }
}
