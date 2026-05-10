import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  PawPrint, 
  Mic, 
  Send, 
  RefreshCw, 
  Volume2, 
  Trophy, 
  ChevronRight,
  Palette,
  Cloud,
  Sun,
  Star,
  Info,
  X
} from 'lucide-react';

type GameState = 'START' | 'CHALLENGE' | 'CHECKING' | 'SUCCESS' | 'GENERATING' | 'FINISH';

interface Challenge {
  clue: string;
  answer: string;
  hint: string;
  topic: 'Hewan' | 'Lingkungan' | 'Kosakata';
}

const AI_CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || '',
  textModel: "gemini-3-flash-preview",
  imageModel: "gemini-2.5-flash-image"
};

// --- AI Service ---

const genAI = new GoogleGenAI({ apiKey: AI_CONFIG.apiKey });

async function getNewChallenge(topic: string): Promise<Challenge> {
  const response = await genAI.models.generateContent({
    model: AI_CONFIG.textModel,
    contents: `Kamu adalah asisten EduGame untuk anak SD. Berikan satu tantangan tebak kata tentang ${topic}.
    Format JSON: { "clue": "deskripsi singkat ramah anak", "answer": "satu kata jawaban", "hint": "petunjuk ekstra", "topic": "${topic}" }
    Pastikan jawabannya sederhana (contoh: Kelinci, Matahari, Pohon).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          clue: { type: Type.STRING },
          answer: { type: Type.STRING },
          hint: { type: Type.STRING },
          topic: { type: Type.STRING }
        },
        required: ["clue", "answer", "hint", "topic"]
      }
    }
  });
  
  return JSON.parse(response.text || '{}');
}

async function generateMagicalImage(objectName: string): Promise<string> {
  const prompt = `A very cute, colorful, and friendly 3D cartoon style illustration of a ${objectName} wearing a tiny party hat and surrounded by sparkles and magical dust. High quality, Disney/Pixar style, vibrant colors, white background.`;
  
  const response = await genAI.models.generateContent({
    model: AI_CONFIG.imageModel,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return '';
}

// --- Components ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [topic, setTopic] = useState<'Hewan' | 'Lingkungan' | 'Kosakata'>('Hewan');
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [userInput, setUserInput] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  // Audio simulation (TTS via Gemini or just visual)
  const speak = (text: string) => {
    // In a real app, integrate Web Speech API or Gemini TTS
    console.log("Speaking:", text);
  };

  const startNewGame = async (selectedTopic: any) => {
    setTopic(selectedTopic);
    setGameState('CHALLENGE');
    setFeedback('Mencari tantangan baru...');
    try {
      const challenge = await getNewChallenge(selectedTopic);
      setCurrentChallenge(challenge);
      speak(challenge.clue);
    } catch (error) {
      console.error(error);
      setFeedback('Ups! Ada sihir yang macet. Coba lagi ya!');
    }
  };

  const handleLevelUp = async () => {
    setGameState('GENERATING');
    try {
      if (currentChallenge) {
        const url = await generateMagicalImage(currentChallenge.answer);
        setGeneratedImageUrl(url);
        setGameState('FINISH');
        setScore(prev => prev + 10);
      }
    } catch (error) {
      console.error(error);
      setGameState('START');
    }
  };

  const checkAnswer = () => {
    if (!currentChallenge) return;
    
    setGameState('CHECKING');
    const isCorrect = userInput.toLowerCase().trim() === currentChallenge.answer.toLowerCase().trim();
    
    setTimeout(() => {
      if (isCorrect) {
        setGameState('SUCCESS');
        setFeedback('HEBAT! Kamu benar! Kuas Ajaib sedang bekerja...');
        speak("Hebat! Jawabanmu benar!");
      } else {
        setGameState('CHALLENGE');
        setFeedback('Hampir benar! Coba ingat-ingat lagi petunjuknya.');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF0] font-sans text-[#4A4A4A] overflow-hidden selection:bg-yellow-200">
      {/* Background Ornaments */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <Cloud className="absolute top-10 left-10 text-blue-400 w-24 h-24" />
        <Sun className="absolute top-20 right-20 text-yellow-500 w-32 h-32 animate-pulse" />
        <Star className="absolute bottom-20 left-20 text-purple-400 w-16 h-16" />
        <Palette className="absolute bottom-10 right-10 text-orange-400 w-24 h-24 rotate-12" />
      </div>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-screen">
        
        {/* Header */}
        <header className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg mb-4 border-4 border-[#FFD93D]"
          >
            <Sparkles className="text-yellow-500 w-6 h-6" />
            <h1 className="text-2xl font-black text-[#FF8B13] tracking-tight">KUAS AJAIB</h1>
          </motion.div>
          <p className="text-lg font-medium text-blue-600 italic">Petualangan Kata Fantastis!</p>
        </header>

        <AnimatePresence mode="wait">
          {gameState === 'START' && (
            <motion.div 
              key="start"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold mb-8">Pilih Tema Petualanganmu!</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <TopicButton 
                  icon={<PawPrint />} 
                  label="Hewan" 
                  color="bg-green-400" 
                  onClick={() => startNewGame('Hewan')} 
                />
                <TopicButton 
                  icon={<Cloud />} 
                  label="Alam" 
                  color="bg-blue-400" 
                  onClick={() => startNewGame('Lingkungan')} 
                />
                <TopicButton 
                  icon={<Palette />} 
                  label="Benda" 
                  color="bg-orange-400" 
                  onClick={() => startNewGame('Kosakata')} 
                />
              </div>
            </motion.div>
          )}

          {gameState === 'CHALLENGE' && currentChallenge && (
            <motion.div 
              key="challenge"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full bg-white p-8 rounded-[40px] shadow-xl border-4 border-blue-100 flex flex-col items-center"
            >
              <div className="bg-yellow-100 p-6 rounded-3xl mb-6 w-full text-center">
                <p className="text-2xl font-bold leading-relaxed">"{currentChallenge.clue}"</p>
              </div>

              <div className="flex gap-2 w-full mb-6">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Ketik jawabanmu di sini..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                  className="flex-1 bg-gray-50 p-6 rounded-2xl text-xl font-bold border-2 border-transparent focus:border-blue-400 outline-none transition-all placeholder:text-gray-300"
                />
                <button 
                  onClick={checkAnswer}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-2xl transition-all active:scale-95 shadow-lg group"
                >
                  <Send className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>

              <div className="flex items-center gap-4 text-gray-400">
                <button onClick={() => speak(currentChallenge.clue)} className="hover:text-blue-500 transition-colors">
                  <Volume2 />
                </button>
                <div className="h-1 w-8 bg-gray-100" />
                <p className="text-sm font-medium">Jangan menyerah ya! 🎉</p>
              </div>

              {feedback && (
                <p className="mt-4 text-orange-500 font-bold animate-bounce">{feedback}</p>
              )}
            </motion.div>
          )}

          {gameState === 'CHECKING' && (
            <motion.div 
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <RefreshCw className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-xl font-bold text-blue-500">Memeriksa Jawaban...</p>
            </motion.div>
          )}

          {gameState === 'SUCCESS' && (
            <motion.div 
              key="success"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6 animate-bounce" />
              <h2 className="text-4xl font-black text-green-500 mb-4">KAMU BENAR!</h2>
              <p className="text-xl mb-8">Kuas Ajaib sedang melukis hadiahmu...</p>
              <button 
                onClick={handleLevelUp}
                className="bg-[#FF8B13] hover:bg-[#FF7A00] text-white px-10 py-5 rounded-full text-2xl font-black shadow-xl transition-all active:scale-95 flex items-center gap-3 animate-pulse"
              >
                Lihat Hasil Sihir <ChevronRight />
              </button>
            </motion.div>
          )}

          {gameState === 'GENERATING' && (
            <motion.div 
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="relative w-48 h-48 mx-auto mb-8">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-8 border-dashed border-yellow-400 rounded-full"
                />
                <Palette className="absolute inset-0 m-auto w-24 h-24 text-blue-400 animate-pulse" />
              </div>
              <p className="text-2xl font-bold text-[#FF8B13]">Melukis dengan AI...</p>
              <p className="text-gray-400">Sabar ya, detil ajaib butuh waktu!</p>
            </motion.div>
          )}

          {gameState === 'FINISH' && (
            <motion.div 
              key="finish"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full flex flex-col items-center"
            >
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-[50px] opacity-75 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <div className="relative bg-white p-4 rounded-[40px] shadow-2xl">
                  {generatedImageUrl ? (
                    <img 
                      src={generatedImageUrl} 
                      alt="Hasil Sihir" 
                      className="w-80 h-80 object-cover rounded-[30px]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-80 h-80 bg-gray-100 rounded-[30px] flex items-center justify-center">
                      <RefreshCw className="animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-12 text-center">
                <h3 className="text-3xl font-black mb-2 flex items-center justify-center gap-3">
                  SIHIR {currentChallenge?.answer.toUpperCase()}! <Sparkles className="text-yellow-500" />
                </h3>
                <p className="text-xl text-gray-500 mb-8 font-medium">Bagus sekali petualangannya!</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setUserInput('');
                      startNewGame(topic);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-3xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
                  >
                    Main Lagi <RefreshCw className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      setUserInput('');
                      setGameState('START');
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-8 py-4 rounded-3xl font-bold shadow-lg transition-all active:scale-95"
                  >
                    Menu Utama
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score Overlay */}
        <div className="fixed top-6 right-6 flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-md border-2 border-yellow-100">
          <Star className="text-yellow-500 fill-yellow-500 w-5 h-5" />
          <span className="font-black text-xl">{score}</span>
        </div>

        {/* Info Toggle */}
        <button 
          onClick={() => setShowInfo(true)}
          className="fixed bottom-6 left-6 p-4 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors border-2 border-blue-50 text-blue-500"
        >
          <Info />
        </button>

        {/* Info Modal */}
        <AnimatePresence>
          {showInfo && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white max-w-lg w-full rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
              >
                <button 
                  onClick={() => setShowInfo(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X />
                </button>

                <h2 className="text-3xl font-black text-blue-600 mb-6">Konsep Kompetisi 🏆</h2>
                
                <div className="space-y-6">
                  <section>
                    <h3 className="font-bold text-lg text-orange-500">Problem (30%)</h3>
                    <p className="text-gray-600">Transisi belajar dari bermain ke membaca sering membosankan. Game ini menjembatani celah tersebut dengan "Magic Feedback" visual.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-lg text-green-500">Solution (40%)</h3>
                    <p className="text-gray-600">UI ramah anak dengan tombol besar, warna cerah, dan asisten suara AI yang memberikan apresiasi instan.</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-lg text-purple-500">Uniqueness (30%)</h3>
                    <p className="text-gray-600">Generative AI (Imagen) memastikan setiap gambar hadiah bersifat unik, membuat anak selalu penasaran dan semangat belajar.</p>
                  </section>
                </div>

                <div className="mt-8 bg-blue-50 p-4 rounded-3xl">
                  <p className="text-sm text-blue-700 italic">"Membangun imajinasi melalui kata-kata."</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function TopicButton({ icon, label, color, onClick }: { icon: any, label: string, color: string, onClick: () => void }) {
  return (
    <motion.button 
      whileHover={{ y: -5, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`${color} text-white p-8 rounded-[32px] shadow-xl flex flex-col items-center justify-center gap-4 group transition-all`}
    >
      <div className="bg-white/20 p-4 rounded-2xl group-hover:bg-white/30 transition-colors">
        {icon}
      </div>
      <span className="text-2xl font-black tracking-tight">{label}</span>
    </motion.button>
  );
}
