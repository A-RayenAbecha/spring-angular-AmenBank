import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$: Observable<boolean> = this.loadingSubject.asObservable();
  private loadingCount = 0;

  show() {
    this.loadingCount++;
    if (this.loadingCount === 1) {
      this.loadingSubject.next(true);
    }
  }

  hide() {
    this.loadingCount--;
    if (this.loadingCount === 0) {
      this.loadingSubject.next(false);
    }
  }

  reset() {
    this.loadingCount = 0;
    this.loadingSubject.next(false);
  }
} 