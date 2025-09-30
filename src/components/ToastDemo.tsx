'use client';

import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';

export default function ToastDemo() {
  const { success, error, warning, info } = useToast();

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Toast Notification Demo</h2>
      <div className="grid grid-cols-2 gap-4">
        <Button 
          onClick={() => success('Success!', 'This is a success message.')}
          className="bg-green-600 hover:bg-green-700"
        >
          Show Success Toast
        </Button>
        
        <Button 
          onClick={() => error('Error!', 'This is an error message.')}
          className="bg-red-600 hover:bg-red-700"
        >
          Show Error Toast
        </Button>
        
        <Button 
          onClick={() => warning('Warning!', 'This is a warning message.')}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          Show Warning Toast
        </Button>
        
        <Button 
          onClick={() => info('Info!', 'This is an info message.')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Show Info Toast
        </Button>
      </div>
    </div>
  );
}
