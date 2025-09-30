/**
 * Validation utilities for form validation
 * 
 * This file contains reusable validation functions and error message generators
 * to ensure consistent validation across all forms in the application.
 */

// Form data types are defined locally in this file

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Email validation
 */
export const validateEmail = (email: string): FieldValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

/**
 * Password validation
 */
export const validatePassword = (password: string): FieldValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }
  
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  if (!hasLowerCase || !hasUpperCase || !hasNumbers) {
    return { 
      isValid: false, 
      error: 'Password must contain at least one lowercase letter, one uppercase letter, and one number' 
    };
  }
  
  return { isValid: true };
};

/**
 * Username validation
 */
export const validateUsername = (username: string): FieldValidationResult => {
  if (!username.trim()) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }
  
  if (username.length > 30) {
    return { isValid: false, error: 'Username cannot exceed 30 characters' };
  }
  
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { isValid: true };
};

/**
 * Phone number validation
 */
export const validatePhone = (phone: string): FieldValidationResult => {
  if (!phone.trim()) {
    return { isValid: true }; // Phone is optional
  }
  
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(phone)) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }
  
  return { isValid: true };
};

/**
 * Required field validation
 */
export const validateRequired = (value: string, fieldName: string): FieldValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  return { isValid: true };
};

/**
 * Length validation
 */
