import { Component, signal, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { AuthService } from './core/services/auth.service'; 
import { CommonModule } from '@angular/common'; 
import { ChatPanel } from './components/chat-panel/chat-panel';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Navbar, Footer, ChatPanel],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('red-social');

  isLoading = true; 
  isLoggedIn = false;
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.authService.checkTokenValidity().subscribe((isValid) => {
        this.isLoading = false;
        this.isLoggedIn = isValid;
        if (isValid) {
          const currentUrl = this.router.url;
          if (currentUrl === '/' || currentUrl === '' || currentUrl === '/login' || currentUrl === '/registro') {
            this.router.navigate(['/publicaciones']);
          }
        } else {
          this.isLoggedIn = false;
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
