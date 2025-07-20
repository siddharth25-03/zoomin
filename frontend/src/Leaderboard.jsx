import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import applogo from './assets/app_logo.png';

const MotionDiv = motion.div;

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/leaderboard');
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        const data = await response.json();
        setLeaderboard(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard. Please try again later.');
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vh] bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vh] bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-8">
        {/* Header */}
        <MotionDiv
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          <h1 className="text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
            <Link to="/" className="mx-auto w-38 h-38 object-contain">
              <img src={applogo} alt="App Logo" className="mx-auto w-38 h-38 object-contain" />
            </Link>
          </h1>
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
            Leaderboard
          </h2>
        </MotionDiv>

        {/* Leaderboard List */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-slate-800/60 backdrop-blur-lg border border-purple-500/50 rounded-2xl p-6 text-white shadow-xl"
        >
          {loading ? (
            <div className="text-center text-lg text-purple-300">
              Loading leaderboard...
              <div className="animate-spin rounded-full h-12 w-12 mx-auto mt-4 border-b-4 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-lg text-red-400">{error}</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center text-lg text-purple-300">No scores yet. Play a game to get on the leaderboard!</div>
          ) : (
            <ul className="space-y-4">
              {leaderboard.map((player, index) => (
                <li
                  key={player._id}
                  className="flex justify-between items-center bg-slate-700/50 rounded-xl p-4 border border-purple-500/30"
                >
                  <div className="flex items-center space-x-3">
                    <Trophy
                      className={`w-6 h-6 ${
                        index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-pink-400' : 'text-purple-400'
                      }`}
                    />
                    <span className="text-lg font-semibold">{player.name}</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-400">{player.score} points</span>
                </li>
              ))}
            </ul>
          )}
        </MotionDiv>

        {/* Back Button */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link
            to="/"
            className="inline-flex items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/30 transition-all duration-300 border border-purple-500/50"
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            Back to Home
          </Link>
        </MotionDiv>
      </div>
    </div>
  );
}

export default Leaderboard;