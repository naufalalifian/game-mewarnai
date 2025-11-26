import React, { useState, useEffect } from 'react';
import { Palette, ArrowLeft, Loader2, Sparkles, Play, Star, Volume2, VolumeX } from 'lucide-react';
import { Category, ColoringPageItem, AppStep, GeneratedImage } from './types';
import { ITEMS_BY_CATEGORY } from './constants';
import { generateColoringPage } from './services/geminiService';
import { StepIndicator } from './components/StepIndicator';
import { ResultGallery } from './components/ResultGallery';
import { OnlineColoring } from './components/OnlineColoring';
import { audioManager } from './utils/audioManager';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('HOME');
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedItem, setSelectedItem] = useState<ColoringPageItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [coloringImageUrl, setColoringImageUrl] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize Audio and Global Click Listeners
  useEffect(() => {
    // Try to init audio on first mount (might be blocked)
    const handleInteraction = () => {
      audioManager.init();
      // Remove self after one successful trigger if needed, or keep for simple logic
    };

    window.addEventListener('click', handleInteraction, { once: true });

    // Global click listener for generic UI sounds
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if clicked element is a button, link, or interactive element
      if (target.closest('button') || target.closest('a') || target.closest('.interactive')) {
        audioManager.playClick();
      }
    };

    window.addEventListener('click', handleGlobalClick);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const toggleMute = () => {
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
  };

  const handleCategorySelect = (cat: Category) => {
    audioManager.playPop();
    setCategory(cat);
    setStep('ITEM');
  };

  const handleItemSelect = (item: ColoringPageItem) => {
    audioManager.playPop();
    setSelectedItem(item);
    setStep('QUANTITY');
  };

  const handleBack = () => {
    if (step === 'CATEGORY') setStep('HOME');
    if (step === 'ITEM') setStep('CATEGORY');
    if (step === 'QUANTITY') setStep('ITEM');
    if (step === 'ONLINE_COLORING') setStep('RESULTS');
  };

  const handleReset = () => {
    setStep('CATEGORY'); // Resetting usually goes to start of workflow
    setCategory(null);
    setSelectedItem(null);
    setGeneratedImages([]);
    setQuantity(1);
    setGenerationProgress(0);
    setColoringImageUrl(null);
  };
  
  const goHome = () => {
    setStep('HOME');
    setCategory(null);
    setSelectedItem(null);
    setGeneratedImages([]);
    setQuantity(1);
    setGenerationProgress(0);
    setColoringImageUrl(null);
  };

  const handleGenerate = async () => {
    if (!selectedItem) return;
    
    audioManager.playPop();
    setStep('GENERATING');
    setIsGenerating(true);
    setGeneratedImages([]);
    setGenerationProgress(0);
    
    const newImages: GeneratedImage[] = [];

    try {
      for (let i = 0; i < quantity; i++) {
        setProgressMessage(`Drawing page ${i + 1} of ${quantity}...`);
        
        // Add a small delay for UI smoothness and to avoid slamming the API too hard instantly
        if (i > 0) await new Promise(r => setTimeout(r, 1000));
        
        const base64Image = await generateColoringPage(selectedItem.name, i);
        
        newImages.push({
          id: `${Date.now()}-${i}`,
          imageUrl: base64Image,
          prompt: selectedItem.name,
          timestamp: Date.now(),
        });

        setGenerationProgress(((i + 1) / quantity) * 100);
      }

      setGeneratedImages(newImages);
      setStep('RESULTS');
      audioManager.playSuccess(); // Tadaa!
    } catch (error) {
      console.error("Failed to generate", error);
      alert("Oops! Something went wrong while drawing. Please check your API key and try again!");
      setStep('QUANTITY');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleColorOnline = (img: GeneratedImage) => {
    setColoringImageUrl(img.imageUrl);
    setStep('ONLINE_COLORING');
  };

  // --- Render Steps ---

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl text-center py-10 animate-fade-in">
      <div className="mb-8 relative">
        <div className="absolute top-0 -left-12 text-6xl animate-bounce" style={{ animationDelay: '0s' }}>🎨</div>
        <div className="absolute bottom-0 -right-12 text-6xl animate-bounce" style={{ animationDelay: '0.5s' }}>🖍️</div>
        
        <div className="bg-white p-8 rounded-full shadow-2xl border-8 border-yellow-300">
           <Palette size={80} className="text-pink-500" />
        </div>
      </div>

      <h1 className="text-5xl md:text-7xl font-extrabold text-sky-600 tracking-tight mb-4 drop-shadow-sm">
        Magic<span className="text-pink-500">Coloring</span>Book
      </h1>
      
      <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-xl mx-auto font-medium">
        Create your own unique coloring pages with magic! Choose your favorite animals or fruits.
      </p>

      <button
        onClick={() => setStep('CATEGORY')}
        className="group relative px-10 py-5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full shadow-[0_10px_20px_rgba(59,130,246,0.5)] transform hover:scale-105 transition-all duration-300 border-b-4 border-blue-600 active:border-b-0 active:translate-y-1"
      >
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-bold text-white tracking-wider">START PLAYING</span>
          <Play fill="white" className="w-8 h-8 text-white group-hover:translate-x-1 transition-transform" />
        </div>
        <div className="absolute -top-2 -right-2">
          <Star fill="#FCD34D" className="w-8 h-8 text-yellow-400 animate-spin-slow" />
        </div>
      </button>

      {/* Decorative Grid of Icons */}
      <div className="grid grid-cols-4 gap-8 mt-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
        <span className="text-4xl animate-float" style={{ animationDelay: '0.1s' }}>🦁</span>
        <span className="text-4xl animate-float" style={{ animationDelay: '0.3s' }}>🦄</span>
        <span className="text-4xl animate-float" style={{ animationDelay: '0.5s' }}>🐢</span>
        <span className="text-4xl animate-float" style={{ animationDelay: '0.7s' }}>🐳</span>
        <span className="text-4xl animate-float" style={{ animationDelay: '0.2s' }}>🍎</span>
        <span className="text-4xl animate-float" style={{ animationDelay: '0.4s' }}>🍓</span>
        <span className="text-4xl animate-float" style={{ animationDelay: '0.6s' }}>🍌</span>
        <span className="text-4xl animate-float" style={{ animationDelay: '0.8s' }}>🍇</span>
      </div>
    </div>
  );

  const renderCategoryStep = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
      <button
        onClick={() => handleCategorySelect(Category.ANIMALS)}
        className="group relative h-64 bg-orange-100 rounded-3xl border-4 border-orange-300 hover:border-orange-400 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 flex flex-col items-center justify-center overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <span className="text-8xl mb-4 group-hover:scale-110 transition-transform duration-300">🦁</span>
        <span className="text-3xl font-bold text-orange-600 font-sans">Animals</span>
        <p className="text-orange-500 mt-2">Lions, Monkeys & More!</p>
      </button>

      <button
        onClick={() => handleCategorySelect(Category.FRUITS)}
        className="group relative h-64 bg-pink-100 rounded-3xl border-4 border-pink-300 hover:border-pink-400 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 flex flex-col items-center justify-center overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <span className="text-8xl mb-4 group-hover:scale-110 transition-transform duration-300">🍓</span>
        <span className="text-3xl font-bold text-pink-600 font-sans">Fruits</span>
        <p className="text-pink-500 mt-2">Apples, Bananas & More!</p>
      </button>
    </div>
  );

  const renderItemStep = () => {
    const items = category ? ITEMS_BY_CATEGORY[category] : [];
    
    return (
      <div className="w-full max-w-5xl">
         <div className="flex items-center mb-6">
            <button onClick={handleBack} className="p-2 rounded-full bg-white hover:bg-gray-100 text-gray-600 shadow-md mr-4 transition-colors">
              <ArrowLeft />
            </button>
            <h2 className="text-2xl font-bold text-slate-700">Pick a {category === Category.ANIMALS ? 'Friend' : 'Treat'}!</h2>
         </div>
         
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemSelect(item)}
                className="bg-white p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-400 shadow-md hover:shadow-xl transition-all flex flex-col items-center group"
              >
                <span className="text-5xl mb-2 group-hover:animate-bounce">{item.emoji}</span>
                <span className="font-bold text-slate-700">{item.name}</span>
              </button>
            ))}
         </div>
      </div>
    );
  };

  const renderQuantityStep = () => (
    <div className="w-full max-w-2xl bg-white p-8 rounded-3xl shadow-xl border-4 border-blue-100 flex flex-col items-center">
      <div className="w-full flex justify-start mb-4">
        <button onClick={handleBack} className="flex items-center text-gray-500 hover:text-blue-500 font-bold transition-colors">
            <ArrowLeft className="mr-1 w-5 h-5"/> Back
        </button>
      </div>
      
      <div className="text-center mb-8">
        <span className="text-6xl mb-4 block animate-float">{selectedItem?.emoji}</span>
        <h2 className="text-3xl font-bold text-slate-800">How many pages of {selectedItem?.name}?</h2>
        <p className="text-slate-500 mt-2">We will make each one slightly different!</p>
      </div>

      <div className="flex items-center space-x-4 mb-10 bg-gray-50 p-2 rounded-full border border-gray-200">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            onClick={() => { audioManager.playPop(); setQuantity(num); }}
            className={`
              w-12 h-12 sm:w-16 sm:h-16 rounded-full font-bold text-xl sm:text-2xl transition-all duration-300 transform
              ${quantity === num 
                ? 'bg-blue-500 text-white scale-110 shadow-lg rotate-3' 
                : 'bg-white text-gray-600 hover:bg-blue-100'}
            `}
          >
            {num}
          </button>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-xl font-bold rounded-full shadow-lg transform transition hover:scale-105 flex items-center justify-center"
      >
        <Sparkles className="mr-2" />
        Generate Coloring Book!
      </button>
    </div>
  );

  const renderGenerating = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="absolute inset-0 bg-yellow-300 rounded-full blur-xl opacity-50 animate-pulse"></div>
        <div className="relative bg-white p-6 rounded-full shadow-2xl">
           <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        </div>
      </div>
      <h2 className="mt-8 text-3xl font-bold text-slate-700">{progressMessage}</h2>
      <div className="w-64 h-4 bg-gray-200 rounded-full mt-4 overflow-hidden border border-gray-300">
        <div 
          className="h-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${generationProgress}%` }}
        />
      </div>
      <p className="mt-4 text-slate-500 italic">Mixing colors... Sharpening pencils...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-sky-50 font-fredoka pb-12">
      {/* --- AUDIO CONTROL FAB --- */}
      <button 
        onClick={toggleMute}
        className="fixed bottom-4 right-4 z-[60] bg-white text-sky-600 p-3 rounded-full shadow-lg border-2 border-sky-100 hover:scale-110 transition-transform"
        title={isMuted ? "Unmute Music" : "Mute Music"}
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>

      {/* Header - Only show if not on home screen or coloring screen (which has its own header) */}
      {step !== 'HOME' && step !== 'ONLINE_COLORING' && (
        <header className="bg-white border-b-4 border-sky-200 py-4 px-6 sticky top-0 z-50 shadow-sm animate-slide-down">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={goHome}>
              <div className="bg-yellow-400 p-2 rounded-lg text-white transform -rotate-6">
                  <Palette size={28} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-sky-600 tracking-tight">
                Magic<span className="text-pink-500">Coloring</span>Book
              </h1>
            </div>
            {step !== 'GENERATING' && (
              <button onClick={handleReset} className="text-sm font-bold text-gray-400 hover:text-red-400 transition-colors">
                Start Over
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex flex-col items-center justify-center ${step === 'ONLINE_COLORING' ? 'p-0' : 'p-4 md:p-8 mt-4'} min-h-[80vh]`}>
        
        <StepIndicator currentStep={step} />

        {step === 'HOME' && renderHome()}
        {step === 'CATEGORY' && renderCategoryStep()}
        {step === 'ITEM' && renderItemStep()}
        {step === 'QUANTITY' && renderQuantityStep()}
        {step === 'GENERATING' && renderGenerating()}
        {step === 'RESULTS' && (
          <ResultGallery 
            images={generatedImages} 
            onReset={handleReset} 
            onColor={handleColorOnline}
            topicName={selectedItem?.name || 'Coloring Page'} 
          />
        )}
        {step === 'ONLINE_COLORING' && coloringImageUrl && (
          <OnlineColoring 
            imageUrl={coloringImageUrl}
            onBack={handleBack}
            topicName={selectedItem?.name || 'Art'}
          />
        )}
      </main>
      
      {/* Decorative background elements (Hide on coloring page) */}
      {step !== 'ONLINE_COLORING' && (
        <>
          <div className="fixed bottom-0 left-0 pointer-events-none opacity-20 -z-10">
              <svg width="300" height="300" viewBox="0 0 200 200">
                <path fill="#FDBA74" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.2,-19.2,95.8,-5.2C93.5,8.9,82,22.1,70.9,33.4C59.8,44.7,49.1,54.1,37.3,62.2C25.5,70.3,12.8,77.1,-1.1,79C-15,80.9,-30,77.9,-42.6,70.3C-55.2,62.7,-65.4,50.5,-73.2,36.8C-81,23.1,-86.4,7.9,-84.3,-6.2C-82.2,-20.3,-72.6,-33.3,-61.8,-42.8C-51,-52.3,-39,-58.3,-27.1,-67.2C-15.2,-76.1,-3.4,-87.9,5.7,-97.8L14.9,-107.6" transform="translate(100 100)" />
              </svg>
          </div>
          <div className="fixed top-20 right-0 pointer-events-none opacity-20 -z-10">
              <svg width="250" height="250" viewBox="0 0 200 200">
                <path fill="#F472B6" d="M41.7,-70.6C53.6,-65.4,62.8,-52.5,70.3,-39.8C77.8,-27.1,83.6,-14.6,81.8,-2.8C79.9,9,70.4,20.1,60.8,30C51.2,39.9,41.5,48.6,30.8,55.9C20.1,63.2,8.4,69.1,-2.3,73.1C-13,77.1,-22.7,79.2,-31.6,74.7C-40.5,70.2,-48.6,59.1,-55.8,48.2C-63,37.3,-69.3,26.6,-71.4,15.1C-73.5,3.6,-71.4,-8.7,-65.7,-19.4C-60,-30.1,-50.7,-39.2,-40.3,-45.1C-29.9,-51,-18.4,-53.7,-6.2,-52.7C6,-51.7,29.8,-75.8,41.7,-70.6Z" transform="translate(100 100)" />
              </svg>
          </div>
        </>
      )}
    </div>
  );
};

export default App;