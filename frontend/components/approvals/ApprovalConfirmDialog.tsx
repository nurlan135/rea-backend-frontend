'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle } from 'lucide-react';

interface ApprovalConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'approve' | 'reject';
  propertyCode: string;
  onConfirm: (data: { comments?: string; reason?: string }) => void;
}

export function ApprovalConfirmDialog({
  open,
  onOpenChange,
  action,
  propertyCode,
  onConfirm,
}: ApprovalConfirmDialogProps) {
  const [comments, setComments] = useState('');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (action === 'reject' && reason.trim().length < 10) {
      alert('Rədd etmə səbəbi ən az 10 simvol olmalıdır');
      return;
    }

    onConfirm(action === 'approve' ? { comments } : { reason });
    
    // Reset form
    setComments('');
    setReason('');
  };

  const handleCancel = () => {
    setComments('');
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'approve' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Əmlağı Təsdiq Et
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Əmlağı Rədd Et
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {action === 'approve' 
              ? `${propertyCode} kodlu əmlağı təsdiq etmək istədiyinizə əminsiniz?`
              : `${propertyCode} kodlu əmlağı rədd etmək istədiyinizə əminsiniz?`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {action === 'approve' ? (
            <div className="grid gap-2">
              <Label htmlFor="comments">
                Qeydlər (opsional)
              </Label>
              <Textarea
                id="comments"
                placeholder="Təsdiq ilə bağlı qeydlərinizi daxil edin..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="reason">
                Rədd etmə səbəbi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Rədd etmə səbəbini detallı şəkildə yazın (ən az 10 simvol)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
                required
              />
              <div className="text-sm text-gray-500">
                {reason.length}/10 minimum simvol
              </div>
            </div>
          )}

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Diqqət:</strong> Bu əməliyyat geri alına bilməz. {action === 'approve' ? 'Təsdiq edilmiş əmlaklar \"Aktiv\" statusuna keçəcək.' : 'Rədd edilmiş əmlaklar \"Rədd edilmiş\" statusuna keçəcək.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            İmtina
          </Button>
          <Button 
            type="button" 
            variant={action === 'approve' ? 'default' : 'destructive'}
            onClick={handleConfirm}
            disabled={action === 'reject' && reason.trim().length < 10}
          >
            {action === 'approve' ? 'Təsdiq Et' : 'Rədd Et'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}