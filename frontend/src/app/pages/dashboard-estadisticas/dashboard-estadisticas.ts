import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstadisticasService } from '../../core/services/estadisticas.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart,PieController,ArcElement,LineController,CategoryScale,LinearScale,PointElement,LineElement,BarController,BarElement,Title,Tooltip,Legend } from 'chart.js';
import Swal from 'sweetalert2';

Chart.register(
    PieController,
    ArcElement, 
    LineController,
    CategoryScale, 
    LinearScale,  
    PointElement,
    LineElement,
    BarController,
    BarElement,
    Title,
    Tooltip,
    Legend
);


@Component({
    selector: 'app-dashboard-estadisticas',
    standalone: true,
    imports: [CommonModule, FormsModule, BaseChartDirective],
    templateUrl: './dashboard-estadisticas.html',
    styleUrl: './dashboard-estadisticas.css', 
    providers: [EstadisticasService]
})

export class DashboardEstadisticasComponent implements OnInit {
    fechaInicio: string = '';
    fechaFin: string = '';
    
    // Gráfico 1: Publicaciones por Usuario (Torta)
    public pieChartData: ChartData<'pie'> = {
        labels: [],
        datasets: [{ data: [], label: 'Publicaciones' }],
    };
    public pieChartType: ChartType = 'pie';
    public pieChartOptions: ChartConfiguration['options'] = { responsive: true, plugins: { legend: { position: 'top' } } };

    // Gráfico 2: Comentarios Totales Diarios (Líneas)
    public lineChartData: ChartData<'line'> = {
        labels: [],
        datasets: [{ data: [], label: 'Comentarios Diarios', tension: 0.5, borderColor: '#42A5F5', backgroundColor: 'rgba(66, 165, 245, 0.2)' }],
    };
    public lineChartType: ChartType = 'line';
    public lineChartOptions: ChartConfiguration['options'] = { responsive: true, maintainAspectRatio: false };

