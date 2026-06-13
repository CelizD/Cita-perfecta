import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private key = 'cita_perfecta_user';

  constructor(private router: Router) {}

  login(email: string, password: string): boolean {
    if (!email || !password) {
      return false;
    }

    localStorage.setItem(this.key, JSON.stringify({ email }));
    return true;
  }

  register(name: string, email: string, password: string): boolean {
    if (!name || !email || !password) {
      return false;
    }

    localStorage.setItem(this.key, JSON.stringify({ name, email }));
    return true;
  }

  logout(): void {
    localStorage.removeItem(this.key);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.key);
  }
}