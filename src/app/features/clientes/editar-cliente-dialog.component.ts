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
import { ActualizarClienteRequest, Cliente } from '../../core/models';
import { ClienteService } from '../../core/services/cliente.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
    MatSnackBarModule,
  ]
})
export class EditarClienteDialogComponent {
  private fb         = inject(FormBuilder);
  private dialogRef  = inject(MatDialogRef<EditarClienteDialogComponent>);
  private service    = inject(ClienteService);
  private snackBar   = inject(MatSnackBar);
  readonly cliente: Cliente = inject(MAT_DIALOG_DATA);

  guardando = false;

  form = this.fb.group({
    tipoDocumento:    [this.cliente.tipoDocumento, Validators.required],
    numeroDocumento:  [this.cliente.numeroDocumento, Validators.required],
    nombres:          [this.cliente.nombres, [Validators.required, Validators.minLength(2)]],
    apellidoPaterno:  [this.cliente.apellidoPaterno, Validators.required],
    apellidoMaterno:  [this.cliente.apellidoMaterno ?? ''],
    fechaCumpleanios: [this.cliente.fechaCumpleanios ? new Date(this.cliente.fechaCumpleanios) : null as Date | null],
    fechaBoda:        [new Date(this.cliente.fechaBoda), Validators.required],
    celular:          [this.cliente.celular ?? ''],
    email:            [this.cliente.email ?? '', Validators.email],
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
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
    };

    this.guardando = true;
    this.service.actualizarCliente(this.cliente.id, request).subscribe({
      next: (actualizado) => {
        this.guardando = false;
        this.dialogRef.close(actualizado);
      },
      error: () => {
        this.guardando = false;
        this.snackBar.open('Error al actualizar el cliente', '✗', { duration: 4000 });
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
