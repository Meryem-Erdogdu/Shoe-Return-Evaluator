import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import type { DailyStats, RecentAnalysis } from '@/lib/types';
import { CLASSIFICATION_LABELS, CLASSIFICATION_COLORS } from '@/lib/types';

export default function SidebarStats() {
  const { data: dailyStats } = useQuery<DailyStats>({
    queryKey: ['/api/daily-stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentAnalyses } = useQuery<RecentAnalysis[]>({
    queryKey: ['/api/recent-analyses'],
    refetchInterval: 30000,
  });

  const getClassificationColor = (classification: string) => {
    const colors = {
      returnable: 'bg-emerald-500',
      send_back: 'bg-indigo-500',
      donation: 'bg-amber-500', 
      disposal: 'bg-red-500'
    };
    return colors[classification as keyof typeof colors] || 'bg-gray-500';
  };

  const getClassificationIcon = (classification: string) => {
    const icons = {
      returnable: '✓',
      send_back: '↑',
      donation: '♥',
      disposal: '✕'
    };
    return icons[classification as keyof typeof icons] || '?';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Daily Stats */}
      <Card className="bg-white rounded-3xl border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Günlük İstatistikler</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">İade Edilebilir</span>
              </div>
              <span className="text-sm font-bold text-gray-900" data-testid="stat-returnable">
                {dailyStats?.returnable || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">İade Kabul Edilemez</span>
              </div>
              <span className="text-sm font-bold text-gray-900" data-testid="stat-not-returnable">
                {dailyStats?.not_returnable || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Firmaya Gönder</span>
              </div>
              <span className="text-sm font-bold text-gray-900" data-testid="stat-send-back">
                {dailyStats?.send_back || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Bağış</span>
              </div>
              <span className="text-sm font-bold text-gray-900" data-testid="stat-donation">
                {dailyStats?.donation || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">İmha</span>
              </div>
              <span className="text-sm font-bold text-gray-900" data-testid="stat-disposal">
                {dailyStats?.disposal || 0}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Toplam Analiz</span>
              <span className="text-lg font-bold text-blue-600" data-testid="stat-total">
                {dailyStats?.total || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Model Status */}
      <Card className="bg-white rounded-3xl border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Model Durumu</h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">AI Motor</span>
                <span className="text-sm font-bold text-blue-600">Google Gemini 2.5 Pro</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Hasar Tespiti</span>
                <span className="text-sm text-purple-600 font-medium">75+ Kategori</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Analiz Türü</span>
                <span className="text-sm text-gray-600">Gerçek Zamanlı</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Sınıflandırma</span>
                <span className="text-sm text-gray-600">5 Kategori</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">API Durumu</span>
                <span className="text-sm text-green-600 font-medium">✓ Aktif</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Analyses */}
      <Card className="bg-white rounded-3xl border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Analizler</h3>

          <div className="space-y-3">
            {recentAnalyses && recentAnalyses.length > 0 ? (
              recentAnalyses.slice(0, 3).map((analysis, index) => (
                <div key={analysis.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 ${getClassificationColor(analysis.classification)} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold" data-testid={`recent-icon-${index}`}>
                      {getClassificationIcon(analysis.classification)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900" data-testid={`recent-label-${index}`}>
                      {CLASSIFICATION_LABELS[analysis.classification]}
                    </p>
                    <p className="text-xs text-gray-500" data-testid={`recent-time-${index}`}>
                      {formatTime(analysis.createdAt)} - {Math.round(analysis.confidence * 100)}% güven
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Henüz analiz yapılmamış</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">Analiz Sistemi</p>
            <p className="text-xs text-gray-500">FLO Group AI ayakkabı durum sınıflandırması</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}