import { useState, useRef, useEffect } from 'react';
import { Music, Play, Square, Volume2, VolumeX } from 'lucide-react';

export default function DMAudioDeck() {
  const [activeTrackId, setActiveTrackId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioPlayer = useRef(null);

  // Working royalty-free ambient loops for testing!
  const tracks = [
    { id: 'tavern', name: 'Crowded Tavern', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=tavern-music-peasant-dance-103603.mp3' },
    { id: 'combat', name: 'Boss Battle', url: 'https://cdn.pixabay.com/download/audio/2021/11/24/audio_a1a0bd35d6.mp3?filename=epic-battle-music-1-80415.mp3' },
    { id: 'eerie', name: 'Eerie Cave', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_53b03bc98b.mp3?filename=dark-ambient-cave-104928.mp3' }
  ];

  // Initialize the audio object once when the component mounts
  useEffect(() => {
    audioPlayer.current = new Audio();
    audioPlayer.current.loop = true;

    // Cleanup when DM leaves the dashboard
    return () => {
      if (audioPlayer.current) {
        audioPlayer.current.pause();
        audioPlayer.current.src = '';
      }
    };
  }, []);

  const handlePlay = (track) => {
    if (!audioPlayer.current) return;

    if (activeTrackId === track.id) {
      // Toggle stop if clicking the currently playing track
      audioPlayer.current.pause();
      setActiveTrackId(null);
    } else {
      // Instantly swap source and play
      audioPlayer.current.pause();
      audioPlayer.current.src = track.url;
      audioPlayer.current.muted = isMuted;
      
      // Browsers require play() to be caught in case of autoplay policies
      audioPlayer.current.play().catch(e => console.error("Audio playback blocked:", e));
      setActiveTrackId(track.id);
    }
  };

  const toggleMute = () => {
    if (!audioPlayer.current) return;
    const newMuteState = !isMuted;
    audioPlayer.current.muted = newMuteState;
    setIsMuted(newMuteState);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl h-fit">
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
        <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
          <Music className="w-5 h-5" /> Ambient Soundboard
        </h3>
        <button 
          onClick={toggleMute}
          className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-red-900/30 text-red-400' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {tracks.map(track => {
          const isPlaying = activeTrackId === track.id;
          return (
            <button
              key={track.id}
              onClick={() => handlePlay(track)}
              className={`flex items-center justify-between p-3 md:p-4 rounded-xl border transition-all ${
                isPlaying 
                  ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                  : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-300'
              }`}
            >
              <span className={`font-bold text-sm md:text-base ${isPlaying ? 'text-indigo-400' : ''}`}>
                {track.name}
              </span>
              {isPlaying ? (
                <Square className="w-5 h-5 text-indigo-400 fill-current animate-pulse" />
              ) : (
                <Play className="w-5 h-5 text-slate-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}