import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image, Camera, Plus } from 'lucide-react';

// Assume these components and hooks are correctly imported and available
// For example, SettingsModal might be defined elsewhere and imported like:
// import SettingsModal from '@/components/SettingsModal'; 

interface PhotoUploadProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: any) => void;
}

export default function PhotoUpload({ onAnalysisStart, onAnalysisComplete }: PhotoUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // State for settings modal

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      // Enhanced security validation
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const isValidType = allowedTypes.includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // Reduced to 5MB
      const hasValidName = !file.name.includes('..') && !file.name.includes('/') && !file.name.includes('\\');
      const hasValidExtension = /\.(jpg|jpeg|png|webp)$/i.test(file.name);

      if (!isValidType) {
        toast({
          title: "Geçersiz dosya türü",
          description: "Sadece JPEG, PNG ve WebP dosyaları kabul edilir.",
          variant: "destructive"
        });
        return false;
      }

      if (!isValidSize) {
        toast({
          title: "Dosya çok büyük",
          description: "Dosya boyutu 5MB'dan küçük olmalıdır.",
          variant: "destructive"
        });
        return false;
      }

      if (!hasValidName || !hasValidExtension) {
        toast({
          title: "Geçersiz dosya adı",
          description: "Dosya adında güvensiz karakterler bulundu.",
          variant: "destructive"
        });
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "Fotoğraflar eklendi",
        description: `${validFiles.length} fotoğraf analiz için hazır.`,
      });
    }
  }, [toast]);

  const analyzeImages = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    onAnalysisStart();

    try {
      const results: any[] = [];

      // Analyze all files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);
        if (customerNotes.trim()) {
          // Sanitize and limit customer notes
          const sanitizedNotes = customerNotes
            .trim()
            .replace(/[<>\"'&]/g, '')
            .replace(/javascript:/gi, '')
            .slice(0, 500);
          formData.append('customerNotes', sanitizedNotes);
        }

        const response = await fetch('/api/analyze-shoe', {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `${file.name} analizi başarısız`);
        }

        const result = await response.json();
        results.push({ ...result, fileName: file.name });
      }

      // Store all results
      setAnalysisResults(prev => [...prev, ...results]);

      // Show the most recent result in main area
      onAnalysisComplete(results[results.length - 1]);

      toast({
        title: "Analiz tamamlandı",
        description: `${files.length} ayakkabı fotoğrafı başarıyla analiz edildi.`,
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analiz hatası",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const openCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Arka kamera (mobilde)
        } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Kamera erişim hatası:', error);
      toast({
        title: "Kamera hatası",
        description: "Kameraya erişim izni gerekiyor. Tarayıcı ayarlarından kamera izni verin.",
        variant: "destructive"
      });
      setIsCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (context) {
      context.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `kamera-foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setUploadedFiles(prev => [...prev, file]);
          closeCamera();
          toast({
            title: "Fotoğraf çekildi",
            description: "Fotoğraf analiz için hazır.",
          });
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Function to toggle dark mode (example implementation)
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <Card className="bg-white rounded-3xl border border-gray-200">
      <CardContent className="p-6">
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {/* Settings Button - Example of how you might integrate settings */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={() => setIsSettingsModalOpen(true)}
            data-testid="button-settings"
          >
            Ayarlar
          </Button>
        </div>

        {/* Settings Modal - Example Implementation */}
        {isSettingsModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-3xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Ayarlar</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSettingsModalOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <Label htmlFor="dark-mode-toggle">Dark Mode</Label>
                <input
                  id="dark-mode-toggle"
                  type="checkbox"
                  className="toggle-checkbox" // Tailwind CSS class for toggle switch styling
                  onChange={toggleDarkMode}
                  data-testid="dark-mode-toggle"
                />
              </div>
              {/* Add other settings here */}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Fotoğraf Yükleme</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <Image className="w-4 h-4" />
              <span data-testid="upload-count">{uploadedFiles.length} Fotoğraf</span>
            </div>
            {analysisResults.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span data-testid="analysis-count">{analysisResults.length} Analiz</span>
              </div>
            )}
          </div>
        </div>

        {/* Customer Notes Section */}
        <div className="mb-6">
          <Label htmlFor="customer-notes" className="text-sm font-medium text-gray-700 mb-2 block">
            Müşteri Açıklamaları
          </Label>
          <Textarea
            id="customer-notes"
            placeholder="Müşterinin ayakkabı hakkındaki açıklamalarını yazın...
Örnek: Müşteri sol ayakkabının burun kısmında çizik olduğunu söyledi"
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            rows={3}
            className="w-full"
            data-testid="textarea-customer-notes"
          />
          <p className="text-xs text-gray-500 mt-1">
            Bu bilgiler AI analizinde kullanılacak ve kullanıcı hatası tespiti yapılacak
          </p>
        </div>

        {/* Batch Analysis Results Grid */}
        {analysisResults.length > 1 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-gray-900">Toplu Analiz Sonuçları</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAnalysisResults([]);
                  setUploadedFiles([]);
                }}
                className="text-gray-600 hover:text-gray-800"
                data-testid="button-clear-all"
              >
                <X className="w-4 h-4 mr-1" />
                Temizle
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {analysisResults.map((result, index) => (
                <div key={index} className="bg-gray-50 rounded-3xl p-3 border hover:shadow-md transition-shadow">
                  <div className="text-xs text-gray-500 mb-2 truncate" title={result.fileName}>
                    {result.fileName}
                  </div>

                  {result.shoeModel && (
                    <div className="text-xs font-medium text-blue-600 mb-1" title={result.shoeModel}>
                      📱 {result.shoeModel}
                    </div>
                  )}

                  {result.warrantyPeriod && (
                    <div className="text-xs text-green-600 mb-2">
                      🛡️ {result.warrantyPeriod} ay garanti
                    </div>
                  )}

                  <div className={`w-full h-2 rounded-full mb-2 ${
                    result.classification === 'returnable' ? 'bg-emerald-500' :
                    result.classification === 'not_returnable' ? 'bg-gray-500' :
                    result.classification === 'send_back' ? 'bg-indigo-500' :
                    result.classification === 'donation' ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}></div>
                  <div className="text-xs font-medium text-gray-900">
                    {result.classification === 'returnable' && 'İade kabul edilebilir'}
                    {result.classification === 'not_returnable' && 'İade kabul edilemez'}
                    {result.classification === 'send_back' && 'İade kabul edilemez, firma üretim hatası'}
                    {result.classification === 'donation' && 'İade kabul edildi bağışlanacak'}
                    {result.classification === 'disposal' && 'İade kabul edildi ama durumu kötü imha'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(result.confidence * 100)}% güven
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div 
          className={`border-2 border-dashed rounded-3xl p-8 text-center transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="upload-dropzone"
        >
          <div className="space-y-4">
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={URL.createObjectURL(file)}
                      alt={`Uploaded shoe ${index + 1}`}
                      className="rounded-3xl shadow-md w-full h-32 object-cover"
                      data-testid={`uploaded-image-${index}`}
                    />
                    <button 
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`remove-image-${index}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">
                {uploadedFiles.length > 0 ? 'Daha Fazla Fotoğraf Ekle' : 'Ayakkabı Fotoğrafları Yükle'}
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Birden çok fotoğrafı sürükleyip bırakın veya seçin
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG formatları • Kamera desteği mevcut • Toplu analiz
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              {uploadedFiles.length === 0 ? (
                <>
                  <Button 
                    onClick={triggerFileInput}
                    disabled={isUploading}
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700"
                    data-testid="button-select-photo"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Dosya Seç
                  </Button>

                  <Button 
                    onClick={openCamera}
                    disabled={isUploading}
                    variant="outline"
                    className="inline-flex items-center border-blue-600 text-blue-600 hover:bg-blue-50"
                    data-testid="button-camera-photo"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Kamera
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={triggerFileInput}
                    disabled={isUploading}
                    variant="outline"
                    className="inline-flex items-center border-gray-300 text-gray-600 hover:bg-gray-50"
                    data-testid="button-add-more"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ekle
                  </Button>

                  <Button 
                    onClick={openCamera}
                    disabled={isUploading}
                    variant="outline"
                    className="inline-flex items-center border-gray-300 text-gray-600 hover:bg-gray-50"
                    data-testid="button-camera-more"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Kamera
                  </Button>

                  <Button 
                    onClick={() => analyzeImages(uploadedFiles)}
                    disabled={isUploading || uploadedFiles.length === 0}
                    className="inline-flex items-center bg-green-600 hover:bg-green-700"
                    data-testid="button-analyze"
                  >
                    {isUploading ? 'Analiz Ediliyor...' : `${uploadedFiles.length} Fotoğrafı Analiz Et`}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Camera Modal */}
        {isCameraOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Kamera</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeCamera}
                  data-testid="button-close-camera"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-3xl bg-gray-200"
                  style={{ aspectRatio: '4/3' }}
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </div>

              <div className="flex justify-center mt-4">
                <Button
                  onClick={capturePhoto}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-capture-photo"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Fotoğraf Çek
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}