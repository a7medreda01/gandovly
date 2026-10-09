import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'elapsedTime',
  standalone: true
})
export class ElapsedTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '0د';

    const createdTime = new Date(value).getTime();
    if (isNaN(createdTime)) return '0د';

    const diffMs = Math.max(0, Date.now() - createdTime);
    const totalMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    if (hours > 0) {
      return `${hours}س ${mins}د`;
    }
    return `${mins}د`;
  }
}
