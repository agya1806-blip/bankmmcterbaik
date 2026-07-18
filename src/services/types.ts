export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function validResult(): ValidationResult {
  return { valid: true, errors: [] };
}

export function invalidResult(errors: ValidationError[]): ValidationResult {
  return { valid: false, errors };
}

export function requiredError(field: string): ValidationError {
  return { field, message: `${field} harus diisi` };
}

export function invalidFormatError(field: string): ValidationError {
  return { field, message: `${field} tidak valid` };
}
