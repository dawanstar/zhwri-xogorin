import React, { useState } from 'react';
import { AppState, INITIAL_STATE, Gender } from './types';
import { Button } from './components/Button';
import { StepWizard } from './components/StepWizard';
import { generateTryOn } from './services/geminiService';

// SVG Icons
const RulerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  const handleMetricChange = (field: keyof typeof state.metrics, value: string) => {
    setState(prev => ({
      ...prev,
      metrics: { ...prev.metrics, [field]: value }
    }));
  };

  const handleFileChange = (type: 'face' | 'cloth', file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({
          ...prev,
          [`${type}Image`]: file,
          [`${type}ImagePreview`]: reader.result as string,
          error: null // clear errors on new file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlFetch = async () => {
    if (!state.clothUrl) return;

    setState(prev => ({ ...prev, isFetchingUrl: true, error: null }));

    try {
      // Note: fetching directly from client side has CORS limitations for many major sites (Amazon, Zara).
      // In a real production app, this would go through a proxy server.
      // For this demo, we try direct fetch, but catch errors to inform user.
      const response = await fetch(state.clothUrl);
      if (!response.ok) throw new Error("Network error");
      
      const blob = await response.blob();
      
      // Check if it's actually an image
      if (!blob.type.startsWith('image/')) {
        throw new Error("URL is not a direct image");
      }

      const file = new File([blob], "url-image.jpg", { type: blob.type });
      
      // Use existing file handler
      handleFileChange('cloth', file);
      setState(prev => ({ ...prev, isFetchingUrl: false }));

    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isFetchingUrl: false,
        error: "بەهۆی پاراستنی سیکموریتی وێبسایتەکان (CORS)، ناتوانین ئەم لینکە راستەوخۆ بکەینەوە. تکایە وێنەکە دابەزێنە (Save Image) و بەشی 'بارکردن' بەکاربهێنە." 
      }));
    }
  };

  const handleNext = () => {
    setState(prev => ({ ...prev, step: prev.step + 1, error: null }));
  };

  const handleBack = () => {
    setState(prev => ({ ...prev, step: prev.step - 1, error: null }));
  };

  const handleGenerate = async () => {
    if (!state.faceImage || !state.clothImage) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null, loadingMessage: 'دەستپێکردن...' }));

    try {
      const resultImage = await generateTryOn(
        state.faceImage,
        state.clothImage,
        state.metrics.height,
        state.metrics.weight,
        state.metrics.gender,
        (msg) => setState(prev => ({ ...prev, loadingMessage: msg }))
      );

      setState(prev => ({
        ...prev,
        isGenerating: false,
        generatedImage: resultImage,
        step: 4
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: "ببورە، کێشەیەک ڕوویدا لە کاتی دروستکردندا. تکایە دووبارە هەوڵبدەرەوە."
      }));
    }
  };

  const handleReset = () => {
    setState(INITIAL_STATE);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-lg">
              AI
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-slate-900 to-slate-700">
              Virtual Try-On
            </h1>
          </div>
          <span className="text-xs font-medium px-3 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-100">
            پڕۆژەی کۆتایی
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 md:p-8 transition-all duration-300">
          
          <StepWizard currentStep={state.step} />

          {/* STEP 1: USER DETAILS */}
          {state.step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">زانیاری کەسی</h2>
                <p className="text-slate-500">تکایە زانیاریەکانت بە دروستی پڕبکەرەوە بۆ ئەنجامێکی باشتر</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">ڕەگەز</label>
                  <div className="flex gap-2">
                    {[Gender.MALE, Gender.FEMALE].map((g) => (
                      <button
                        key={g}
                        onClick={() => handleMetricChange('gender', g)}
                        className={`
                          flex-1 py-3 px-4 rounded-xl border-2 transition-all font-medium
                          ${state.metrics.gender === g 
                            ? 'border-brand-500 bg-brand-50 text-brand-700' 
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}
                        `}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">باڵا (cm)</label>
                  <input
                    type="number"
                    value={state.metrics.height}
                    onChange={(e) => handleMetricChange('height', e.target.value)}
                    placeholder="175"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-center dir-ltr"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-slate-700">کێش (kg)</label>
                  <input
                    type="number"
                    value={state.metrics.weight}
                    onChange={(e) => handleMetricChange('weight', e.target.value)}
                    placeholder="70"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-center dir-ltr"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  fullWidth 
                  onClick={handleNext}
                  disabled={!state.metrics.height || !state.metrics.weight}
                >
                  دواتر
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: FACE UPLOAD */}
          {state.step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">وێنەی دەموچاو</h2>
                <p className="text-slate-500">وێنەیەکی ڕوونی دەموچاوت دابنێ</p>
              </div>

              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('face', e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`
                  border-3 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all duration-300 min-h-[300px]
                  ${state.faceImagePreview 
                    ? 'border-brand-300 bg-brand-50/50' 
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-brand-300'}
                `}>
                  {state.faceImagePreview ? (
                    <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-lg">
                      <img src={state.faceImagePreview} alt="Face" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                        گۆڕینی وێنە
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <UserIcon />
                      </div>
                      <span className="text-slate-600 font-medium">کلیک بکە بۆ هەڵبژاردنی وێنە</span>
                      <span className="text-slate-400 text-sm mt-1">JPG, PNG</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  گەڕانەوە
                </Button>
                <Button 
                  className="flex-[2]" 
                  onClick={handleNext}
                  disabled={!state.faceImage}
                >
                  دواتر
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: CLOTH UPLOAD (UPDATED WITH URL TAB) */}
          {state.step === 3 && (
            <div className="space-y-6 animate-fadeIn">
               {/* Loading Overlay */}
               {state.isGenerating && (
                <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-8 text-center">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-brand-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 animate-pulse">{state.loadingMessage}</h3>
                  <p className="text-slate-500 text-sm">ئەم کردارە چەند چرکەیەک دەخایەنێت...</p>
                  <p className="text-xs text-brand-500 mt-4 bg-brand-50 px-3 py-1 rounded-full">Gemini 2.5 Pro & Nano Banana</p>
                </div>
              )}

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">وێنەی جلوبەرگ</h2>
                <p className="text-slate-500">ئەو جلەی دەتەوێت تاقی بکەیتەوە دابنێ</p>
              </div>

              {/* Input Mode Toggles */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                <button
                  onClick={() => setState(prev => ({ ...prev, clothInputMode: 'upload', error: null }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${state.clothInputMode === 'upload' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  بارکردنی وێنە
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, clothInputMode: 'url', error: null }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${state.clothInputMode === 'url' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  لینک / URL
                </button>
              </div>

              <div className="relative">
                {state.clothInputMode === 'upload' ? (
                  // UPLOAD MODE
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('cloth', e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`
                      border-3 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all duration-300 min-h-[300px]
                      ${state.clothImagePreview 
                        ? 'border-brand-300 bg-brand-50/50' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-brand-300'}
                    `}>
                      {state.clothImagePreview ? (
                        <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-lg">
                          <img src={state.clothImagePreview} alt="Cloth" className="w-full h-full object-contain bg-white" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                            گۆڕینی وێنە
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <UploadIcon />
                          </div>
                          <span className="text-slate-600 font-medium">کلیک بکە بۆ هەڵبژاردنی وێنە</span>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  // URL MODE
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                        <LinkIcon />
                      </div>
                      <input 
                        type="url" 
                        placeholder="لینکی وێنەکە لێرە دابنێ (Amazon, Zara...)"
                        className="w-full p-4 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dir-ltr"
                        value={state.clothUrl}
                        onChange={(e) => setState(prev => ({...prev, clothUrl: e.target.value}))}
                      />
                      <Button 
                        variant="secondary" 
                        className="absolute left-2 top-2 bottom-2 !py-1 text-sm"
                        onClick={handleUrlFetch}
                        disabled={state.isFetchingUrl || !state.clothUrl}
                      >
                        {state.isFetchingUrl ? '...' : 'هێنان'}
                      </Button>
                    </div>

                    <div className={`
                      border-2 rounded-3xl p-4 flex flex-col items-center justify-center transition-all duration-300 min-h-[200px]
                      ${state.clothImagePreview 
                        ? 'border-brand-300 bg-white' 
                        : 'border-slate-100 bg-slate-50 text-slate-400'}
                    `}>
                       {state.clothImagePreview ? (
                        <div className="relative w-full h-48 rounded-xl overflow-hidden">
                          <img src={state.clothImagePreview} alt="Cloth URL" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <span className="text-sm">وێنەکە لێرە دەردەکەوێت</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {state.error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{state.error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="flex-1" disabled={state.isGenerating}>
                  گەڕانەوە
                </Button>
                <Button 
                  className="flex-[2]" 
                  onClick={handleGenerate}
                  disabled={!state.clothImage || state.isGenerating || state.isFetchingUrl}
                >
                  {state.isGenerating ? 'جێبەجێکردن...' : 'تاقییکردنەوە'}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: RESULT */}
          {state.step === 4 && state.generatedImage && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-700 to-purple-600 mb-2">
                  پیرۆزە! ئەمەش ئەنجامەکە
                </h2>
                <p className="text-slate-500">ستایلێکی زۆر شاز دەرچوو</p>
              </div>

              <div className="bg-slate-900 rounded-3xl p-2 shadow-2xl shadow-brand-900/20 overflow-hidden relative">
                 <img 
                  src={state.generatedImage} 
                  alt="Generated Try-On" 
                  className="w-full h-auto rounded-2xl"
                />
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur text-white text-xs px-3 py-1 rounded-full border border-white/20">
                  AI Generated
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  تاقییکردنەوەی نوێ
                </Button>
                <a 
                  href={state.generatedImage} 
                  download="virtual-try-on.png" 
                  className="flex-[2]"
                >
                   <Button fullWidth>
                    داگرتنی وێنە
                  </Button>
                </a>
              </div>
            </div>
          )}

        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm">
        <p>Developed with ❤️ using Google Gemini 2.5 Pro & Nano Banana</p>
        <p className="mt-1 opacity-60">Final Year Project - Computer Science</p>
      </footer>

      {/* Tailwind Custom Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}