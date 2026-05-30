import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AutofocusDirective } from '../../core/directivas/autofocus.directive';
import { ClickControlDirective  } from '../../core/directivas/clickControl.directive';
import { ResaltarInvalidoDirective  } from '../../core/directivas/resaltarInvalido.directive';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, ResaltarInvalidoDirective, ClickControlDirective, AutofocusDirective],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})

export class Login implements OnInit {
  loginForm!: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      emailOrUsername: [{ value: '', disabled: this.loading }, Validators.required],
      password: [{ value: '', disabled: this.loading }, [
        Validators.required,
        Validators.minLength(6)
      ]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.loginForm.disable();
  
      this.auth.login(this.loginForm.value).subscribe({
        next: (res) => {
          setTimeout(() => {
            this.loading = false;
            this.loginForm.enable();
            this.router.navigate(['/publicaciones']);
          }, 500);
        },
        error: (err) => {
          this.loading = false;
          this.loginForm.enable();
          Swal.fire({
            icon: 'error',
            title: 'Error de login',
            text: err.error?.message || 'Usuario o contraseña incorrectos',
            confirmButtonColor: '#d33'
          });
        }
      });
    }
  }

  register() {
    this.router.navigate(['/registro']);
  }
}