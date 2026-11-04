import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
  forwardRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';

export interface CountryInfo {
  code: string;        // e.g. 'SA'
  nameAr: string;      // e.g. 'المملكة العربية السعودية'
  shortNameAr: string; // e.g. 'السعودية'
  dialCode: string;    // e.g. '+966'
  flag: string;        // e.g. '🇸🇦'
  placeholder: string; // e.g. '50 123 4567'
  sampleDigits: string;// e.g. '5XXXXXXXX'
  minDigits: number;
  maxDigits: number;
}

export const COUNTRIES_LIST: CountryInfo[] = [
  {
    code: 'SA',
    nameAr: 'المملكة العربية السعودية',
    shortNameAr: 'السعودية',
    dialCode: '+966',
    flag: '🇸🇦',
    placeholder: '05X XXX XXXX',
    sampleDigits: '5XXXXXXXX',
    minDigits: 9,
    maxDigits: 10
  },
  {
    code: 'AE',
    nameAr: 'الإمارات العربية المتحدة',
    shortNameAr: 'الإمارات',
    dialCode: '+971',
    flag: '🇦🇪',
    placeholder: '05X XXX XXXX',
    sampleDigits: '5XXXXXXXX',
    minDigits: 9,
    maxDigits: 9
  },
  {
    code: 'KW',
    nameAr: 'دولة الكويت',
    shortNameAr: 'الكويت',
    dialCode: '+965',
    flag: '🇰🇼',
    placeholder: 'XX XXX XXX',
    sampleDigits: 'XXXXXXXX',
    minDigits: 8,
    maxDigits: 8
  },
  {
    code: 'BH',
    nameAr: 'مملكة البحرين',
    shortNameAr: 'البحرين',
    dialCode: '+973',
    flag: '🇧🇭',
    placeholder: 'XX XXX XXX',
    sampleDigits: 'XXXXXXXX',
    minDigits: 8,
    maxDigits: 8
  },
  {
    code: 'OM',
    nameAr: 'سلطنة عُمان',
    shortNameAr: 'عُمان',
    dialCode: '+968',
    flag: '🇴🇲',
    placeholder: 'XX XXX XXX',
    sampleDigits: 'XXXXXXXX',
    minDigits: 8,
    maxDigits: 8
  },
  {
    code: 'QA',
    nameAr: 'دولة قطر',
    shortNameAr: 'قطر',
    dialCode: '+974',
    flag: '🇶🇦',
    placeholder: 'XX XXX XXX',
    sampleDigits: 'XXXXXXXX',
    minDigits: 8,
    maxDigits: 8
  },
  {
    code: 'EG',
    nameAr: 'جمهورية مصر العربية',
    shortNameAr: 'مصر',
    dialCode: '+20',
    flag: '🇪🇬',
    placeholder: '01X XXXX XXXX',
    sampleDigits: '10XXXXXXXX',
    minDigits: 10,
    maxDigits: 11
  },
  {
    code: 'JO',
    nameAr: 'المملكة الأردنية الهاشمية',
    shortNameAr: 'الأردن',
    dialCode: '+962',
    flag: '🇯🇴',
    placeholder: '07X XXX XXXX',
    sampleDigits: '7XXXXXXXX',
    minDigits: 9,
    maxDigits: 9
  },
  {
    code: 'IQ',
    nameAr: 'جمهورية العراق',
    shortNameAr: 'العراق',
    dialCode: '+964',
    flag: '🇮🇶',
    placeholder: '07XX XXX XXXX',
    sampleDigits: '7XXXXXXXXX',
    minDigits: 10,
    maxDigits: 10
  },
  {
    code: 'YE',
    nameAr: 'الجمهورية اليمنية',
    shortNameAr: 'اليمن',
    dialCode: '+967',
    flag: '🇾🇪',
    placeholder: '7XX XXX XXX',
    sampleDigits: '7XXXXXXXX',
    minDigits: 9,
    maxDigits: 9
  },
  {
    code: 'LB',
    nameAr: 'الجمهورية اللبنانية',
    shortNameAr: 'لبنان',
    dialCode: '+961',
    flag: '🇱🇧',
    placeholder: 'XX XXX XXX',
    sampleDigits: 'XXXXXXXX',
    minDigits: 8,
    maxDigits: 8
  },
  {
    code: 'SY',
    nameAr: 'الجمهورية العربية السورية',
    shortNameAr: 'سوريا',
    dialCode: '+963',
    flag: '🇸🇾',
    placeholder: '09XX XXX XXX',
    sampleDigits: '9XXXXXXXX',
    minDigits: 9,
    maxDigits: 9
  },
  {
    code: 'SD',
    nameAr: 'جمهورية السودان',
    shortNameAr: 'السودان',
    dialCode: '+249',
    flag: '🇸🇩',
    placeholder: '09X XXX XXXX',
    sampleDigits: '9XXXXXXXX',
    minDigits: 9,
    maxDigits: 9
  },
  {
    code: 'TN',
    nameAr: 'الجمهورية التونسية',
    shortNameAr: 'تونس',
    dialCode: '+216',
    flag: '🇹🇳',
    placeholder: 'XX XXX XXX',
    sampleDigits: 'XXXXXXXX',
    minDigits: 8,
    maxDigits: 8
  },
  {
    code: 'DZ',
    nameAr: 'الجمهورية الجزائرية',
    shortNameAr: 'الجزائر',
    dialCode: '+213',
    flag: '🇩🇿',
    placeholder: '05XX XX XX XX',
    sampleDigits: '5XXXXXXXX',
    minDigits: 9,
    maxDigits: 9
  },
  {
    code: 'MA',
    nameAr: 'المملكة المغربية',
    shortNameAr: 'المغرب',
    dialCode: '+212',
    flag: '🇲🇦',
    placeholder: '06XX XXX XXX',
    sampleDigits: '6XXXXXXXX',
    minDigits: 9,
    maxDigits: 9
  },
  {
    code: 'LY',
    nameAr: 'دولة ليبيا',
    shortNameAr: 'ليبيا',
    dialCode: '+218',
    flag: '🇱🇾',
    placeholder: '09X XXX XXXX',
    sampleDigits: '9XXXXXXXX',
    minDigits: 9,
    maxDigits: 9
  },
  {
    code: 'PS',
    nameAr: 'دولة فلسطين',
    shortNameAr: 'فلسطين',
    dialCode: '+970',
    flag: '🇵🇸',
    placeholder: '05X XXX XXXX',
    sampleDigits: '5XXXXXXXX',
    minDigits: 9,
    maxDigits: 9
  },
  {
    code: 'TR',
    nameAr: 'الجمهورية التركية',
    shortNameAr: 'تركيا',
    dialCode: '+90',
    flag: '🇹🇷',
    placeholder: '05XX XXX XXXX',
    sampleDigits: '5XXXXXXXXX',
    minDigits: 10,
    maxDigits: 10
  },
  {
    code: 'GB',
    nameAr: 'المملكة المتحدة',
    shortNameAr: 'بريطانيا',
    dialCode: '+44',
    flag: '🇬🇧',
    placeholder: '07XXX XXXXXX',
    sampleDigits: '7XXXXXXXXX',
    minDigits: 10,
    maxDigits: 10
  },
  {
    code: 'US',
    nameAr: 'الولايات المتحدة الأمريكية',
    shortNameAr: 'أمريكا',
    dialCode: '+1',
    flag: '🇺🇸',
    placeholder: 'XXX XXX XXXX',
    sampleDigits: 'XXXXXXXXXX',
    minDigits: 10,
    maxDigits: 10
  }
];

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="phone-input-root" [class.is-focused]="isFocused" [class.is-disabled]="disabled" #containerRef>
      <!-- Country Code Picker Trigger (Always on Right in RTL) -->
      <button
        type="button"
        class="country-btn"
        (click)="toggleDropdown($event)"
        [disabled]="disabled"
        [attr.aria-expanded]="isOpen"
        title="اختر الدولة وكود الاتصال"
      >
        <span class="flag-visual">
          <img
            [src]="'https://flagcdn.com/w40/' + selectedCountry.code.toLowerCase() + '.png'"
            [alt]="selectedCountry.nameAr"
            class="flag-img"
            loading="lazy"
            (error)="onFlagError($event)"
          />
          <span class="flag-fallback">{{ selectedCountry.flag }}</span>
        </span>
        <span class="dial-code" dir="ltr">{{ selectedCountry.dialCode }}</span>
        <i class="bi bi-chevron-down chevron-icon" [class.rotate]="isOpen"></i>
      </button>

      <!-- Vertical Divider -->
      <span class="input-divider"></span>

      <!-- National Phone Number Input -->
      <input
        #inputRef
        [id]="inputId"
        type="tel"
        inputmode="tel"
        dir="ltr"
        class="phone-native-input"
        [placeholder]="placeholder || selectedCountry.placeholder"
        [value]="nationalNumber"
        [disabled]="disabled"
        [required]="required"
        [attr.autofocus]="autoFocus ? '' : null"
        (focus)="onInputFocus()"
        (blur)="onInputBlur()"
        (input)="onInputChange($event)"
        (keyup.enter)="onEnterPressed()"
      />

      <!-- Clear Button if user entered digits -->
      @if (nationalNumber && !disabled) {
        <button
          type="button"
          class="btn-clear-digits"
          (click)="clearNumber($event)"
          title="مسح الرقم"
          tabindex="-1"
        >
          <i class="bi bi-x-circle-fill"></i>
        </button>
      }

      <!-- Country Selection Responsive Modal & Bottom Sheet Overlay -->
      @if (isOpen) {
        <div class="country-picker-overlay" (click)="isOpen = false">
          <div class="country-picker-sheet" (click)="$event.stopPropagation()">
            <div class="sheet-drag-pill"></div>

            <div class="picker-header">
              <div class="picker-header-text">
                <h4 class="picker-title">اختر الدولة أو كود الاتصال</h4>
                <p class="picker-desc">حدد رمز دولتك لإدخال وتأكيد رقم الهاتف بنجاح</p>
              </div>
              <button type="button" class="btn-picker-close" (click)="isOpen = false" aria-label="إغلاق">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <!-- Search Bar -->
            <div class="picker-search-bar">
              <i class="bi bi-search search-ico"></i>
              <input
                #searchInputRef
                type="text"
                class="picker-search-input"
                placeholder="ابحث بالاسم أو الرمز (+20، مصر، السعودية)..."
                [(ngModel)]="searchQuery"
                (click)="$event.stopPropagation()"
              />
              @if (searchQuery) {
                <button
                  type="button"
                  class="btn-clear-search"
                  (click)="searchQuery = ''; searchInputRef.focus()"
                  title="مسح البحث"
                >
                  <i class="bi bi-x-circle-fill"></i>
                </button>
              }
            </div>

            <!-- Country List Items -->
            <div class="picker-countries-list">
              @for (country of filteredCountries; track country.code) {
                <button
                  type="button"
                  class="country-item-row"
                  [class.is-selected]="country.code === selectedCountry.code"
                  (click)="selectCountry(country)"
                >
                  <div class="country-main-col">
                    <span class="flag-visual">
                      <img
                        [src]="'https://flagcdn.com/w40/' + country.code.toLowerCase() + '.png'"
                        [alt]="country.nameAr"
                        class="flag-img"
                        loading="lazy"
                        (error)="onFlagError($event)"
                      />
                      <span class="flag-fallback">{{ country.flag }}</span>
                    </span>
                    <div class="country-names-col">
                      <span class="country-name-txt">{{ country.nameAr }}</span>
                      <span class="country-sample-txt" dir="ltr">مثال: {{ country.sampleDigits }}</span>
                    </div>
                  </div>

                  <div class="country-dial-col">
                    <span class="dial-code-badge" dir="ltr">{{ country.dialCode }}</span>
                    @if (country.code === selectedCountry.code) {
                      <span class="active-check-icon">
                        <i class="bi bi-check-lg"></i>
                      </span>
                    }
                  </div>
                </button>
              } @empty {
                <div class="picker-empty-state">
                  <div class="empty-icon-circle">
                    <i class="bi bi-search"></i>
                  </div>
                  <h5 class="empty-title">لم يتم العثور على دولة مطابقة</h5>
                  <p class="empty-desc">تأكد من كتابة اسم الدولة أو كود الاتصال بشكل صحيح</p>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    .phone-input-root {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      max-width: 100%;
      height: 50px;
      box-sizing: border-box;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 14px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);

      &:hover:not(.is-disabled) {
        border-color: #94a3b8;
      }

      &.is-focused {
        border-color: var(--primary-color, #00875a);
        box-shadow: 0 0 0 3.5px rgba(0, 135, 90, 0.15), 0 2px 6px rgba(0, 0, 0, 0.04);
        background: #ffffff;
      }

      &.is-disabled {
        background-color: #f1f5f9;
        opacity: 0.75;
        cursor: not-allowed;
      }
    }

    /* Country Trigger Button */
    .country-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      height: 100%;
      padding: 0 12px;
      background: transparent;
      border: none;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.18s ease;
      white-space: nowrap;
      border-radius: 0 12px 12px 0; /* RTL start */

      &:hover:not(:disabled) {
        background-color: #f8fafc;
      }

      &:disabled {
        cursor: not-allowed;
      }

      .flag-visual {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;

        .flag-img {
          width: 24px;
          height: 16px;
          object-fit: cover;
          border-radius: 3px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

          &.has-error {
            display: none !important;
          }
        }

        .flag-fallback {
          display: none;
          font-size: 1.25rem;
          line-height: 1;
        }

        .flag-img.has-error + .flag-fallback {
          display: inline !important;
        }
      }

      .dial-code {
        font-size: 0.92rem;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: -0.2px;
      }

      .chevron-icon {
        font-size: 0.75rem;
        color: #64748b;
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);

        &.rotate {
          transform: rotate(180deg);
        }
      }
    }

    .input-divider {
      width: 1px;
      height: 24px;
      background-color: #e2e8f0;
      flex-shrink: 0;
    }

    /* Native Phone Number Input */
    .phone-native-input {
      flex: 1;
      height: 100%;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      padding: 0 12px;
      font-size: 16px !important; /* STRICTLY 16px to prevent iOS Safari auto-zoom */
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.5px;
      font-family: inherit;
      box-sizing: border-box;
      border-radius: 12px 0 0 12px; /* RTL end */

      &::placeholder {
        color: #94a3b8;
        font-weight: 400;
        letter-spacing: normal;
      }

      &:disabled {
        cursor: not-allowed;
        color: #64748b;
      }
    }

    /* Clear digits button */
    .btn-clear-digits {
      background: transparent;
      border: none;
      color: #94a3b8;
      padding: 0 10px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1rem;
      flex-shrink: 0;
      transition: color 0.15s ease;

      &:hover {
        color: #e63946;
      }
    }

    /* ========================================================
       MODAL & BOTTOM SHEET OVERLAY FOR COUNTRY PICKER
    ======================================================== */
    .country-picker-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 100000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 0;
      animation: overlayFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      @media (min-width: 641px) {
        align-items: center;
        padding: 1.5rem;
      }
    }

    .country-picker-sheet {
      width: 100%;
      max-width: 500px;
      background: #ffffff;
      border-radius: 24px 24px 0 0;
      max-height: 82vh;
      max-height: 82dvh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.22);
      animation: sheetSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);

      @media (min-width: 641px) {
        border-radius: 24px;
        max-height: 540px;
        box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.35);
        animation: modalScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
    }

    .sheet-drag-pill {
      width: 44px;
      height: 5px;
      background: #cbd5e1;
      border-radius: 999px;
      margin: 10px auto 4px;
      flex-shrink: 0;

      @media (min-width: 641px) {
        display: none;
      }
    }

    .picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      border-bottom: 1px solid #f1f5f9;
      background: #ffffff;
      flex-shrink: 0;

      .picker-header-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        text-align: right;

        .picker-title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
        }

        .picker-desc {
          margin: 0;
          font-size: 0.78rem;
          color: #64748b;
        }
      }

      .btn-picker-close {
        width: 34px;
        height: 34px;
        background: #f1f5f9;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #475569;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;

        &:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
      }
    }

    /* Search Bar */
    .picker-search-bar {
      position: relative;
      padding: 10px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;

      .search-ico {
        color: #64748b;
        font-size: 0.95rem;
      }

      .picker-search-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font-size: 0.92rem;
        font-weight: 600;
        color: #0f172a;
        font-family: inherit;

        &::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }
      }

      .btn-clear-search {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        font-size: 1.1rem;
        padding: 0;
        display: flex;
        align-items: center;

        &:hover {
          color: #475569;
        }
      }
    }

    /* List Container */
    .picker-countries-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px 12px;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;

      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
    }

    /* Country Item Row */
    .country-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-height: 52px;
      padding: 10px 14px;
      margin-bottom: 4px;
      border: 1.5px solid transparent;
      border-radius: 12px;
      background: transparent;
      cursor: pointer;
      text-align: right;
      transition: all 0.15s ease;
      box-sizing: border-box;

      &:hover {
        background: #f1f5f9;
      }

      &.is-selected {
        background: #f0fdf4;
        border-color: #86efac;

        .country-name-txt {
          color: #166534;
          font-weight: 800;
        }

        .dial-code-badge {
          background: #dcfce7;
          color: #15803d;
          border-color: #86efac;
        }
      }

      .country-main-col {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;

        .flag-visual {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 22px;
          flex-shrink: 0;

          .flag-img {
            width: 30px;
            height: 20px;
            object-fit: cover;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);

            &.has-error {
              display: none !important;
            }
          }

          .flag-fallback {
            display: none;
            font-size: 1.4rem;
            line-height: 1;
          }

          .flag-img.has-error + .flag-fallback {
            display: inline !important;
          }
        }

        .country-names-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 0;

          .country-name-txt {
            font-size: 0.95rem;
            font-weight: 700;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 220px;
          }

          .country-sample-txt {
            font-size: 0.75rem;
            color: #64748b;
            margin-top: 1px;
            font-weight: 500;
          }
        }
      }

      .country-dial-col {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;

        .dial-code-badge {
          font-size: 0.9rem;
          font-weight: 800;
          color: #334155;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 4px 10px;
          border-radius: 8px;
          letter-spacing: -0.2px;
        }

        .active-check-icon {
          width: 24px;
          height: 24px;
          background: #22c55e;
          color: #ffffff;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
        }
      }
    }

    .picker-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 36px 16px;
      text-align: center;

      .empty-icon-circle {
        width: 56px;
        height: 56px;
        background: #f1f5f9;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        font-size: 1.4rem;
        margin-bottom: 12px;
      }

      .empty-title {
        font-size: 1rem;
        font-weight: 800;
        color: #1e293b;
        margin: 0 0 4px 0;
      }

      .empty-desc {
        font-size: 0.82rem;
        color: #64748b;
        margin: 0;
      }
    }

    @keyframes overlayFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes sheetSlideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    @keyframes modalScaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `]
})
export class PhoneInputComponent implements ControlValueAccessor, OnInit {
  @Input() inputId: string = 'phone_input_' + Math.random().toString(36).substring(2, 7);
  @Input() placeholder: string = '';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() autoFocus: boolean = false;
  @Input() defaultCountryCode: string = '';

  @Output() countryChange = new EventEmitter<CountryInfo>();
  @Output() numberChange = new EventEmitter<string>();
  @Output() enterPressed = new EventEmitter<void>();

  @ViewChild('containerRef') containerRef!: ElementRef;
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('searchInputRef') searchInputRef?: ElementRef<HTMLInputElement>;

  private readonly settingsService = inject(SettingsService, { optional: true });

  countries: CountryInfo[] = COUNTRIES_LIST;
  selectedCountry: CountryInfo = COUNTRIES_LIST[1]; // Default
  nationalNumber: string = '';

  isOpen: boolean = false;
  isFocused: boolean = false;
  searchQuery: string = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    const configuredCode = this.defaultCountryCode || this.settingsService?.settings()?.countryCode || 'EG';
    const found = this.countries.find(c => c.code.toUpperCase() === configuredCode.toUpperCase())
      || this.countries.find(c => c.dialCode === this.settingsService?.settings()?.phoneCountryCode)
      || this.countries.find(c => c.code === 'EG')
      || this.countries[0];
    if (found) {
      this.selectedCountry = found;
    }
  }

  get filteredCountries(): CountryInfo[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.countries;

    // Search by name, shortName, code, or dial code
    const cleanQ = q.replace('+', '');
    return this.countries.filter(c =>
      c.nameAr.toLowerCase().includes(q) ||
      c.shortNameAr.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.dialCode.toLowerCase().includes(q) ||
      c.dialCode.replace('+', '').includes(cleanQ)
    );
  }

  // ControlValueAccessor methods
  writeValue(value: string | null | undefined): void {
    if (!value || typeof value !== 'string') {
      this.nationalNumber = '';
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      this.nationalNumber = '';
      return;
    }

    // Try to detect country from dial code or prefix
    let matchedCountry: CountryInfo | undefined;
    let cleanDigits = trimmed;

    // 1. Direct match with + dial code (e.g. +966501234567, +201012345678)
    if (trimmed.startsWith('+')) {
      // Sort countries by dial code length descending so +966 matches before +96
      const sorted = [...this.countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
      for (const c of sorted) {
        if (trimmed.startsWith(c.dialCode)) {
          matchedCountry = c;
          cleanDigits = trimmed.substring(c.dialCode.length).trim();
          break;
        }
      }
    }
    // 2. Starts with dial code without + (e.g. 966501234567)
    else if (trimmed.startsWith('966') && trimmed.length >= 11) {
      matchedCountry = this.countries.find(c => c.code === 'SA');
      cleanDigits = trimmed.substring(3);
    } else if (trimmed.startsWith('20') && trimmed.length >= 12) {
      matchedCountry = this.countries.find(c => c.code === 'EG');
      cleanDigits = trimmed.substring(2);
    }
    // 3. Saudi local format starting with 05 (e.g. 0531003058)
    else if (trimmed.startsWith('05') && (trimmed.length === 10 || trimmed.length === 9)) {
      matchedCountry = this.countries.find(c => c.code === 'SA');
      cleanDigits = trimmed;
    }
    // 4. Egypt local format starting with 01 (e.g. 01012345678)
    else if (trimmed.startsWith('01') && trimmed.length === 11) {
      matchedCountry = this.countries.find(c => c.code === 'EG');
      cleanDigits = trimmed;
    }

    if (matchedCountry) {
      this.selectedCountry = matchedCountry;
    }

    // Clean any remaining non-digit characters
    this.nationalNumber = cleanDigits.replace(/[^0-9]/g, '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // UI Event Handlers
  toggleDropdown(event: Event): void {
    event.stopPropagation();
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    this.searchQuery = '';
    if (this.isOpen) {
      setTimeout(() => {
        this.searchInputRef?.nativeElement.focus();
      }, 50);
    }
  }

  selectCountry(country: CountryInfo): void {
    this.selectedCountry = country;
    this.isOpen = false;
    this.searchQuery = '';
    this.countryChange.emit(country);
    this.emitCombinedValue();
    setTimeout(() => {
      this.inputRef?.nativeElement.focus();
    }, 50);
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value || '';

    // Keep only numbers
    const digitsOnly = rawValue.replace(/[^0-9]/g, '');
    this.nationalNumber = digitsOnly;
    input.value = digitsOnly;

    this.numberChange.emit(this.nationalNumber);
    this.emitCombinedValue();
  }

  clearNumber(event: Event): void {
    event.stopPropagation();
    this.nationalNumber = '';
    if (this.inputRef) {
      this.inputRef.nativeElement.value = '';
      this.inputRef.nativeElement.focus();
    }
    this.numberChange.emit('');
    this.emitCombinedValue();
  }

  onInputFocus(): void {
    this.isFocused = true;
    this.isOpen = false;
  }

  onInputBlur(): void {
    this.isFocused = false;
    this.onTouched();
  }

  onEnterPressed(): void {
    this.enterPressed.emit();
  }

  private emitCombinedValue(): void {
    if (!this.nationalNumber.trim()) {
      this.onChange('');
      return;
    }

    let digits = this.nationalNumber.trim();

    // If country is Saudi (+966) and number starts with '05', strip leading 0 for international format:
    // e.g. '0531003058' -> '+966531003058'
    let intDigits = digits;
    if (this.selectedCountry.dialCode === '+966' && intDigits.startsWith('05')) {
      intDigits = intDigits.substring(1);
    } else if (this.selectedCountry.dialCode === '+20' && intDigits.startsWith('01')) {
      intDigits = intDigits.substring(1);
    } else if (this.selectedCountry.dialCode === '+971' && intDigits.startsWith('05')) {
      intDigits = intDigits.substring(1);
    }

    const fullInternational = `${this.selectedCountry.dialCode}${intDigits}`;
    this.onChange(fullInternational);
  }

  onFlagError(event: Event): void {
    const imgEl = event.target as HTMLElement;
    if (imgEl) {
      imgEl.classList.add('has-error');
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen) return;
    const target = event.target as HTMLElement;
    if (this.elementRef.nativeElement && !this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen = false;
  }
}