    // Gráfico 3: Comentarios por Publicación (Barras)
    public barChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [{ data: [], label: 'Comentarios por Publicación', backgroundColor: '#FFA726' }],
    };
    public barChartType: ChartType = 'bar';
    public barChartOptions: ChartConfiguration['options'] = { responsive: true, plugins: { legend: { position: 'top' } } };

    public loginsBarChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [{ data: [], label: 'Ingresos (Logins) por Usuario', backgroundColor: '#36A2EB' }],
    };
    public loginsBarChartType: ChartType = 'bar';
    public loginsBarChartOptions: ChartConfiguration['options'] = { responsive: true };
    
      // Gráfico 5: Visitas a mi perfil (Líneas)
    public profileViewsLineChartData: ChartData<'line'> = {
        labels: [],
        datasets: [{ data: [], label: 'Visitas a Perfil', tension: 0.4, borderColor: '#FF6384', backgroundColor: 'rgba(255, 99, 132, 0.2)' }],
    };
    public profileViewsLineChartType: ChartType = 'line';
    public profileViewsLineChartOptions: ChartConfiguration['options'] = { responsive: true, maintainAspectRatio: false };
    
      // Gráfico 6: Me gusta otorgados por día (Líneas)
    public likesLineChartData: ChartData<'line'> = {
        labels: [],
        datasets: [{ data: [], label: 'Likes Otorgados', tension: 0.4, borderColor: '#FF9F40', backgroundColor: 'rgba(255, 159, 64, 0.2)' }],
    };
    public likesLineChartType: ChartType = 'line';
    public likesLineChartOptions: ChartConfiguration['options'] = { responsive: true, maintainAspectRatio: false };



    constructor(private estadisticasService: EstadisticasService) {}

    ngOnInit(): void {
        const hoy = new Date();
        const haceMucho = new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000); 
        
        this.fechaFin = this.formatDate(hoy);
        this.fechaInicio = this.formatDate(haceMucho);
        
        this.cargarEstadisticas();
    }

    formatDate(date: Date): string {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    cargarEstadisticas(): void {
        if (!this.fechaInicio || !this.fechaFin) {
        Swal.fire('Error', 'Debe seleccionar un rango de fechas.', 'error');
        return;
        }

        // Cargar Publicaciones por Usuario (Torta)
        this.estadisticasService.getPublicacionesPorUsuario(this.fechaInicio, this.fechaFin).subscribe({
        next: (data) => {
            this.pieChartData = {
            labels: data.map((d: any) => d.nombreUsuario),
            datasets: [{ data: data.map((d: any) => d.cantidad), label: 'Publicaciones' }],
            };
        },
        error: (err) => Swal.fire('Error', 'No se pudieron cargar Publicaciones por Usuario: ' + err.error.message, 'error')
        });

        // Cargar Comentarios Totales (Líneas)
        this.estadisticasService.getComentariosTotales(this.fechaInicio, this.fechaFin).subscribe({
            next: (data) => {
                this.lineChartData = {
                    labels: data.map((d: any) => d.fecha),
                    datasets: [{ 
                        data: data.map((d: any) => d.cantidad), 
                        label: 'Comentarios Diarios', 
                        tension: 0.5, 
                        borderColor: '#42A5F5', 
                        backgroundColor: 'rgba(66, 165, 245, 0.2)' 
                    }],
                };
            },
            error: (err) => Swal.fire('Error', 'No se pudieron cargar Comentarios Totales: ' + err.error.message, 'error')
        });


        // Cargar Comentarios por Publicación (Barras)
        this.estadisticasService.getComentariosPorPublicacion(this.fechaInicio, this.fechaFin).subscribe({
            next: (data) => {
                // Limitar a las 10 publicaciones con más comentarios para el gráfico
                const topData = data.slice(0, 10); 
                this.barChartData = {
                    labels: topData.map((d: any) => (d.tituloPublicacion || 'Publicación Eliminada')),
                    datasets: [{ data: topData.map((d: any) => d.cantidad), label: 'Comentarios por Publicación', backgroundColor: '#FFA726' }],
                };
            },
            error: (err) => Swal.fire('Error', 'No se pudieron cargar Comentarios por Publicación: ' + err.error.message, 'error')
        });
    
        this.estadisticasService.getLoginsPorUsuario(this.fechaInicio, this.fechaFin).subscribe({
            next: (data) => {
                this.loginsBarChartData = {
                    labels: data.map((d: any) => d.nombreUsuario),
                    datasets: [{ data: data.map((d: any) => d.cantidad), label: 'Ingresos (Logins) por Usuario' }],
                };
            },
            error: (err) => Swal.fire('Error', 'No se pudieron cargar Ingresos por Usuario: ' + err.error.message, 'error')
        });
        
          // Cantidad de visitas a mi perfil por día (Gráfico de Líneas)
        this.estadisticasService.getVisitasPerfilPorDia(this.fechaInicio, this.fechaFin).subscribe({
            next: (data) => {
                this.profileViewsLineChartData = {
                    labels: data.map((d: any) => d.fecha),
                    datasets: [{ data: data.map((d: any) => d.cantidad), label: 'Visitas a Perfil (Diarias)' }],
                };
            },
            error: (err) => Swal.fire('Error', 'No se pudieron cargar Visitas de Perfil: ' + err.error.message, 'error')
        });
    
          // Cantidad de me gusta otorgados por día (Gráfico de Líneas)
        this.estadisticasService.getLikesOtorgadosPorDia(this.fechaInicio, this.fechaFin).subscribe({
            next: (data) => {
                this.likesLineChartData = {
                    labels: data.map((d: any) => d.fecha),
                    datasets: [{ data: data.map((d: any) => d.cantidad), label: 'Likes Otorgados (Diarios)' }],
                };
            },
            error: (err) => Swal.fire('Error', 'No se pudieron cargar Likes Otorgados: ' + err.error.message, 'error')
        });
    }
}
