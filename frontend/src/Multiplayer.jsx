import { useState, useEffect, Component } from 'react';
import { motion } from 'framer-motion';
import { Eye, Timer, Lightbulb, MessageSquare, Users, Trophy } from 'lucide-react';
import io from 'socket.io-client';
import applogo from './assets/app_logo.png';
import { Link } from 'react-router-dom';

const MotionButton = motion.button;
const MotionDiv = motion.div;

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center text-white p-8">
          <h1 className="text-3xl font-bold text-red-400">Something went wrong!</h1>
          <p className="text-lg mt-4">Please refresh the page or try again later.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold"
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Multiplayer() {
  const [socket, setSocket] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState({
    round: 0,
    currentImage: null,
    currentObjectName: '',
    hintCount: 3,
    size: 80,
    time: 30,
    revealedIndices: [],
    correctPlayers: [],
    chatMessages: [],
  });
  const [guess, setGuess] = useState('');
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [dashes, setDashes] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('roomCreated', ({ roomCode, playerName, isHost }) => {
      console.log('Room Created:', { roomCode, playerName, isHost });
      setRoomCode(roomCode);
      setIsRoomCreated(true);
      setIsHost(isHost);
      setShowJoinForm(false);
      setPlayerName(playerName);
      setPlayers([{ id: newSocket.id, name: playerName }]);
    });

    newSocket.on('roomJoined', ({ roomCode, playerName, isHost }) => {
      console.log('Room Joined:', { roomCode, playerName, isHost });
      setRoomCode(roomCode);
      setIsJoined(true);
      setIsHost(isHost);
      setShowJoinForm(false);
      setPlayerName(playerName);
    });

    newSocket.on('playerList', (playerList) => {
      console.log('Received playerList:', playerList);
      setPlayers(playerList || []);
    });

    newSocket.on('gameStarted', (newGameState) => {
      console.log('Game Started:', newGameState);
      setGameStarted(true);
      setGameState({
        ...newGameState,
        chatMessages: newGameState.chatMessages || [],
        correctPlayers: newGameState.correctPlayers || [],
        revealedIndices: Array.isArray(newGameState.revealedIndices) ? newGameState.revealedIndices : [],
      });
      setShowRoundModal(false);
      setShowFinalModal(false);
      setImageError(false);
    });

    newSocket.on('updateGameState', ({ time, revealedIndices, size, hintCount, correctPlayers }) => {
      console.log('updateGameState:', { time, revealedIndices, size, hintCount, correctPlayers });
      setGameState(prev => ({
        ...prev,
        time,
        revealedIndices: Array.isArray(revealedIndices) ? revealedIndices : prev.revealedIndices || [],
        size,
        hintCount,
        correctPlayers: Array.isArray(correctPlayers) ? correctPlayers : prev.correctPlayers || [],
      }));
    });

    newSocket.on('chatMessage', (message) => {
      console.log('Received chatMessage:', message);
      setGameState(prev => ({
        ...prev,
        chatMessages: [...(prev.chatMessages || []), message],
      }));
    });

    newSocket.on('endRound', ({ objectName, correctPlayers, isFinalRound, players }) => {
      console.log('End Round:', { objectName, correctPlayers, isFinalRound, players });
      setGameState(prev => ({
        ...prev,
        correctPlayers: Array.isArray(correctPlayers) ? correctPlayers : [],
        currentObjectName: objectName,
        revealedIndices: [], // Reset for next round
      }));
      setPlayers(players || []);
      setShowRoundModal(true);
      if (isFinalRound) {
        setShowFinalModal(true);
        setShowRoundModal(false);
      }
    });

    newSocket.on('nextRound', (newGameState) => {
      console.log('Next Round:', newGameState);
      setGameState({
        ...newGameState,
        chatMessages: newGameState.chatMessages || [],
        correctPlayers: Array.isArray(newGameState.correctPlayers) ? newGameState.correctPlayers : [],
        revealedIndices: Array.isArray(newGameState.revealedIndices) ? newGameState.revealedIndices : [],
      });
      setShowRoundModal(false);
      setGuess('');
      setImageError(false);
    });

    newSocket.on('error', ({ message }) => {
      console.error('Server error:', message);
      alert(message);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      alert('Failed to connect to the server. Please try again.');
    });

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (gameStarted && socket) {
      const interval = setInterval(() => {
        socket.emit('requestTimerUpdate', { roomCode });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStarted, socket, roomCode]);

  useEffect(() => {
    let tempstring = '';
    if (gameState.currentObjectName) {
      const indices = Array.isArray(gameState.revealedIndices) ? gameState.revealedIndices : [];
      console.log('Generating dashes:', { currentObjectName: gameState.currentObjectName, revealedIndices: indices });
      for (let i = 0; i < gameState.currentObjectName.length; i++) {
        if (gameState.currentObjectName[i] === ' ') {
          tempstring += '\u00A0\u00A0';
        } else if (indices.includes(i)) {
          tempstring += gameState.currentObjectName[i] + ' ';
        } else {
          tempstring += '_ ';
        }
      }
    }
    setDashes(tempstring.trim());
  }, [gameState.currentObjectName, gameState.revealedIndices]);

  const handleCreateRoom = () => {
    if (socket) {
      socket.emit('createRoom', (response) => {
        if (response.error) {
          alert(response.error);
        }
      });
    }
  };

  const handleJoinRoom = () => {
    if (socket && joinCode && playerName) {
      socket.emit('joinRoom', { roomCode: joinCode, playerName }, (response) => {
        if (response.error) {
          alert(response.error);
        }
      });
    } else {
      alert('Please enter both a room code and player name.');
    }
  };

  const toggleJoinForm = () => {
    setShowJoinForm(!showJoinForm);
    setJoinCode('');
    setPlayerName('');
    setIsRoomCreated(false);
  };

  const handleStartGame = () => {
    if (socket && isHost) {
      console.log('Starting game with roomCode:', roomCode);
      socket.emit('startGame', { roomCode });
    }
  };

  const handleSubmitGuess = () => {
    if (socket && guess && !isGuessInputDisabled) {
      console.log('Submitting guess:', { roomCode, guess, playerName });
      socket.emit('submitGuess', { roomCode, guess, playerName });
      setGuess('');
    }
  };

  const handleUseHint = () => {
    if (socket && isHost) {
      socket.emit('useHint', { roomCode });
    }
  };

  const handleNextRound = () => {
    if (socket && isHost) {
      socket.emit('nextRound', { roomCode });
    }
  };

  const handleImageError = () => {
    console.error('Image failed to load:', gameState.currentImage);
    setImageError(true);
  };

  const isGuessInputDisabled = Array.isArray(gameState.correctPlayers) && playerName && gameState.correctPlayers.some(p => p.name === playerName);
  console.log('isGuessInputDisabled:', { isGuessInputDisabled, playerName, correctPlayers: gameState.correctPlayers });

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vh] bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vh] bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl space-y-12">
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
            {(isRoomCreated || isJoined) && (
              <div className="text-center text-purple-300 font-semibold text-xl">
                <p>Room Code: <span className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">{roomCode}</span></p>
                <p>Players in room:</p>
                <ul className="list-disc list-inside">
                  {Array.isArray(players) && players.length > 0 ? (
                    players.map((player) => (
                      <li key={player.id}>{player.name}</li>
                    ))
                  ) : (
                    <li>No players yet</li>
                  )}
                </ul>
              </div>
            )}
            {!gameStarted && isHost && isRoomCreated && (
              <MotionButton
                onClick={handleStartGame}
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-green-500/30 transition-all duration-300 border border-green-500/50"
              >
                Start Game
              </MotionButton>
            )}
          </MotionDiv>

          {!gameStarted && (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              <MotionButton
                onClick={handleCreateRoom}
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 border border-purple-500/50 flex items-center justify-center space-x-2"
              >
                <Users className="w-6 h-6" />
                <span>Create Room</span>
              </MotionButton>
              <MotionButton
                onClick={toggleJoinForm}
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-yellow-500/30 transition-all duration-300 border border-yellow-500/50 flex items-center justify-center space-x-2"
              >
                <Users className="w-6 h-6" />
                <span>Join Room</span>
              </MotionButton>
              {showJoinForm && (
                <MotionDiv
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-slate-800/60 backdrop-blur-lg border border-purple-500/50 rounded-2xl p-6 text-white shadow-xl space-y-4"
                >
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter Room Code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full px-6 py-3 bg-slate-800/70 backdrop-blur-md border border-purple-500/30 rounded-xl text-white text-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter Your Name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full px-6 py-3 bg-slate-800/70 backdrop-blur-md border border-purple-500/30 rounded-xl text-white text-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                    />
                  </div>
                  <MotionButton
                    onClick={handleJoinRoom}
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(147, 51, 234, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-green-500/30 transition-all duration-300 border border-green-500/50"
                  >
                    Join
                  </MotionButton>
                </MotionDiv>
              )}
            </MotionDiv>
          )}

          {gameStarted && (
            <>
              <div className="flex justify-center items-center space-x-10">
                <div className="flex items-center space-x-3 bg-slate-800/50 backdrop-blur px-6 py-3 rounded-full border border-purple-500/30">
                  <Trophy className="w-6 h-6 text-purple-400" />
                  <span className="text-purple-300 font-bold text-xl">
                    Your Score: {players.find(p => p.name === playerName)?.score || 0}
                  </span>
                </div>
                <div className="flex items-center space-x-3 bg-slate-800/50 backdrop-blur px-6 py-3 rounded-full border border-purple-500/30">
                  <Trophy className="w-6 h-6 text-purple-400" />
                  <span className="text-purple-300 font-bold text-xl">Round: {gameState.round}/10</span>
                </div>
                <div className={`flex items-center space-x-3 px-6 py-3 rounded-full border transition-all duration-300 ${gameState.time <= 10 ? 'bg-red-900/50 border-red-500/50 animate-pulse' : 'bg-slate-800/50 border-blue-500/30'}`}>
                  <Timer className={`w-6 h-6 ${gameState.time <= 10 ? 'text-red-400' : 'text-blue-400'}`} />
                  <span className={`font-bold text-xl ${gameState.time <= 10 ? 'text-red-300' : 'text-blue-300'}`}>
                    {gameState.time}s
                  </span>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-10">
                <div className="lg:w-1/2 w-full space-y-8">
                  <MotionDiv
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="relative"
                  >
                    <div className="relative w-full max-w-3xl mx-auto aspect-[4/3] overflow-hidden rounded-3xl border-2 border-purple-500/50 shadow-2xl">
                      {gameState.currentImage && !imageError ? (
                        <>
                          <img
                            src={gameState.currentImage}
                            alt="Mystery object to guess"
                            className="w-full h-full object-cover object-center"
                            onError={handleImageError}
                          />
                          <MotionDiv
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `radial-gradient(circle at center, transparent ${gameState.size}px, rgba(0,0,0,0.95) ${gameState.size + 1}px)`
                            }}
                          />
                        </>
                      ) : (
                        <div className="w-full h-full bg-slate-800/50 flex items-center justify-center">
                          {imageError ? (
                            <p className="text-red-400 text-lg">Failed to load image</p>
                          ) : (
                            <div className="animate-spin rounded-full h-16 w-16 lg:h-20 lg:w-20 border-b-4 border-purple-500"></div>
                          )}
                        </div>
                      )}
                    </div>
                  </MotionDiv>
                  {isHost && (
                    <MotionDiv
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      className="text-center"
                    >
                      <MotionButton
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleUseHint}
                        disabled={gameState.hintCount === 0}
                        className={`px-10 py-5 rounded-2xl font-bold text-xl lg:text-2xl transition-all duration-300 shadow-xl ${gameState.hintCount > 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-yellow-500/30 border border-yellow-500/50' : 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <Eye className="w-6 h-6" />
                          <span>Reveal More ({gameState.hintCount} left)</span>
                          <Lightbulb className="w-6 h-6" />
                        </div>
                      </MotionButton>
                    </MotionDiv>
                  )}
                </div>

                <div className="lg:w-1/2 w-full space-y-10">
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

                  <MotionDiv
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="space-y-6"
                  >
                    <div className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-6 border border-purple-500/30 shadow-2xl h-48 overflow-y-auto">
                      {Array.isArray(gameState.chatMessages) && gameState.chatMessages.length > 0 ? (
                        gameState.chatMessages.map((msg, index) => (
                          <div key={index} className={`text-lg mb-2 ${msg.isCorrect ? 'text-green-400 font-semibold' : 'text-white'}`}>
                            {msg.isCorrect ? (
                              msg.message
                            ) : (
                              <>
                                <span className="font-semibold text-purple-300">{msg.playerName}</span>: {msg.guess} <span className="text-sm text-slate-400">({msg.timestamp})</span>
                              </>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-white text-lg">No messages yet</div>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={isGuessInputDisabled ? "You guessed correctly!" : "Type your guess..."}
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmitGuess()}
                        className={`w-full px-8 py-5 bg-slate-800/70 backdrop-blur-md border border-purple-500/30 rounded-3xl text-white text-xl lg:text-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 shadow-xl ${isGuessInputDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                        disabled={isGuessInputDisabled}
                      />
                      <MessageSquare className="absolute right-6 top-1/2 transform -translate-y-1/2 w-8 h-8 lg:w-10 lg:h-10 text-purple-400" />
                    </div>
                    <MotionButton
                      onClick={handleSubmitGuess}
                      whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-10 py-5 rounded-3xl font-bold text-xl lg:text-2xl shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 border border-purple-500/50 ${isGuessInputDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                      disabled={isGuessInputDisabled}
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <MessageSquare className="w-6 h-6" />
                        <span>Submit Guess</span>
                      </div>
                    </MotionButton>
                  </MotionDiv>
                </div>
              </div>
            </>
          )}

          {showRoundModal && (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 p-4"
            >
              <div className="relative bg-slate-900/80 backdrop-blur-xl border-2 border-purple-500/50 rounded-3xl p-8 max-w-md w-full text-white shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 pointer-events-none"></div>
                <div className="relative z-10 space-y-6">
                  <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
                    Round {gameState.round} Results
                  </h2>
                  <div className="text-center space-y-4">
                    <p className="text-lg text-purple-200">The object was "{gameState.currentObjectName}".</p>
                    <div className="space-y-2">
                      {Array.isArray(gameState.correctPlayers) && gameState.correctPlayers.length > 0 ? (
                        gameState.correctPlayers.map(player => (
                          <div key={player.name} className="flex items-center justify-between">
                            <span className="text-lg text-purple-300">{player.name}</span>
                            <span className="text-lg font-bold text-yellow-400">+{player.time * 10} points</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-lg text-purple-200">No one guessed correctly.</p>
                      )}
                    </div>
                  </div>
                  {isHost && gameState.round < 10 && (
                    <MotionButton
                      onClick={handleNextRound}
                      whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(147, 51, 234, 0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-green-500/30 transition-all duration-300 border border-green-500/50"
                    >
                      Next Round
                    </MotionButton>
                  )}
                  <MotionButton
                    onClick={() => window.location.href = '/'}
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(147, 51, 234, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/30 transition-all duration-300 border border-purple-500/50"
                  >
                    Back to Home
                  </MotionButton>
                </div>
              </div>
            </MotionDiv>
          )}

          {showFinalModal && (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 p-4"
            >
              <div className="relative bg-slate-900/80 backdrop-blur-xl border-2 border-purple-500/50 rounded-3xl p-8 max-w-md w-full text-white shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 pointer-events-none"></div>
                <div className="relative z-10 space-y-6">
                  <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
                    Final Leaderboard
                  </h2>
                  <div className="text-center space-y-4">
                    <p className="text-lg text-purple-200">Game Over! Here are the final scores:</p>
                    <div className="space-y-2">
                      {Array.isArray(players) && players.length > 0 ? (
                        players
                          .sort((a, b) => b.score - a.score)
                          .map((player, index) => (
                            <div key={player.id} className="flex items-center justify-between">
                              <span className="text-lg text-purple-300">{index + 1}. {player.name}</span>
                              <span className="text-lg font-bold text-yellow-400">{player.score} points</span>
                            </div>
                          ))
                      ) : (
                        <p className="text-lg text-purple-200">No players available.</p>
                      )}
                    </div>
                  </div>
                  <MotionButton
                    onClick={() => window.location.href = '/'}
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(147, 51, 234, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/30 transition-all duration-300 border border-purple-500/50"
                  >
                    Back to Home
                  </MotionButton>
                </div>
              </div>
            </MotionDiv>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default Multiplayer;