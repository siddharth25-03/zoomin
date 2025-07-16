// import { useState } from 'react'
// import img from './assets/taxi.avif' // replace with actual path

// const objectList = ['toaster', 'guitar', 'microwave', 'football', 'couch', 'lamp', 'chair', 'bottle'];

// const UNSPLASH_ACCESS_KEY = 'SCK4PkWFJ36zpo6bZlHwUoaYYMYhesXOAxPN2MiYDSY';
// function App() {
//   const [objectName, setObjectName] = useState('');
//   const [imageUrl, setImageUrl] = useState('');
//   const [showOverlay, setShowOverlay] = useState(true)
//   const [size,setsize] =useState(80);
//   const [count,setcount]=useState(3);
//   const [guess,setguess]=useState('');
//   const [excluded,setexclude]=useState([]);
//   let actualanswer='flower';


//   function settingsize(){
//     if(count>0){
//       setsize(size+50);
//       setcount(count-1);
//     }
//     else{
//       alert('You are out of hints');
//     }
//   };

//   function checkanswer(ans){
//     let result = ans.toLowerCase();
//     if(result===actualanswer){
//       alert('You won');
//     }
//     else{
//       alert('Wrong answer');
//     }
//   };


//   return (
//     // div that makes the elements at the center 
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 space-y-6">
//       <input
//         type="text"
//         placeholder="Type the object name..."
//         value={guess}
//         onChange={(e) => setguess(e.target.value)}
//         className="px-4 py-2 border border-gray-300 rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
//       />
//       <button
//         onClick={()=> checkanswer(guess)}
//         className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//       >
//         Submit your answer
//       </button>
//      {/* Toggle button */}

//       {/* <button
//         onClick={()=> setShowOverlay(!showOverlay)}
//         className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//       >
//         {showOverlay ? 'Hide' : 'Show'} Overlay
//       </button> */}

//       {/* 4:3 Box with image and overlay */}
//       <div className="relative w-[80vw] max-w-[600px] aspect-[4/3] overflow-hidden">
//         <img
//           src={img}
//           alt="Base"
//           className="w-full h-full object-cover object-center"
//         />

//         {/* Overlay with transparent center */}
//         {showOverlay && (
//           <div
//             className="absolute inset-0 pointer-events-none"
//             style={{
//               background: `radial-gradient(circle at center, transparent ${size}px, black ${size+1}px)`,
//             }}
//           />
//         )}
//       </div>
//       <button
//         onClick={()=>settingsize()}
//         className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//       >
//         Use hints
//         Remaining: {count}
//       </button>
//       <input type="text" />
//     </div>
//   )
// }

// export default App






import { useState, useEffect } from 'react';
import axios from 'axios';

const objectList = ['toaster', 'guitar', 'microwave', 'football', 'couch', 'lamp', 'chair', 'bottle', 'camera', 'book'];

const UNSPLASH_ACCESS_KEY = 'SCK4PkWFJ36zpo6bZlHwUoaYYMYhesXOAxPN2MiYDSY';

function App() {
  const [objectName, setObjectName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showOverlay, setShowOverlay] = useState(true);
  const [size, setSize] = useState(80);
  const [count, setCount] = useState(3);
  const [guess, setGuess] = useState('');

  // Load an image on first mount
  useEffect(() => {
    fetchRandomImage();
  }, []);

  // Fetch image from Unsplash
  const fetchRandomImage = async () => {
    const randomObject = objectList[Math.floor(Math.random() * objectList.length)];
    setObjectName(randomObject); // this is the correct answer

    try {
      const res = await axios.get(
        `https://api.unsplash.com/photos/random?query=${randomObject}&orientation=squarish&client_id=${UNSPLASH_ACCESS_KEY}`
      );
      setImageUrl(res.data.urls.regular);
    } catch (err) {
      console.error("Failed to fetch image:", err);
      alert("Failed to load image. Try again.");
    }
  };

  // Handle zoom hint
  const settingsize = () => {
    if (count > 0) {
      setSize(size + 50);
      setCount(count - 1);
    } else {
      alert('You are out of hints');
    }
  };

  // Check if guessed answer is correct
  const checkanswer = (ans) => {
    if (ans.toLowerCase().trim() === objectName.toLowerCase()) {
      alert('✅ Correct!');
    } else {
      alert('❌ Wrong answer');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 space-y-6">
      <h1 className="text-2xl font-bold">🔍 Guess the Object</h1>

      <input
        type="text"
        placeholder="Type the object name..."
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
      />

      <button
        onClick={() => checkanswer(guess)}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Submit your answer
      </button>

      {/* Image area */}
      <div className="relative w-[80vw] max-w-[600px] aspect-[4/3] overflow-hidden rounded border border-black">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Guess this object"
              className="w-full h-full object-cover object-center"
            />
            {showOverlay && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, transparent ${size}px, black ${size + 1}px)`
                }}
              />
            )}
          </>
        ) : (
          <p>Loading image...</p>
        )}
      </div>

      {/* Hint button */}
      <button
        onClick={settingsize}
        className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
      >
        Use Hint (Remaining: {count})
      </button>

      {/* Refresh button */}
      <button
        onClick={() => {
          fetchRandomImage();
          setSize(80);
          setCount(3);
          setGuess('');
        }}
        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        🔄 Load New Object
      </button>
    </div>
  );
}

export default App;





