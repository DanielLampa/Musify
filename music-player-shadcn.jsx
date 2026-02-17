import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Music, Upload, X, Plus, Search } from 'lucide-react';

export default function MusicPlayer() {
  const [songs, setSongs] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // off, all, one
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongs, setSelectedSongs] = useState([]);
  const audioRef = useRef(null);

  // Load songs from storage on mount
  useEffect(() => {
    loadSongsFromStorage();
  }, []);

  // Load songs from persistent storage
  const loadSongsFromStorage = async () => {
    try {
      const result = await window.storage.list('song:');
      if (result && result.keys) {
        const songsList = [];
        for (const key of result.keys) {
          const songData = await window.storage.get(key);
          if (songData) {
            songsList.push(JSON.parse(songData.value));
          }
        }
        setSongs(songsList);
      }
    } catch (error) {
      console.log('No songs in storage yet');
    }
  };

  // Handle song end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (currentIndex < queue.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (repeatMode === 'all') {
        setCurrentIndex(0);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentIndex, queue.length, repeatMode]);

  // Auto-play when current index changes
  useEffect(() => {
    if (queue.length > 0 && audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentIndex, queue]);

  // Handle file upload
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      if (file.type === 'audio/mpeg' || file.type === 'audio/mp3') {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target.result;
          const songData = {
            id: `song:${Date.now()}_${Math.random()}`,
            name: file.name.replace('.mp3', ''),
            data: base64Data,
            size: file.size,
            uploadedAt: new Date().toISOString()
          };

          // Save to storage
          try {
            await window.storage.set(songData.id, JSON.stringify(songData));
            setSongs(prev => [...prev, songData]);
          } catch (error) {
            console.error('Error saving song:', error);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Playback controls
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (repeatMode === 'all') {
      setCurrentIndex(0);
    }
  };

  const playPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const shuffleQueue = () => {
    if (queue.length <= 1) return;
    const current = queue[currentIndex];
    const remaining = queue.filter((_, i) => i !== currentIndex);
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    setQueue([current, ...shuffled]);
    setCurrentIndex(0);
  };

  const toggleRepeat = () => {
    const modes = ['off', 'all', 'one'];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  // Queue management
  const addToQueue = (song) => {
    if (!queue.find(s => s.id === song.id)) {
      setQueue([...queue, song]);
    }
  };

  const removeFromQueue = (index) => {
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
    if (currentIndex >= newQueue.length && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const playNow = (song) => {
    setQueue([song]);
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  const playAll = () => {
    setQueue(filteredSongs);
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  const shuffleAll = () => {
    const shuffled = [...filteredSongs].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  const addSelectedToQueue = () => {
    const newSongs = selectedSongs.filter(song => !queue.find(q => q.id === song.id));
    setQueue([...queue, ...newSongs]);
    setSelectedSongs([]);
  };

  const toggleSongSelection = (song) => {
    if (selectedSongs.find(s => s.id === song.id)) {
      setSelectedSongs(selectedSongs.filter(s => s.id !== song.id));
    } else {
      setSelectedSongs([...selectedSongs, song]);
    }
  };

  // Filter songs
  const filteredSongs = songs.filter(song =>
    song.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentSong = queue[currentIndex];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sidebar - Now Playing */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Now Playing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentSong ? (
                <>
                  {/* Album Art */}
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <Music className="w-16 h-16 text-gray-400" />
                  </div>

                  {/* Song Info */}
                  <div className="text-center space-y-1">
                    <h3 className="font-semibold text-lg">{currentSong.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Track {currentIndex + 1} of {queue.length}
                    </p>
                  </div>

                  {/* Audio Player */}
                  <audio
                    ref={audioRef}
                    src={currentSong.data}
                    className="w-full"
                    controls
                  />

                  {/* Playback Controls */}
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={shuffleQueue}
                      title="Shuffle"
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={playPrevious}
                      disabled={currentIndex === 0 && repeatMode !== 'all'}
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="icon"
                      onClick={togglePlay}
                      className="w-12 h-12"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={playNext}
                      disabled={currentIndex === queue.length - 1 && repeatMode === 'off'}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleRepeat}
                      title={`Repeat: ${repeatMode}`}
                    >
                      <Repeat className={`w-4 h-4 ${repeatMode !== 'off' ? 'text-primary' : ''}`} />
                    </Button>
                  </div>

                  {/* Up Next */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Up Next</h4>
                    <ScrollArea className="h-32">
                      {queue.slice(currentIndex + 1, currentIndex + 4).map((song, idx) => (
                        <div
                          key={song.id}
                          className="text-sm p-2 rounded bg-muted/50 mb-1"
                        >
                          {idx + 1}. {song.name}
                        </div>
                      ))}
                      {queue.length <= currentIndex + 1 && (
                        <p className="text-sm text-muted-foreground italic">No more songs</p>
                      )}
                    </ScrollArea>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 space-y-2">
                  <Music className="w-16 h-16 mx-auto text-gray-300" />
                  <p className="text-muted-foreground">No song playing</p>
                  <p className="text-sm text-muted-foreground">
                    Select songs from your library
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold">{songs.length}</div>
                <div className="text-sm text-muted-foreground">Total Songs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold">{queue.length}</div>
                <div className="text-sm text-muted-foreground">In Queue</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold">
                  {queue.length > 0 ? currentIndex + 1 : 0}
                </div>
                <div className="text-sm text-muted-foreground">Playing</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold">{selectedSongs.length}</div>
                <div className="text-sm text-muted-foreground">Selected</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="library" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="queue">Queue</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Library Tab */}
            <TabsContent value="library" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search your library..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={playAll} variant="outline">
                        <Play className="w-4 h-4 mr-2" />
                        Play All
                      </Button>
                      <Button onClick={shuffleAll} variant="outline">
                        <Shuffle className="w-4 h-4 mr-2" />
                        Shuffle All
                      </Button>
                      <Button
                        onClick={addSelectedToQueue}
                        disabled={selectedSongs.length === 0}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Selected
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-2">
                      {filteredSongs.length > 0 ? (
                        filteredSongs.map((song) => {
                          const isSelected = selectedSongs.find(s => s.id === song.id);
                          const inQueue = queue.find(s => s.id === song.id);
                          
                          return (
                            <div
                              key={song.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border ${
                                isSelected ? 'bg-accent' : 'hover:bg-accent/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={!!isSelected}
                                onChange={() => toggleSongSelection(song)}
                                className="w-4 h-4"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Music className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <span className="font-medium truncate">
                                    {song.name}
                                  </span>
                                  {inQueue && (
                                    <span className="text-xs text-muted-foreground">
                                      (In Queue)
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => addToQueue(song)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => playNow(song)}
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          {searchQuery ? 'No songs found' : 'No songs in library'}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Queue Tab */}
            <TabsContent value="queue" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current Queue</CardTitle>
                      <CardDescription>
                        {queue.length} songs • Track {currentIndex + 1} playing
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={shuffleQueue} variant="outline" size="sm">
                        <Shuffle className="w-4 h-4 mr-2" />
                        Shuffle
                      </Button>
                      <Button
                        onClick={() => setQueue([])}
                        variant="outline"
                        size="sm"
                      >
                        Clear Queue
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    {queue.length > 0 ? (
                      <div className="space-y-2">
                        {queue.map((song, idx) => {
                          const isCurrent = idx === currentIndex;
                          
                          return (
                            <div
                              key={`${song.id}-${idx}`}
                              className={`flex items-center gap-3 p-3 rounded-lg border ${
                                isCurrent ? 'bg-primary/10 border-primary' : ''
                              }`}
                            >
                              <div className="w-8 text-center font-semibold">
                                {isCurrent ? '▶️' : idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`truncate ${isCurrent ? 'font-bold' : ''}`}>
                                  {song.name}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromQueue(idx)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-4">
                        <Music className="w-16 h-16 mx-auto text-gray-300" />
                        <div>
                          <h3 className="font-semibold">Queue is empty</h3>
                          <p className="text-sm text-muted-foreground">
                            Add songs from your library
                          </p>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Songs</CardTitle>
                  <CardDescription>
                    Upload MP3 files to your library
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed rounded-lg p-12 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="audio/mp3,audio/mpeg"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button variant="outline">
                        Choose MP3 Files
                      </Button>
                    </label>
                    <p className="text-sm text-muted-foreground mt-2">
                      or drag and drop files here
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Library Info</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{songs.length}</div>
                    <div className="text-sm text-muted-foreground">Total Songs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{queue.length}</div>
                    <div className="text-sm text-muted-foreground">In Queue</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{repeatMode.toUpperCase()}</div>
                    <div className="text-sm text-muted-foreground">Repeat Mode</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{isPlaying ? 'Yes' : 'No'}</div>
                    <div className="text-sm text-muted-foreground">Playing</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Music Player</strong> - shadcn/ui Edition</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Automatic next song playback</li>
                    <li>Shuffle and repeat modes</li>
                    <li>Persistent storage for your library</li>
                    <li>Multiple selection support</li>
                    <li>Clean, modern design with shadcn/ui</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
