import { useState, useEffect } from 'react';
import imageData from '/images.json';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from "motion/react";
import { Eye, Timer, Lightbulb, Target, Zap, Trophy } from 'lucide-react';
import applogo from './assets/app_logo.png';

const MotionButton = motion.button;
const MotionDiv = motion.div;

function Singleplayer() {
  const [objectName, setObjectName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [size, setSize] = useState(80);
  const [count, setCount] = useState(3);
  const [guess, setGuess] = useState('');
  const [time, settime] = useState(30);
  const navigate = useNavigate();
  const [dashes, setdashes] = useState('');
  const [revealedindex, setrevealedindex] = useState([]);
  const [score, setScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);

  const showOverlay = true;

  useEffect(() => {
    const interval = setInterval(timer, 1000);
    return () => clearInterval(interval);
  }, [time]);

  function timer() {
    if (time <= 0) {
      let s = guess;
      if (s.toLowerCase().trim() !== objectName.toLowerCase()) {
        alert("You lost");
        navigate(-1);
        return;
      }
    }
    else settime(time - 1);
  }

  useEffect(() => {
    fetchRandomImage();
  }, []);

  useEffect(() => {
    settingdashes();
  }, [objectName]);

  useEffect(() => {
    if (time === 15 || time === 8) {
      const indices = [];
      for (let i = 0; i < objectName.length; i++) {
        if (objectName[i] !== ' ' && !revealedindex.includes(i)) {
          indices.push(i);
        }
      }

      if (indices.length > 0) {
        const revealIndex = indices[Math.floor(Math.random() * indices.length)];
        setrevealedindex(prev => [...prev, revealIndex]);
      }
    }
  }, [time]);

  useEffect(() => {
    let tempstring = '';
    for (let i = 0; i < objectName.length; i++) {
      if (objectName[i] === ' ') {
        tempstring += '\u00A0\u00A0';
      } else if (revealedindex.includes(i)) {
        tempstring += objectName[i] + ' ';
      } else {
        tempstring += '_ ';
      }
    }
    setdashes(tempstring.trim());
  }, [revealedindex, objectName]);

  function settingdashes() {
    let tempstring = '';
    for (let i = 0; i < objectName.length; i++) {
      if (objectName[i] == ' ') tempstring += '\u00A0\u00A0';
      else tempstring += '_ ';
    }
    setdashes(tempstring.trim());
  }

  const fetchRandomImage = () => {
    const randomObj = imageData[Math.floor(Math.random() * imageData.length)];
    console.log(randomObj.name);
    setObjectName(randomObj.name);
    setImageUrl(randomObj.url);
    setGuess('');
    settingdashes();
    setIsCorrect(false);
  };

  const settingsize = () => {
    if (count > 0) {
      setSize(size + 50);
      setCount(count - 1);
    } else {
      alert('You are out of hints');
    }
  };

  const checkanswer = (ans) => {
    if (ans.toLowerCase().trim() === objectName.toLowerCase()) {
      setIsCorrect(true);
      setScore(score + (time * 10));
      setTimeout(() => {
        setSize(80);
        fetchRandomImage();
        settime(30);
        setrevealedindex([]);
      }, 2000);
    } else {
      alert('❌ Wrong answer');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vh] bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vh] bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl space-y-12">
        {/* Header */}
        <MotionDiv
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          <h1 className="text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
            <Link to='/' className="mx-auto w-38 h-38 object-contain">
              <img src={applogo} alt="App Logo" className="mx-auto w-38 h-38 object-contain" />
            </Link>
          </h1>
          <div className="flex justify-center items-center space-x-10">
            <div className="flex items-center space-x-3 bg-slate-800/50 backdrop-blur px-6 py-3 rounded-full border border-purple-500/30">
              <Trophy className="w-6 h-6 text-purple-400" />
              <span className="text-purple-300 font-bold text-xl">Score: {score}</span>
            </div>
            <div className={`flex items-center space-x-3 px-6 py-3 rounded-full border transition-all duration-300 ${
              time <= 10 
                ? 'bg-red-900/50 border-red-500/50 animate-pulse' 
                : 'bg-slate-800/50 border-blue-500/30'
            }`}>
              <Timer className={`w-6 h-6 ${time <= 10 ? 'text-red-400' : 'text-blue-400'}`} />
              <span className={`font-bold text-xl ${time <= 10 ? 'text-red-300' : 'text-blue-300'}`}>
                {time}s
              </span>
            </div>
          </div>
        </MotionDiv>

        {/* Main Content - Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left Column (Image and Hint Button) */}
          <div className="lg:w-1/2 w-full space-y-8">
            {/* Game Image */}
            <MotionDiv
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="relative"
            >
              <div className="relative w-full max-w-3xl mx-auto aspect-[4/3] overflow-hidden rounded-3xl border-2 border-purple-500/50 shadow-2xl">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt="Mystery object to guess"
                      className="w-full h-full object-cover object-center"
                    />
                    {showOverlay && !isCorrect && (
                      <MotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at center, transparent ${size}px, rgba(0,0,0,0.95) ${size + 1}px)`
                        }}
                      />
                    )}
                    {isCorrect && (
                      <MotionDiv
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-sm"
                      >
                        <div className="text-6xl lg:text-8xl animate-bounce">🎉</div>
                      </MotionDiv>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-slate-800/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 lg:h-20 lg:w-20 border-b-4 border-purple-500"></div>
                  </div>
                )}
              </div>
            </MotionDiv>

            {/* Hint Button */}
            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="text-center"
            >
              <MotionButton
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={settingsize}
                disabled={count === 0}
                className={`px-10 py-5 rounded-2xl font-bold text-xl lg:text-2xl transition-all duration-300 shadow-xl
                           ${count > 0 
                             ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-yellow-500/30 border border-yellow-500/50' 
                             : 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                           }`}
              >
                <div className="flex items-center space-x-3">
                  <Eye className="w-6 h-6" />
                  <span>Reveal More ({count} left)</span>
                  <Lightbulb className="w-6 h-6" />
                </div>
              </MotionButton>
            </MotionDiv>
          </div>

          {/* Right Column (Word Display and Input) */}
          <div className="lg:w-1/2 w-full space-y-10">
            {/* Word Display */}
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-8 border border-purple-500/30 shadow-2xl">
                <h2 className="text-2xl lg:text-3xl text-purple-300 mb-6 font-semibold">Decode the Word:</h2>
                <div className="text-5xl lg:text-6xl font-mono font-bold text-white tracking-wider min-h-[4rem] lg:min-h-[5rem] flex items-center justify-center">
                  {dashes || '_ _ _ _ _'}
                </div>
              </div>
            </MotionDiv>

            {/* Input Section */}
            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-6"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="What do you see? Type your guess..."
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && checkanswer(guess)}
                  className="w-full px-8 py-5 bg-slate-800/70 backdrop-blur-md border border-purple-500/30 rounded-3xl 
                             text-white text-xl lg:text-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 
                             focus:border-transparent transition-all duration-300 shadow-xl"
                />
                <Zap className="absolute right-6 top-1/2 transform -translate-y-1/2 w-8 h-8 lg:w-10 lg:h-10 text-purple-400" />
              </div>

              <MotionButton
                onClick={() => checkanswer(guess)}
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-10 py-5 
                           rounded-3xl font-bold text-xl lg:text-2xl shadow-2xl hover:shadow-purple-500/30 transition-all duration-300
                           border border-purple-500/50"
              >
                🚀 Submit Answer
              </MotionButton>
            </MotionDiv>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Singleplayer;