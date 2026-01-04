import { Component, OnDestroy, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-deploy',
  templateUrl: './deploy.component.html',
  styleUrls: ['./deploy.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DeployComponent implements OnInit, OnDestroy {
  private apiUrl = environment.apiUrl;
  repoUrl: string = '';
  branch: string = '';          
  language: string = '';         
  email: string = '';            
  hostPort: number | null = null;

  showModal: boolean = false;
  activeTab: string = 'pipeline';

  pipelineStages = [
    { id: 1, name: 'Source' },
    { id: 2, name: 'Build' },
    { id: 3, name: 'Dockerize' },
    { id: 4, name: 'Deploy' }
  ];
  currentStageIndex: number = -1;

  isLoading: boolean = false;
  message: string = 'Listo para desplegar.';
  isError: boolean = false;
  targetBuildNumber: number = 0;
  liveLogs: string = '> Esperando inicio...';
  intervalId: any = null;
  startTime: number = 0;
  isDetecting: boolean = false;
  detectedMessage: string = '';
  isTechLocked: boolean = false;

  deployedRepo: string = '';
  deployedBranch: string = '';
  deployedPort: number | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit() {
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  openModal() { 
    if (this.isLoading) return; 
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
    setTimeout(() => {
        this.resetForm();
    }, 200);
}
  
  switchTab(tab: string) { this.activeTab = tab; }

onDeploy(form: NgForm) {
    

    if (form.invalid) {

        Object.values(form.controls).forEach(control => {
            control.markAsTouched();
        });
        return; 
    }

    this.isLoading = true;
    this.isError = false;
    this.showModal = false; 
    this.message = 'Iniciando Pipeline...';
    this.currentStageIndex = 0;
    this.liveLogs = '> Inicializando conexión...';
    this.startTime = Date.now();

    if (this.intervalId) clearInterval(this.intervalId);


    this.deployedRepo = this.repoUrl;
    this.deployedBranch = this.branch;
    this.deployedPort = this.hostPort;

    const payload = { 
        repoUrl: this.repoUrl, 
        branch: this.branch, 
        language: this.language, 
        email: this.email, 
        hostPort: this.hostPort 
    };

    this.http.post<any>(`${this.apiUrl}/api/deploy`, payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.targetBuildNumber = res.expectedBuild;
          this.startPolling();
          this.closeModal();
        } else {
          this.handleError('Orden rechazada.');

        }
      },
      error: (err) => {
        this.handleError('Error de conexión.');
      }
    });
}

detectTech() {
    if (!this.repoUrl) return;


    this.isDetecting = true;
    this.isTechLocked = false;
    
    this.cdr.detectChanges(); 

    const payload = { 
        repoUrl: this.repoUrl, 
        branch: this.branch || 'main' 
    };

    this.http.post<any>(`${this.apiUrl}/api/detect-tech`, payload).subscribe({
        next: (res) => {

            setTimeout(() => {
                this.zone.run(() => {
                    
                    this.isDetecting = false;
                    
                    if (res.detected === 'node' || res.detected === 'java') {
                        this.language = res.detected;
                        this.isTechLocked = true;
                        this.showToast('success', `¡Detectado proyecto ${res.detected.toUpperCase()}!`);
                    } else {
                        this.showToast('warning', 'No se pudo detectar el lenguaje. Elige manual.');
                        this.isTechLocked = false;
                        this.language = '';
                    }

                    this.cdr.detectChanges();
                });
            }, 100); 
        },
        error: (err) => {
            setTimeout(() => {
                this.zone.run(() => {
                    this.isDetecting = false;
                    this.isTechLocked = false;
                    this.showToast('error', 'Error al conectar con el repositorio.');
                    this.cdr.detectChanges();
                });
            }, 100);
        }
    });
}
  
  onUrlChange() {
    if (this.isTechLocked) {
        this.isTechLocked = false;
    }
  }

showToast(icon: any, title: string) {
      Swal.fire({ 
        toast: true, position: 'top-end', showConfirmButton: false, 
        timer: 3000, icon: icon, title: title 
      });
  }

  resetForm() {
    // Campos del formulario
    this.repoUrl = '';
    this.branch = '';       
    this.language = '';     
    this.hostPort = null;   
    this.email = '';

    // Estados de la interfaz
    this.isTechLocked = false; 
    this.isDetecting = false;  
    this.isLoading = false;
    this.isError = false;
    
}

updateStageFromLogs(logs: string) {
    if (!logs) return;
    
    // FASE 4: DEPLOY (Cubre despliegue + email)
    if (logs.includes('--- [STAGE: DEPLOY] ---')) {
        if (this.currentStageIndex !== 3) this.currentStageIndex = 3;
    } 
    // FASE 3: DOCKERIZE
    else if (logs.includes('--- [STAGE: DOCKERIZE] ---')) {
        if (this.currentStageIndex !== 2) this.currentStageIndex = 2;
    } 
    // FASE 2: BUILD
    else if (logs.includes('--- [STAGE: BUILD] ---')) {
        if (this.currentStageIndex !== 1) this.currentStageIndex = 1;
    } 
    // FASE 1: SOURCE
    else if (logs.includes('--- [STAGE: SOURCE] ---')) {
        if (this.currentStageIndex !== 0) this.currentStageIndex = 0;
    }
}

