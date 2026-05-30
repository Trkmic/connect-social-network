import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

  const authService = inject(AuthService);
  const router = inject(Router); 
  
  const token = authService.getToken();

  const isApiUrl = req.url.includes(environment.apiUrl);
  
  // 1. Añadir el token si existe y es una URL de la API
  if (token && isApiUrl) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          
          // 2. Comprobar si NO estamos ya en la ruta de login o registro
          if (router.url !== '/login' && router.url !== '/registro') {
            
            // Llama a logout. showModal será true por defecto y activará el modal.
            // Esto también detiene el chequeo proactivo del AuthService.
            authService.logout(); 
            
            // 3. 🛑 DEVOLVER UN OBSERVABLE VACÍO (NO throwError)
            // Esto detiene la petición fallida sin propagar el error 401
            // al componente que la originó, ya que el usuario va a ser redirigido.
            return new Observable<HttpEvent<any>>(); 

          }
        }
      }
      // 4. Propagar todos los demás errores (403 Forbidden, 500 Internal, etc.)
      return throwError(() => error);
    })
  );
};