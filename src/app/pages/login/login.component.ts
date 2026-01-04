import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    this.auth.login(this.username, this.password).subscribe({
      next: (res) => {
        this.auth.saveSession(res.username, res.token);
        this.router.navigate(['/deploy']);
      },
      error: (err) => {
        this.errorMessage = 'Acceso Denegado. Verifica tu usuario de Jenkins.';
        this.isLoading = false;
      }
    });
  }
}