import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials exist, otherwise fallback to offline mode
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const LOCAL_STORAGE_KEY = 'chaos_party_leaderboard';

// Default mock scores for fresh installations
const DEFAULT_SCORES = [
  { name: 'CHAMP 👑', avatar: '🦁', score: 320 },
  { name: 'SPEEDY ⚡', avatar: '🐱', score: 280 },
  { name: 'DOPAMINE 💊', avatar: '🦄', score: 240 },
  { name: 'CHILLER 🧊', avatar: '🐼', score: 180 },
  { name: 'NOOB 🐌', avatar: '🥔', score: 100 }
];

export async function getTopScores() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('name, avatar, score, created_at')
        .order('score', { ascending: false })
        .limit(5);
      
      if (!error && data) {
        return data;
      }
      console.warn('Supabase fetch error, using local storage:', error);
    } catch (err) {
      console.warn('Failed to query Supabase:', err);
    }
  }

  // Local Storage fallback
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (localData) {
    try {
      return JSON.parse(localData).sort((a, b) => b.score - a.score).slice(0, 5);
    } catch (e) {
      return DEFAULT_SCORES;
    }
  }
  
  // Set default scores on first load
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SCORES));
  return DEFAULT_SCORES;
}

export async function submitHighScore(name, avatar, score) {
  const formattedScore = {
    name: name || 'Guest',
    avatar: avatar || '👾',
    score: parseInt(score) || 0,
    created_at: new Date().toISOString()
  };

  // Submit to Supabase if connected
  if (supabase) {
    try {
      const { error } = await supabase
        .from('leaderboard')
        .insert([formattedScore]);
      
      if (!error) {
        console.log('High score submitted to Supabase!');
      } else {
        console.warn('Supabase insert error:', error);
      }
    } catch (err) {
      console.warn('Failed to insert into Supabase:', err);
    }
  }

  // Always update Local Storage to keep local client in sync
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    let scores = localData ? JSON.parse(localData) : [...DEFAULT_SCORES];
    
    scores.push(formattedScore);
    // Sort and keep top 10 to prevent bloated storage
    scores = scores.sort((a, b) => b.score - a.score).slice(0, 10);
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scores));
  } catch (e) {
    console.error('Failed to update local leaderboard:', e);
  }
}
