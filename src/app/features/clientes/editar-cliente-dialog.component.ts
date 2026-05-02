import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActualizarClienteRequest, Cliente } from '../../core/models';
import { ClienteService } from '../../core/services/cliente.service';
import { ToastService } from '../../core/services/toast.service';
import { collectFormErrors } from '../../core/utils/form-errors.util';

const LABELS: Record<string, string> = {
  tipoDocumento:   'Tipo de documento',
  numeroDocumento: 'Número de documento',
  nombres:         'Nombres',
  apellidoPaterno: 'Apellido paterno',
  fechaBoda:       'Fecha de boda',
  email:           'Email',
};

@Component({
  standalone: true,
  selector: 'app-editar-cliente-dialog',
  templateUrl: './editar-cliente-dialog.component.html',
  styleUrl: './editar-cliente-dialog.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
  ]
})
export class EditarClienteDialogComponent {
  private fb        = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<EditarClienteDialogComponent>);
  private service   = inject(ClienteService);
  private toast     = inject(ToastService);
  readonly cliente: Cliente = inject(MAT_DIALOG_DATA);

  guardando = false;

  form = this.fb.group({
    tipoDocumento:            [this.cliente.tipoDocumento, Validators.required],
    numeroDocumento:          [this.cliente.numeroDocumento, Validators.required],
    nombres:                  [this.cliente.nombres, [Validators.required, Validators.minLength(2)]],
    apellidoPaterno:          [this.cliente.apellidoPaterno, Validators.required],
    apellidoMaterno:          [this.cliente.apellidoMaterno ?? ''],
    fechaCumpleanios:         [this.cliente.fechaCumpleanios ? new Date(this.cliente.fechaCumpleanios) : null as Date | null],
    fechaBoda:                [new Date(this.cliente.fechaBoda), Validators.required],
    celular:                  [this.cliente.celular ?? ''],
    email:                    [this.cliente.email ?? '', Validators.email],
    nombreLocal:              [this.cliente.logistica?.nombreLocal ?? ''],
    direccion:                [this.cliente.logistica?.direccion ?? ''],
    ubicacionMaps:            [this.cliente.logistica?.ubicacionMaps ?? ''],
    horaLlegada:              [this.cliente.logistica?.horaLlegada ?? ''],
    horaLlegadaPorConfirmar:  [!this.cliente.logistica?.horaLlegada],
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      collectFormErrors(this.form, LABELS).forEach(msg => this.toast.error(msg));
      return;
    }

    const val = this.form.value;
    const tieneLogistica = val.nombreLocal || val.direccion || val.ubicacionMaps ||
                           (!val.horaLlegadaPorConfirmar && val.horaLlegada);

    const request: ActualizarClienteRequest = {
      tipoDocumento:    val.tipoDocumento!,
      numeroDocumento:  val.numeroDocumento!,
      nombres:          val.nombres!,
      apellidoPaterno:  val.apellidoPaterno!,
      apellidoMaterno:  val.apellidoMaterno || undefined,
      fechaCumpleanios: val.fechaCumpleanios ? (val.fechaCumpleanios as Date).toISOString() : undefined,
      fechaBoda:        (val.fechaBoda as Date).toISOString(),
      celular:          val.celular || undefined,
      email:            val.email || undefined,
      logistica: tieneLogistica ? {
        nombreLocal:   val.nombreLocal || undefined,
        direccion:     val.direccion || undefined,
        ubicacionMaps: val.ubicacionMaps || undefined,
        horaLlegada:   val.horaLlegadaPorConfirmar ? undefined : val.horaLlegada || undefined,
      } : undefined,
    };

    this.guardando = true;
    this.service.actualizarCliente(this.cliente.id, request).subscribe({
      next: (actualizado) => {
        this.guardando = false;
        this.dialogRef.close(actualizado);
      },
      error: () => {
        this.guardando = false;
        this.toast.error('Error al actualizar el cliente.');
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
