import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './registration.component.html',
  styles: ``
})
export class RegistrationComponent {
  isSubmitted: boolean = false;
  form: FormGroup;

  // Validador customizado para comparar senhas
  passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      // Importante: se as senhas coincidirem, removemos o erro específico, 
      // mas mantemos outros erros (como 'required') se existirem.
      const errors = confirmPassword?.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
    return null;
  };

  constructor(
    public formBuilder: FormBuilder,
    private service: AuthService,
    private toastr: ToastrService
  ) {
    this.form = this.formBuilder.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(/(?=.*[^a-zA-Z0-9])/)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, [Validators.requiredTrue]],
    }, { validators: this.passwordMatchValidator });
  }

  onSubmit() {
    this.isSubmitted = true;
    if (this.form.valid) {
      this.service.createUser(this.form.value).subscribe({
        next: (res: any) => {
          if (res.succeeded) {
            this.form.reset();
            this.isSubmitted = false;
            this.toastr.success('New user created!', 'Registration Successful');
          }
        },
        error: err => {
          if (err.error.errors) {
            err.error.errors.forEach((x: any) => {
              switch (x.code) {
                case "DuplicateUserName":
                  this.toastr.error('Username is already taken.', 'Registration failed');
                  break;
                case "DuplicateEmail":
                  this.toastr.error('Email is already taken.', 'Registration failed');
                  break;
                default:
                  this.toastr.error('Contact the developer', 'Registration failed');
                  console.log(x);
                  break;
              }
            });
          } else {
            console.error('error:', err);
          }
        }
      });
    }
  }

  hasDisplayableErrors(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control?.invalid) &&
      (this.isSubmitted || Boolean(control?.touched) || Boolean(control?.dirty));
  }
}