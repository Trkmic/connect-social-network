import { Component, signal, inject} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { AuthService } from './core/services/auth.service'; 
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-root',
  imports: [CommonModule,RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('red-social');

  isLoading = true; 
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.authService.checkTokenValidity().subscribe((isValid) => {
        this.isLoading = false;
        if (isValid) {
          const currentUrl = this.router.url;
          if (currentUrl === '/' || currentUrl === '' || currentUrl === '/login' || currentUrl === '/registro') {
            this.router.navigate(['/publicaciones']);
          }
        }
      });
    } else {
      this.isLoading = false;
      const currentUrl = this.router.url;
      if (currentUrl === '/' || currentUrl === '') {
        this.router.navigate(['/login']);
      }
    }
  }
}
