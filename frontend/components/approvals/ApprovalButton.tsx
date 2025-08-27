'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ApprovalConfirmDialog } from './ApprovalConfirmDialog';
import { useAuth } from '@/lib/context/AuthContext';

interface ApprovalButtonProps {
  propertyId: string;
  propertyCode: string;
  action: 'approve' | 'reject';
  onSuccess: (propertyId: string, action: string) => void;
  disabled?: boolean;
}

export function ApprovalButton({ 
  propertyId, 
  propertyCode,
  action, 
  onSuccess, 
  disabled 
}: ApprovalButtonProps) {
  const { getAuthHeaders } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleConfirm = async (data: { comments?: string; reason?: string }) => {
    setIsLoading(true);
    
    try {
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      const requestBody = action === 'approve' 
        ? { comments: data.comments || '' }
        : { reason: data.reason || '' };

      const response = await fetch(`http://localhost:8000/api/properties/${propertyId}/${endpoint}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        onSuccess(propertyId, action);
        
        // Show success message
        if (typeof window !== 'undefined' && window.alert) {
          const message = action === 'approve' 
            ? 'Əmlak uğurla təsdiq edildi!' 
            : 'Əmlak rədd edildi!';
          window.alert(message);
        }
      } else {
        throw new Error(result.error?.message || 'API error');
      }
    } catch (error) {
      console.error(`${action} error:`, error);
      
      // Show error message
      if (typeof window !== 'undefined' && window.alert) {
        const message = action === 'approve'
          ? 'Təsdiq zamanı xəta baş verdi'
          : 'Rədd etmə zamanı xəta baş verdi';
        window.alert(`${message}: ${error instanceof Error ? error.message : 'Naməlum xəta'}`);
      }
    } finally {
      setIsLoading(false);
      setShowDialog(false);
    }
  };
  
  return (
    <>
      <Button 
        onClick={() => setShowDialog(true)}
        disabled={disabled || isLoading}
        variant={action === 'approve' ? 'default' : 'destructive'}
        size="sm"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : action === 'approve' ? (
          <CheckCircle className="h-4 w-4 mr-2" />
        ) : (
          <XCircle className="h-4 w-4 mr-2" />
        )}
        {isLoading ? 'Gözləyin...' : (action === 'approve' ? 'Təsdiq Et' : 'Rədd Et')}
      </Button>
      
      <ApprovalConfirmDialog 
        open={showDialog}
        onOpenChange={setShowDialog}
        action={action}
        propertyCode={propertyCode}
        onConfirm={handleConfirm}
      />
    </>
  );
}