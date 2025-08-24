import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CLASSIFICATION_LABELS } from '@/lib/types';
import type { ClassificationType, ShoeAnalysisResult } from '@/lib/types';

interface ManualEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ShoeAnalysisResult;
  onSave: (manualClassification: ClassificationType, userNotes: string) => void;
}

export default function ManualEditModal({ 
  isOpen, 
  onClose, 
  result, 
  onSave 
}: ManualEditModalProps) {
  const [manualClassification, setManualClassification] = useState<ClassificationType>(result.classification);
  const [userNotes, setUserNotes] = useState('');

  const handleSave = () => {
    onSave(manualClassification, userNotes);
    onClose();
  };

  const handleCancel = () => {
    setManualClassification(result.classification);
    setUserNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manuel Düzenleme</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* AI Analysis Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">AI Analiz Sonucu</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Sınıflandırma:</strong> {CLASSIFICATION_LABELS[result.classification]}</p>
              <p><strong>Güven:</strong> {Math.round(result.confidence * 100)}%</p>
              {result.shoeModel && (
                <p><strong>Model:</strong> {result.shoeModel}</p>
              )}
              {result.warrantyPeriod && (
                <p><strong>Garanti:</strong> {result.warrantyPeriod} ay</p>
              )}
            </div>
          </div>

          {/* Manual Classification Override */}
          <div className="space-y-2">
            <Label htmlFor="manual-classification">Manuel Sınıflandırma</Label>
            <Select
              value={manualClassification}
              onValueChange={(value: ClassificationType) => setManualClassification(value)}
            >
              <SelectTrigger data-testid="select-classification">
                <SelectValue placeholder="Sınıflandırma seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="returnable">İade kabul edildi </SelectItem>
                <SelectItem value="not_returnable">İade kabul edilmedi kullanıcı hatası vs. </SelectItem>
                <SelectItem value="send_back">İade kabul edildi , firma üretim hatası var </SelectItem>
                <SelectItem value="donation">İade kabul edildi  bağışlanacak</SelectItem>
                <SelectItem value="disposal">İade kabul edildi ama durumu kötü imha </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Notes */}
          <div className="space-y-2">
            <Label htmlFor="user-notes">Kullanıcı Notları</Label>
            <Textarea
              id="user-notes"
              placeholder="Özel durum açıklaması veya notlarınızı yazın... 
Örnek: Müşteri ayakkabının burununda çizik olduğunu belirtti"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              rows={4}
              className="resize-none"
              data-testid="textarea-user-notes"
            />
          </div>

          {/* Change Reason */}
          {manualClassification !== result.classification && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Değişiklik:</strong> AI önerisi "{CLASSIFICATION_LABELS[result.classification]}" yerine 
                "{CLASSIFICATION_LABELS[manualClassification]}" seçildi.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            data-testid="button-cancel"
          >
            İptal
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-save-manual"
          >
            Kaydet ve Onayla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}