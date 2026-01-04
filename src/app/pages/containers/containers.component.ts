import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // Agregado OnDestroy, CDR
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-containers',
  templateUrl: './containers.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class ContainersComponent implements OnInit, OnDestroy {
  private apiUrl = environment.apiUrl;
  containers: any[] = [];
  loading = true;
  processingAction: string | null = null;

// Variables para Logs
  showLogsModal: boolean = false;
  selectedContainerLogs: string = '';
  selectedContainerName: string = '';
  logInterval: any = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchContainers();
  }

  ngOnDestroy() {
    this.stopLogPolling();
  }

fetchContainers() {
    this.loading = true;

    this.http.get<any[]>(`${this.apiUrl}/api/containers`).subscribe({
      next: (data) => {
        this.containers = data;
        this.loading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error al cargar:', err);
        this.loading = false;
        this.cdr.detectChanges(); 
      }
    });
  }

  refresh() {
    this.fetchContainers();
  }

  openLogs(containerId: string, name: string) {
    this.selectedContainerName = name;
    this.showLogsModal = true;
    this.selectedContainerLogs = 'Cargando logs...';
    
    this.fetchLogs(containerId);
    if (this.logInterval) clearInterval(this.logInterval);
    this.logInterval = setInterval(() => {
        if(this.showLogsModal) {
            this.fetchLogs(containerId);
        }
    }, 3000);
  }

fetchLogs(id: string) {
    const url = `${this.apiUrl}/api/containers/${id}/logs`;

    this.http.get<any>(url).subscribe({
      next: (response) => {
        if (response && response.logs) {
            this.selectedContainerLogs = response.logs;
            this.cdr.detectChanges(); 
        }
      },
      error: (err) => {
        console.error(err);
        this.selectedContainerLogs = 'Error al leer logs.';
        this.cdr.detectChanges();
      }
    });
  }

  closeLogs() {
    this.showLogsModal = false;
    this.stopLogPolling();
  }

  stopLogPolling() {
    if (this.logInterval) {
        clearInterval(this.logInterval);
        this.logInterval = null;
    }
  }

  stopContainer(id: string) {
    Swal.fire({
      title: '¿Detener Contenedor?',
      text: "El servicio dejará de estar disponible, pero no se borrarán los datos.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#64748b', 
      confirmButtonText: 'Sí, detener',
      cancelButtonText: 'Cancelar',
      background: '#f8fafc', 
      customClass: {
        popup: 'rounded-xl shadow-xl border border-slate-200'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeStop(id);
      }
    });
  }

  executeStop(id: string) {
    this.processingAction = id;
    this.http.post(`${this.apiUrl}/api/containers/${id}/stop`, {}).subscribe({
      next: () => {
        this.processingAction = null;
        this.showToast('success', 'Contenedor detenido correctamente');
        this.fetchContainers();
      },
      error: () => {
        this.processingAction = null;
        this.showToast('error', 'No se pudo detener el contenedor');
      }
    });
  }

  deleteContainer(id: string) {
    Swal.fire({
      title: '¿Eliminar permanentemente?',
      text: "¡No podrás revertir esto! El contenedor se borrará para siempre.",
      icon: 'error', 
      showCancelButton: true,
      confirmButtonColor: '#ef4444', 
      cancelButtonColor: '#64748b', 
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#fff1f2',
      customClass: {
        popup: 'rounded-xl shadow-xl'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeDelete(id);
      }
    });
  }

  executeDelete(id: string) {
    this.processingAction = id;
    this.http.delete(`${this.apiUrl}/api/containers/${id}`).subscribe({
      next: () => {
        this.processingAction = null;
        this.showToast('success', 'Contenedor eliminado');
        this.fetchContainers();
      },
      error: () => {
        this.processingAction = null;
        this.showToast('error', 'No se pudo eliminar el contenedor');
      }
    });
  }

  showToast(icon: 'success' | 'error', title: string) {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    });

    Toast.fire({
      icon: icon,
      title: title
    });
  }
}