export const validateLength = (
  value: string, 
  fieldName: string, 
  min?: number, 
  max?: number
): FieldValidationResult => {
  if (min && value.length < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min} characters long` };
  }
  
  if (max && value.length > max) {
    return { isValid: false, error: `${fieldName} cannot exceed ${max} characters` };
  }
  
  return { isValid: true };
};

/**
 * Number validation
 */
export const validateNumber = (
  value: string, 
  fieldName: string, 
  min?: number, 
  max?: number
): FieldValidationResult => {
  if (!value.trim()) {
    return { isValid: true }; // Empty is valid for optional fields
  }
  
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (min !== undefined && numValue < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }
  
  if (max !== undefined && numValue > max) {
    return { isValid: false, error: `${fieldName} cannot exceed ${max}` };
  }
  
  return { isValid: true };
};

/**
 * Date validation
 */
export const validateDate = (dateString: string, fieldName: string): FieldValidationResult => {
  if (!dateString.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return { isValid: false, error: `${fieldName} must be a valid date` };
  }
  
  const now = new Date();
  if (date <= now) {
    return { isValid: false, error: `${fieldName} must be in the future` };
  }
  
  return { isValid: true };
};

/**
 * Array validation (for requirements, evaluation criteria)
 */
export const validateArray = (
  array: string[], 
  fieldName: string, 
  minItems?: number
): FieldValidationResult => {
  const filteredArray = array.filter(item => item.trim() !== '');
  
  if (minItems && filteredArray.length < minItems) {
    return { 
      isValid: false, 
      error: `At least ${minItems} ${fieldName.toLowerCase()} ${minItems === 1 ? 'is' : 'are'} required` 
    };
  }
  
  return { isValid: true };
};

/**
 * Budget range validation
 */
export const validateBudgetRange = (minBudget: string, maxBudget: string): FieldValidationResult => {
  if (!minBudget.trim() && !maxBudget.trim()) {
    return { isValid: true }; // Both empty is valid
  }
  
  if (minBudget.trim() && maxBudget.trim()) {
    const min = parseFloat(minBudget);
    const max = parseFloat(maxBudget);
    
    if (isNaN(min) || isNaN(max)) {
      return { isValid: false, error: 'Budget values must be valid numbers' };
    }
    
    if (min > max) {
      return { isValid: false, error: 'Minimum budget cannot be greater than maximum budget' };
    }
  }
  
  return { isValid: true };
};

/**
 * Confirm password validation
 */
export const validateConfirmPassword = (password: string, confirmPassword: string): FieldValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  
  return { isValid: true };
};

/**
 * Full form validation for RFP creation
 */
export interface RFPFormData {
  title: string;
  description: string;
  category: string;
  budget_min: string;
  budget_max: string;
  deadline: string;
  requirements: string[];
  evaluation_criteria: string[];
  terms_and_conditions: string;
  status: 'draft' | 'published';
}

export const validateRFPForm = (formData: RFPFormData): ValidationResult => {
  const errors: string[] = [];
  
  // Title validation
  const titleValidation = validateRequired(formData.title, 'Title');
  if (!titleValidation.isValid) errors.push(titleValidation.error!);
  
  const titleLengthValidation = validateLength(formData.title, 'Title', 5, 200);
  if (!titleLengthValidation.isValid) errors.push(titleLengthValidation.error!);
  
  // Category validation
  const categoryValidation = validateRequired(formData.category, 'Category');
  if (!categoryValidation.isValid) errors.push(categoryValidation.error!);
  
  // Description validation
  const descriptionValidation = validateRequired(formData.description, 'Description');
  if (!descriptionValidation.isValid) errors.push(descriptionValidation.error!);
  
  const descriptionLengthValidation = validateLength(formData.description, 'Description', 10, 5000);
  if (!descriptionLengthValidation.isValid) errors.push(descriptionLengthValidation.error!);
  
  // Deadline validation
  const deadlineValidation = validateDate(formData.deadline, 'Deadline');
  if (!deadlineValidation.isValid) errors.push(deadlineValidation.error!);
  
  // Budget validation
  const budgetMinValidation = validateNumber(formData.budget_min, 'Minimum budget', 0);
  if (!budgetMinValidation.isValid) errors.push(budgetMinValidation.error!);
  
  const budgetMaxValidation = validateNumber(formData.budget_max, 'Maximum budget', 0);
  if (!budgetMaxValidation.isValid) errors.push(budgetMaxValidation.error!);
  
  const budgetRangeValidation = validateBudgetRange(formData.budget_min, formData.budget_max);
  if (!budgetRangeValidation.isValid) errors.push(budgetRangeValidation.error!);
  
  // Requirements validation
  const requirementsValidation = validateArray(formData.requirements, 'requirement', 1);
  if (!requirementsValidation.isValid) errors.push(requirementsValidation.error!);
  
  // Evaluation criteria validation
  const criteriaValidation = validateArray(formData.evaluation_criteria, 'evaluation criterion', 1);
  if (!criteriaValidation.isValid) errors.push(criteriaValidation.error!);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Full form validation for user registration
 */
export interface RegistrationFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  role: 'buyer' | 'supplier';
  company_name?: string;
  phone?: string;
}

export const validateRegistrationForm = (formData: RegistrationFormData): ValidationResult => {
  const errors: string[] = [];
  
  // Username validation
  const usernameValidation = validateUsername(formData.username);
  if (!usernameValidation.isValid) errors.push(usernameValidation.error!);
  
  // Email validation
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) errors.push(emailValidation.error!);
  
  // Password validation
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) errors.push(passwordValidation.error!);
  
  // Confirm password validation
  const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
  if (!confirmPasswordValidation.isValid) errors.push(confirmPasswordValidation.error!);
  
  // Full name validation
  const fullNameValidation = validateRequired(formData.full_name, 'Full name');
  if (!fullNameValidation.isValid) errors.push(fullNameValidation.error!);
  
  const fullNameLengthValidation = validateLength(formData.full_name, 'Full name', 2, 100);
  if (!fullNameLengthValidation.isValid) errors.push(fullNameLengthValidation.error!);
  
  // Role validation
  if (!formData.role || !['buyer', 'supplier'].includes(formData.role)) {
    errors.push('Please select a valid role');
  }
  
  // Phone validation (optional)
  if (formData.phone) {
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) errors.push(phoneValidation.error!);
  }
  
  // Company name validation (optional)
  if (formData.company_name) {
    const companyNameLengthValidation = validateLength(formData.company_name, 'Company name', 0, 100);
    if (!companyNameLengthValidation.isValid) errors.push(companyNameLengthValidation.error!);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Full form validation for user login
 */
export interface LoginFormData {
  username: string;
  password: string;
}

export const validateLoginForm = (formData: LoginFormData): ValidationResult => {
  const errors: string[] = [];
  
  // Username validation
  const usernameValidation = validateRequired(formData.username, 'Username');
  if (!usernameValidation.isValid) errors.push(usernameValidation.error!);
  
  // Password validation
  const passwordValidation = validateRequired(formData.password, 'Password');
  if (!passwordValidation.isValid) errors.push(passwordValidation.error!);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
