import { createRoot } from 'react-dom/client'
import SinglePlayer from './Singleplayer.jsx'
import './index.css'
import Homepage from './Homepage.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/singleplayer" element={<SinglePlayer />} />
      </Routes>
  </BrowserRouter>
)
