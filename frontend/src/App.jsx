import { useState, useEffect } from 'react';
import imageData from '/images.json'; // <- Import your JSON file

function App() {
  const [objectName, setObjectName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showOverlay, setShowOverlay] = useState(true);
  const [size, setSize] = useState(80);
  const [count, setCount] = useState(3);
  const [guess, setGuess] = useState('');

  useEffect(() => {
    fetchRandomImage();
  }, []);

  const fetchRandomImage = () => {
    const randomObj = imageData[Math.floor(Math.random() * imageData.length)];
    setObjectName(randomObj.name);
    setImageUrl(randomObj.url);
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

      <button
        onClick={settingsize}
        className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
      >
        Use Hint (Remaining: {count})
      </button>

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
