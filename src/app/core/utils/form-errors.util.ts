import { FormArray, FormGroup } from '@angular/forms';

export function collectFormErrors(
  form: FormGroup,
  labels: Record<string, string>
): string[] {
  const messages: string[] = [];

  Object.entries(form.controls).forEach(([key, control]) => {
    if (control instanceof FormArray) {
      control.controls.forEach((item, i) => {
        if (item instanceof FormGroup) {
          Object.entries(item.controls).forEach(([subKey, sub]) => {
            if (sub.invalid && sub.errors) {
              const label = labels[`${key}.${subKey}`] ?? subKey;
              appendErrors(messages, `${label} (ítem ${i + 1})`, sub.errors);
            }
          });
        }
      });
    } else if (control.invalid && control.errors) {
      const label = labels[key] ?? key;
      appendErrors(messages, label, control.errors);
    }
  });

  return messages;
}

function appendErrors(messages: string[], label: string, errors: Record<string, unknown>): void {
  if (errors['required'])   messages.push(`${label}: campo requerido`);
  if (errors['email'])      messages.push(`${label}: email inválido`);
  if (errors['minlength']) {
    const min = (errors['minlength'] as any).requiredLength;
    messages.push(`${label}: mínimo ${min} caracteres`);
  }
  if (errors['min']) {
    const min = (errors['min'] as any).min;
    messages.push(`${label}: valor mínimo ${min}`);
  }
}
