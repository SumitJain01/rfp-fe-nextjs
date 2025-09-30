import React from 'react';
import { Card, CardContent } from './Card';

interface ErrorAlertProps {
  title?: string;
  errors: string[];
  className?: string;
}

export function ErrorAlert({ title = "Please fix the following errors:", errors, className = '' }: ErrorAlertProps) {
  if (errors.length === 0) return null;

  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">
              {title}
            </h3>
            {errors.length === 1 ? (
              <p className="mt-1 text-sm text-red-700">
                {errors[0]}
              </p>
            ) : (
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SuccessAlertProps {
  title?: string;
  message: string;
  className?: string;
}

export function SuccessAlert({ title = "Success!", message, className = '' }: SuccessAlertProps) {
  return (
    <Card className={`border-green-200 bg-green-50 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800">
              {title}
            </h3>
            <p className="mt-1 text-sm text-green-700">
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
