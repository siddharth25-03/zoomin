import { useState } from 'react'
import img from './assets/pic.jpeg' // replace with actual path

function App() {
  const [showOverlay, setShowOverlay] = useState(true)
  const [size,setsize] =useState(80);
  const [count,setcount]=useState(3);
  const [guess,setguess]=useState('');
  const [excluded,setexclude]=useState([]);
  let actualanswer='flower';

  function settingsize(){
    if(count>0){
      setsize(size+50);
      setcount(count-1);
    }
    else{
      alert('You are out of hints');
    }
  }
  function checkanswer(ans){
    let result = ans.toLowerCase();
    if(result===actualanswer){
      alert('You won');
    }
    else{
      alert('Wrong answer');
    }
  }


  return (
    // div that makes the elements at the center 
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 space-y-6">
      <input
        type="text"
        placeholder="Type the object name..."
        value={guess}
        onChange={(e) => setguess(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
      />
      <button
        onClick={()=> checkanswer(guess)}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Submit your answer
      </button>
     {/* Toggle button */}

      {/* <button
        onClick={()=> setShowOverlay(!showOverlay)}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {showOverlay ? 'Hide' : 'Show'} Overlay
      </button> */}

      {/* 4:3 Box with image and overlay */}
      <div className="relative w-[80vw] max-w-[600px] aspect-[4/3] overflow-hidden">
        <img
          src={img}
          alt="Base"
          className="w-full h-full object-cover object-center"
        />

        {/* Overlay with transparent center */}
        {showOverlay && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, transparent ${size}px, black ${size+1}px)`,
            }}
          />
        )}
      </div>
      <button
        onClick={()=>settingsize()}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Use hints
        Remaining: {count}
      </button>
      <input type="text" />
    </div>
  )
}

export default App
