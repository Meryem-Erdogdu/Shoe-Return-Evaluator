import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import PhotoUpload from '@/components/photo-upload';
import AnalysisResults from '@/components/analysis-results';
import SidebarStats from '@/components/sidebar-stats';
import ManualEditModal from '@/components/manual-edit-modal';
import type { ShoeAnalysisResult, ClassificationType } from '@/lib/types';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [currentAnalysis, setCurrentAnalysis] = useState<ShoeAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isManualEditOpen, setIsManualEditOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      return apiRequest('POST', `/api/approve-analysis/${analysisId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Sonuç onaylandı",
        description: "Analiz sonucu başarıyla onaylandı.",
      });
      // Refresh stats
      queryClient.invalidateQueries({ queryKey: ['/api/daily-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recent-analyses'] });
    },
    onError: (error) => {
      toast({
        title: "Onaylama hatası",
        description: error instanceof Error ? error.message : "Sonuç onaylanamadı",
        variant: "destructive"
      });
    }
  });

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
    setCurrentAnalysis(null);
  };

  const handleAnalysisComplete = (result: ShoeAnalysisResult) => {
    setIsAnalyzing(false);
    setCurrentAnalysis(result);
    // Refresh stats after new analysis
    queryClient.invalidateQueries({ queryKey: ['/api/daily-stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/recent-analyses'] });
  };

  const handleApprove = () => {
    if (currentAnalysis?.id) {
      approveMutation.mutate(currentAnalysis.id);
    }
  };

  const manualEditMutation = useMutation({
    mutationFn: async ({ analysisId, manualClassification, userNotes }: {
      analysisId: string;
      manualClassification: ClassificationType;
      userNotes: string;
    }) => {
      return apiRequest('POST', `/api/manual-edit/${analysisId}`, {
        manualOverride: manualClassification,
        userNotes: userNotes
      });
    },
    onSuccess: () => {
      toast({
        title: "Manuel düzenleme kaydedildi",
        description: "Analiz sonucu başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recent-analyses'] });
      setCurrentAnalysis(null);
    },
    onError: (error) => {
      toast({
        title: "Düzenleme hatası",
        description: error instanceof Error ? error.message : "Değişiklikler kaydedilemedi",
        variant: "destructive"
      });
    }
  });

  const handleManualEdit = () => {
    setIsManualEditOpen(true);
  };

  const handleManualEditSave = (manualClassification: ClassificationType, userNotes: string) => {
    if (currentAnalysis?.id) {
      manualEditMutation.mutate({
        analysisId: currentAnalysis.id,
        manualClassification,
        userNotes
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 flex items-center justify-center">
                <img 
                  src="https://kurumsal.flo.com.tr/assets/images/flo-logo-new.svg" 
                  alt="FLO Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900" data-testid="app-title">
                  FLO Group AI Sınıflandırma
                </h1>
                <p className="text-sm text-gray-500">Ayakkabı Durum Analizi</p>
              </div>
            </div>


            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600" data-testid="system-status">Sistem Aktif</span>
              </div>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">

            {/* Photo Upload */}
            <PhotoUpload 
              onAnalysisStart={handleAnalysisStart}
              onAnalysisComplete={handleAnalysisComplete}
            />

            {/* Analysis Results */}
            {isAnalyzing ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analiz Ediliyor...</h3>
                  <p className="text-gray-500">AI ayakkabı durumunu değerlendiriyor</p>
                </div>
              </div>
            ) : (
              <AnalysisResults 
                result={currentAnalysis}
                onApprove={handleApprove}
                onManualEdit={handleManualEdit}
              />
            )}
          </div>

          {/* Sidebar */}
          <SidebarStats />
        </div>
      </div>

      {/* Manual Edit Modal */}
      {currentAnalysis && (
        <ManualEditModal
          isOpen={isManualEditOpen}
          onClose={() => setIsManualEditOpen(false)}
          result={currentAnalysis}
          onSave={handleManualEditSave}
        />
      )}
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-lg max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Ayarlar</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-6">
              {/* System Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sistem Bilgileri</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">AI Motor:</span>
                    <span className="text-gray-900">Google Gemini 2.5 Pro</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Versiyon:</span>
                    <span className="text-gray-900">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">API Durumu:</span>
                    <span className="text-green-600">✓ Aktif</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                onClick={() => setIsSettingsOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-3xl"
              >
                Tamam
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}