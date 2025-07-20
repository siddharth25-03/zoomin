import { createRoot } from 'react-dom/client'
import SinglePlayer from './Singleplayer.jsx'
import './index.css'
import Homepage from './Homepage.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Multiplayer from './Multiplayer.jsx';
import Leaderboard from './Leaderboard.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/singleplayer" element={<SinglePlayer />} />
        <Route path="/multiplayer" element={<Multiplayer />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
  </BrowserRouter>
)
