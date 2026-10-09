import { Component, Input, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { parseUtcDate } from '../../utils/date-utils';

@Component({
  selector: 'app-elapsed-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="elapsed-timer-badge"
      [class.status-timer-normal]="severity() === 'normal'"
      [class.status-timer-warning]="severity() === 'warning'"
      [class.status-timer-danger]="severity() === 'danger'"
      [title]="'وقت الإنشاء: ' + createdAt"
    >
      <svg class="ui-icon icon-sm timer-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <span class="timer-text">{{ displayText() }}</span>
    </span>
  `,
  styles: [`
    .elapsed-timer-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding-block: 0.2rem;
      padding-inline: 0.65rem;
      border-radius: var(--radius-badge);
      font-size: 0.8rem;
      font-weight: 700;
      line-height: 1.25;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      user-select: none;
      transition: var(--transition-fast);
    }

    .timer-icon {
      width: 14px;
      height: 14px;
      stroke-width: 2.2px;
    }

    /* Normal (< 30 mins) */
    .status-timer-normal {
      background-color: var(--status-danger-bg);
      color: var(--status-danger-text);
      border: 1px solid var(--status-danger-border);
    }

    /* Warning (>= 30 mins) -> Yellow / Amber */
    .status-timer-warning {
      background-color: #FEF7EA;
      color: #B45309;
      border: 1px solid #F9E2BE;
    }

    /* Danger (>= 60 mins) -> Deep Red */
    .status-timer-danger {
      background-color: #FEE2E2;
      color: #991B1B;
      border: 1px solid #FCA5A5;
      animation: timerPulse 2s infinite ease-in-out;
    }

    @keyframes timerPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
  `]
})
export class ElapsedTimerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) createdAt!: string | Date;

  private timerInterval: any = null;
  private totalMinutes = signal<number>(0);

  displayText = signal<string>('0د');

  severity = computed<'normal' | 'warning' | 'danger'>(() => {
    const mins = this.totalMinutes();
    if (mins >= 60) return 'danger';
    if (mins >= 30) return 'warning';
    return 'normal';
  });

  ngOnInit() {
    this.updateElapsed();
    // Update every 10 seconds as required
    this.timerInterval = setInterval(() => {
      this.updateElapsed();
    }, 10000);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateElapsed() {
    if (!this.createdAt) return;

    const createdTime = parseUtcDate(this.createdAt).getTime();
    if (isNaN(createdTime)) return;

    const diffMs = Math.max(0, Date.now() - createdTime);
    const totalMins = Math.floor(diffMs / (1000 * 60));
    this.totalMinutes.set(totalMins);

    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    if (hours > 0) {
      this.displayText.set(`${hours}س ${mins}د`);
    } else {
      this.displayText.set(`${mins}د`);
    }
  }
}