startPolling() {
    this.currentStageIndex = 0; 
    this.message = 'Iniciando conexión...';
    this.isLoading = true; 
    this.isError = false;
    this.cdr.detectChanges(); 

    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      this.http.get<any>(`${this.apiUrl}/api/status`).subscribe({
        next: (status) => {
          this.zone.run(() => {
            
            if (status.number < this.targetBuildNumber) {
                return; 
            }

            // --- CASO A: TRABAJANDO ---
            if (status.building) {
                
                this.isLoading = true; 
                this.isError = false;

                this.http.get(`${this.apiUrl}/api/logs` + status.number, { responseType: 'text' })
                    .subscribe(logs => {
                        this.zone.run(() => {
                            if (logs) this.updateStageFromLogs(logs);
                            
                            const currentName = this.pipelineStages[this.currentStageIndex]?.name || 'Procesando';
                            this.message = `Ejecutando Fase: ${currentName}...`;
                            
                            this.cdr.detectChanges(); 
                        });
                    });
            } 
            
            // --- CASO B: TERMINÓ ---
            else if (status.result) {
                clearInterval(this.intervalId);
                this.intervalId = null;
                
                this.isLoading = false; 
                
                const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);

                if (status.result === 'SUCCESS') {
                    this.currentStageIndex = 3; 
                    this.isError = false;
                    this.message = `¡Despliegue Completado! v${status.number}`;
                    
                    this.cdr.detectChanges(); 

                    setTimeout(() => {
                        this.showSummaryModal('success', status.number, duration);
                    }, 500);
                } else {
                    this.isError = true;
                    this.message = 'El despliegue falló.';
                    this.cdr.detectChanges();
                    this.showSummaryModal('error', status.number, duration);
                }
            }
          });
        },
        error: (err) => console.error(err)
      });
    }, 2000);
}

fetchLogs(buildNumber: number) {
    this.http.get(`${this.apiUrl}/api/logs` + buildNumber, { responseType: 'text' })
      .subscribe(logs => {
          this.liveLogs = logs || 'Esperando logs...';
          // Solo si hay logs, intentamos actualizar la bolita
          if (logs) this.updateStageFromLogs(logs); 
      });
}

showSummaryModal(type: 'success' | 'error', buildId: number, duration: string) {
    const isSuccess = type === 'success';
    
    // Extraemos el nombre limpio del repo guardado
    const repoName = this.deployedRepo.split('/').pop()?.replace('.git', '') || 'Desconocido';

    Swal.fire({
      title: isSuccess ? '¡Despliegue Completado!' : 'El Despliegue Falló',
      icon: isSuccess ? 'success' : 'error',
      html: `
        <div class="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200 text-left">
          <div class="grid grid-cols-2 gap-2">
            <span class="font-bold text-slate-700">Repositorio:</span>
            <span class="truncate" title="${this.deployedRepo}">${repoName}</span>
            
            <span class="font-bold text-slate-700">Ambiente/Rama:</span>
            <span class="font-mono text-indigo-600 bg-indigo-50 px-1 rounded">${this.deployedBranch}</span>
            
            <span class="font-bold text-slate-700">Puerto:</span>
            <span>${this.deployedPort || '8085'}</span>

            <span class="font-bold text-slate-700">Build ID:</span>
            <span>#${buildId}</span>
            
            <span class="font-bold text-slate-700">Tiempo Total:</span>
            <span>${duration} segundos</span>
          </div>
        </div>
        <p class="mt-4 text-xs text-slate-400">
            ${isSuccess ? 'La aplicación ya está recibiendo tráfico.' : 'Revisa la pestaña de logs para ver el error.'}
        </p>
      `,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: isSuccess ? '#10b981' : '#ef4444', 
      allowOutsideClick: false 
    }).then((result) => {
      if (result.isConfirmed) {
        this.resetVisuals();
      }
    });
}

resetVisuals() {

    this.currentStageIndex = -1; 
    this.isLoading = false;  
    this.isError = false;    
    this.message = 'Listo para desplegar.';           
    this.liveLogs = '> Esperando nuevo despliegue...';
    this.activeTab = 'pipeline'; 
    this.cdr.detectChanges();
}

  handleError(msg: string) {
    this.zone.run(() => {
        this.isLoading = false;
        this.isError = true;
        this.message = msg;
        if (this.intervalId) clearInterval(this.intervalId);
    });
  }

  onlyNumbers(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    // Solo permite números del 0-9 (ASCII 48-57)
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }
}