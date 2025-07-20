import applogo from './assets/app_logo.png';
import { motion } from "framer-motion";
import { Trophy, Users, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MotionButton = motion.button;
const MotionDiv = motion.div;

function Homepage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 w-full max-w-4xl space-y-8">
                {/* Header */}
                <MotionDiv
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center space-y-4"
                >
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
                        <img src={applogo} alt="App Logo" className="mx-auto w-75 h-75 object-contain" />
                    </h1>
                </MotionDiv>

                {/* Instructions Box */}
                <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-black/30 backdrop-blur-lg border border-purple-500/50 rounded-2xl p-6 text-white shadow-xl"
                >
                    <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                        How to Play
                    </h2>
                    <ul className="list-disc list-inside space-y-2 text-lg">
                        <li>You have 30 seconds to guess the zoomed-in object.</li>
                        <li>You get only 3 hints to zoom out.</li>
                        <li>Your score is based on how quickly you guess correctly.</li>
                        <li>Letters of the word will be revealed at 15th and 8th seconds.</li>
                    </ul>
                </MotionDiv>

                {/* Game Mode Buttons */}
                <MotionDiv
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-6"
                >
                    <MotionButton
                        onClick={() => navigate('/singleplayer')}
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 border border-purple-500/50 flex items-center justify-center space-x-2"
                    >
                        <Trophy className="w-6 h-6" />
                        <span>SINGLE PLAYER</span>
                    </MotionButton>

                    <MotionButton
                        onClick={() => navigate('/multiplayer')}
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-yellow-500/30 transition-all duration-300 border border-yellow-500/50 flex items-center justify-center space-x-2"
                    >
                        <Users className="w-6 h-6" />
                        <span>MULTIPLAYER</span>
                    </MotionButton>

                    <MotionButton
                        onClick={() => navigate('/leaderboard')}
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-yellow-500/30 transition-all duration-300 border border-yellow-500/50 flex items-center justify-center space-x-2"
                    >
                        <ClipboardList className="w-6 h-6" />
                        <span>LEADERBOARD</span>
                    </MotionButton>
                </MotionDiv>
            </div>
        </div>
    );
}

export default Homepage;