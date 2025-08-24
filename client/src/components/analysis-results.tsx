import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Edit, ThumbsUp, AlertTriangle } from 'lucide-react';
import type { ShoeAnalysisResult, ClassificationType } from '@/lib/types';
import { CLASSIFICATION_LABELS, CLASSIFICATION_COLORS, CLASSIFICATION_ICONS } from '@/lib/types';

interface AnalysisResultsProps {
  result: ShoeAnalysisResult | null;
  onApprove: () => void;
  onManualEdit: () => void;
}

export default function AnalysisResults({ result, onApprove, onManualEdit }: AnalysisResultsProps) {
  if (!result) {
    return (
      <Card className="bg-white rounded-3xl border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analiz Bekleniyor</h3>
            <p className="text-gray-500">Fotoğraf yükleyerek analizi başlatın</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getClassificationColor = (classification: string) => {
    const colors = {
      returnable: 'bg-emerald-500',
      not_returnable: 'bg-gray-500',
      send_back: 'bg-indigo-500', 
      donation: 'bg-amber-500',
      disposal: 'bg-red-500'
    };
    return colors[classification as keyof typeof colors] || 'bg-gray-500';
  };

  const getClassificationIcon = (classification: string) => {
    const icons = {
      returnable: '✓',
      not_returnable: '⚠',
      send_back: '↑',
      donation: '♥',
      disposal: '✕'
    };
    return icons[classification as keyof typeof icons] || '?';
  };

  return (
    <Card className="bg-white rounded-3xl border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Analiz Sonuçları</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600 font-medium">Tamamlandı</span>
          </div>
        </div>

        {/* Shoe Model and Warranty Info */}
        {(result.shoeModel || result.warrantyPeriod) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {result.shoeModel && (
              <div className="bg-blue-50 border-0 rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <h4 className="font-medium text-gray-900">Ayakkabı Modeli</h4>
                </div>
                <p className="text-lg font-semibold text-blue-700" data-testid="shoe-model">
                  {result.shoeModel}
                </p>
              </div>
            )}
            
            {result.warrantyPeriod && (
              <div className="bg-green-50 border-0 rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <h4 className="font-medium text-gray-900">Garanti Süresi</h4>
                </div>
                <p className="text-lg font-semibold text-green-700" data-testid="warranty-period">
                  {result.warrantyPeriod} Ay
                </p>
              </div>
            )}
          </div>
        )}

        {/* Primary Classification Result */}
        <div className={`rounded-3xl p-4 mb-6 ${
          result.classification === 'returnable' ? 'bg-emerald-50 border border-emerald-100' :
          result.classification === 'not_returnable' ? 'bg-gray-50 border border-gray-100' :
          result.classification === 'send_back' ? 'bg-indigo-50 border border-indigo-100' :
          result.classification === 'donation' ? 'bg-amber-50 border border-amber-100' :
          'bg-red-50 border border-red-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${getClassificationColor(result.classification)} rounded-full flex items-center justify-center`}>
                <span className="text-white font-bold" data-testid="classification-icon">
                  {getClassificationIcon(result.classification)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900" data-testid="classification-label">
                  {CLASSIFICATION_LABELS[result.classification]}
                </h3>
                <p className="text-sm text-gray-600" data-testid="classification-description">
                  {result.classification === 'returnable' && 'Ürün iyi durumda, müşteriye iade edilebilir'}
                  {result.classification === 'not_returnable' && 'Ürün iade edilemez durumda'}
                  {result.classification === 'send_back' && 'Üretim hatası veya kalite sorunu, firmaya geri gönderilmeli'}
                  {result.classification === 'donation' && 'Kullanımlı ama işlevsel, bağış için uygun'}
                  {result.classification === 'disposal' && 'Ağır hasar, hijyen sorunu veya işlevsiz, imha edilmeli'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{color: getClassificationColor(result.classification).replace('bg-', '#')}} data-testid="confidence-score">
                {Math.round(result.confidence * 100)}%
              </div>
              <div className="text-sm text-gray-500">Güven Skoru</div>
            </div>
          </div>
        </div>

        {/* Detailed Classification Scores */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-gray-900">Detaylı Sınıflandırma Skorları</h4>
          
          {Object.entries(result.scores).map(([category, score]) => (
            <div key={category} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 ${getClassificationColor(category)} rounded-full`}></div>
                <span className="text-sm font-medium text-gray-700" data-testid={`score-label-${category}`}>
                  {CLASSIFICATION_LABELS[category as keyof typeof CLASSIFICATION_LABELS]}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32">
                  <Progress value={(score as number) * 100} className="h-2" />
                </div>
                <span className="text-sm font-medium text-gray-900 w-8" data-testid={`score-value-${category}`}>
                  {Math.round((score as number) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* AI Features Detected */}
        <div className="bg-gray-50 rounded-3xl p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">AI Tespit Edilen Özellikler</h4>
          <div className="flex flex-wrap gap-2">
            {result.features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800" data-testid={`feature-${index}`}>
                {feature}
              </Badge>
            ))}
            {result.damageReasons.length > 0 && result.damageReasons.map((reason, index) => (
              <Badge key={`damage-${index}`} variant="destructive" className="bg-red-100 text-red-800" data-testid={`damage-${index}`}>
                {reason}
              </Badge>
            ))}
          </div>
        </div>

        {/* User Error Detection */}
        {result.isUserError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-4 mb-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <h4 className="font-medium text-yellow-800">Kullanıcı Hatası Tespit Edildi</h4>
            </div>
            <p className="text-sm text-yellow-700" data-testid="user-error-reason">
              {result.userErrorReason}
            </p>
          </div>
        )}

        {/* Customer Notes */}
        {result.customerNotes && (
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 mb-4">
            <h4 className="font-medium text-blue-800 mb-2">Müşteri Açıklamaları</h4>
            <p className="text-sm text-blue-700" data-testid="customer-notes">
              "{result.customerNotes}"
            </p>
          </div>
        )}

        {/* AI Reasoning */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-2">AI Açıklama</h4>
          <p className="text-sm text-gray-600" data-testid="ai-reasoning">
            {result.reasoning}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={onManualEdit}
            className="inline-flex items-center"
            data-testid="button-manual-edit"
          >
            <Edit className="w-4 h-4 mr-2" />
            Manuel Düzenleme
          </Button>
          
          <Button 
            onClick={onApprove}
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700"
            data-testid="button-approve"
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Sonucu Onayla
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
