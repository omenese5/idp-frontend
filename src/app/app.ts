import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: true,
  imports: [RouterModule, CommonModule]
})
export class AppComponent {
  currentUser: any = null;

  constructor(public auth: AuthService) {
    this.auth.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout() {
    this.auth.logout();
  }
}