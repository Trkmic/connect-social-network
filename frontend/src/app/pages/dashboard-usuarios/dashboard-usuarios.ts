import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UsuariosService } from '../../core/services/usuarios.service';
import { ModeracionService } from '../../core/services/moderacion.service';
import { Usuario } from '../../core/interfaces/usuario.interface';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-dashboard-usuarios',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './dashboard-usuarios.html',
    styleUrl: './dashboard-usuarios.css',
})

export class DashboardUsuariosComponent implements OnInit {
    private usuariosService = inject(UsuariosService);
    private moderacionService = inject(ModeracionService);
    private fb = inject(FormBuilder);
    private router = inject(Router);

    usuarios: Usuario[] = [];
    reportes: any[] = [];
    activeTab: 'usuarios' | 'reportes' = 'usuarios';
    isLoading = true;
    error: string | null = null;
    registroExitoso: boolean = false;

    registroForm = this.fb.group({
        nombre: ['', Validators.required],
        apellido: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        nombreUsuario: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        repeatPassword: ['', [Validators.required, Validators.minLength(6)]],
        perfil: ['usuario', Validators.required],
        fechaNacimiento: [''], 
        descripcion: [''] 
    });

    ngOnInit(): void {
        this.cargarUsuarios();
        this.cargarReportes();
    }

    switchTab(tab: 'usuarios' | 'reportes'): void {
        this.activeTab = tab;
        this.error = null;
        if (tab === 'usuarios') {
            this.cargarUsuarios();
        } else {
            this.cargarReportes();
        }
    }

    cargarUsuarios(): void {
        this.isLoading = true;
        this.usuariosService.getUsuarios().subscribe({
        next: (data) => {
            this.usuarios = data;
            this.isLoading = false;
        },
        error: (err) => {
            this.error = 'Error al cargar usuarios: ' + (err.error?.message || err.message);
            this.isLoading = false;
        }
        });
    }

    toggleHabilitacion(usuario: Usuario): void {
        const nuevoEstado = !usuario.habilitado;
        this.usuariosService.toggleHabilitacion(usuario._id, nuevoEstado).subscribe({
        next: (usuarioActualizado) => {

            usuario.habilitado = usuarioActualizado.habilitado;
            console.log(`Usuario ${usuarioActualizado.nombreUsuario} ${nuevoEstado ? 'habilitado' : 'deshabilitado'}`);
        },
        error: (err) => {
            console.error('Error al cambiar el estado de habilitación:', err);
            alert('Error al actualizar el estado del usuario.');
        }
        });
    }

    onSubmitRegistro(): void {
        this.registroExitoso = false;
        this.error = null;
        
        if (this.registroForm.invalid) {
        this.registroForm.markAllAsTouched();
        return;
        }

        if (this.registroForm.value.password !== this.registroForm.value.repeatPassword) {
            this.error = 'Las contraseñas no coinciden.';
            return;
        }

        this.usuariosService.crearUsuario(this.registroForm.value).subscribe({
        next: () => {
            this.registroExitoso = true;
            this.registroForm.reset({ perfil: 'usuario' }); 
            this.cargarUsuarios(); 
        },
        error: (err) => {
            this.error = err.error?.message || 'Error al crear el nuevo usuario.';
        }
        });
    }

    cargarReportes(): void {
        this.isLoading = true;
        this.moderacionService.obtenerReportes().subscribe({
            next: (data) => {
                this.reportes = data;
                this.isLoading = false;
            },
            error: (err) => {
                this.error = 'Error al cargar reportes: ' + (err.error?.message || err.message);
                this.isLoading = false;
            }
        });
    }

    resolverReporte(id: string, accion: 'eliminar' | 'descartar'): void {
        const text = accion === 'eliminar' 
            ? 'Esta acción eliminará permanentemente el contenido reportado y marcará el reporte como resuelto.'
            : 'Esta acción descartará el reporte sin modificar el contenido.';

        Swal.fire({
            title: '¿Estás seguro?',
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.moderacionService.resolverReporte(id, accion).subscribe({
                    next: (res) => {
                        Swal.fire('Éxito', `Reporte ${accion === 'eliminar' ? 'resuelto' : 'descartado'} con éxito.`, 'success');
                        this.cargarReportes();
                    },
                    error: (err) => {
                        console.error('Error al resolver el reporte:', err);
                        Swal.fire('Error', 'No se pudo procesar el reporte.', 'error');
                    }
                });
            }
        });
    }
}