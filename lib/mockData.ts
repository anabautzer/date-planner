// ─────────────────────────────────────────────────────────────
// Stand-in data so the app runs with zero API keys.
// Swap these for real TMDB / Google Places calls (see README).
// ─────────────────────────────────────────────────────────────

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster: string; // emoji fallback (used when posterUrl is absent)
  posterUrl?: string; // real TMDB poster (image.tmdb.org), when available
  rating: number;
  tags: string[]; // genres (real data) or flavor tags (mock fallback)
}

/**
 * Fallback "now playing" list, used only if /api/movies (TMDB) fails
 * or no TMDB_API_TOKEN is configured. See app/api/movies/route.ts.
 */
export const NOW_PLAYING: Movie[] = [
  {
    id: 101,
    title: 'Luz de Verão',
    overview: 'Dois estranhos cruzam a cidade em uma noite que muda tudo.',
    poster: '🌅',
    rating: 8.1,
    tags: ['Romance', 'Drama'],
  },
  {
    id: 102,
    title: 'O Último Trem',
    overview: 'Uma corrida contra o tempo por um bilhete e uma promessa.',
    poster: '🚂',
    rating: 7.4,
    tags: ['Suspense'],
  },
  {
    id: 103,
    title: 'Cartas para o Mar',
    overview: 'Romance epistolar entre duas cidades litorâneas.',
    poster: '🌊',
    rating: 8.6,
    tags: ['Romance'],
  },
  {
    id: 104,
    title: 'Meia-Noite em Paris?',
    overview: 'Uma comédia romântica sobre relógios que atrasam de propósito.',
    poster: '🕛',
    rating: 7.9,
    tags: ['Comédia', 'Romance'],
  },
  {
    id: 105,
    title: 'Constelações',
    overview: 'Ficção científica intimista sobre distância e reencontro.',
    poster: '✨',
    rating: 8.3,
    tags: ['Ficção científica'],
  },
  {
    id: 106,
    title: 'Café da Esquina',
    overview: 'Slice-of-life sobre um barista e uma cliente de todo dia.',
    poster: '☕',
    rating: 7.1,
    tags: ['Drama'],
  },
];

/** Fake Places autocomplete. Real source: Google Places Autocomplete. */
export const PLACE_SUGGESTIONS: { name: string; category: string }[] = [
  { name: 'Café Aurora', category: 'Café' },
  { name: 'Trattoria Bella Vista', category: 'Restaurante Italiano' },
  { name: 'Parque das Orquídeas', category: 'Parque' },
  { name: 'Bar do Mirante', category: 'Bar' },
  { name: 'Sushi Kaze', category: 'Restaurante Japonês' },
  { name: 'Livraria & Vinho', category: 'Livraria / Wine bar' },
  { name: 'Mercado Gourmet', category: 'Mercado' },
  { name: 'Cine Retrô', category: 'Cinema' },
  { name: 'Boliche Central', category: 'Entretenimento' },
  { name: 'Museu de Arte Moderna', category: 'Museu' },
];

export const CUISINES = [
  { id: 'jp', label: 'Japonesa', emoji: '🍣' },
  { id: 'it', label: 'Italiana', emoji: '🍝' },
  { id: 'burger', label: 'Hamburgueria', emoji: '🍔' },
  { id: 'cafe', label: 'Café & Brunch', emoji: '☕' },
  { id: 'mx', label: 'Mexicana', emoji: '🌮' },
  { id: 'veg', label: 'Vegetariana', emoji: '🥗' },
  { id: 'vegan', label: 'Vegana', emoji: '🌱' },
  { id: 'sea', label: 'Frutos do mar', emoji: '🦐' },
  { id: 'sweet', label: 'Doces & Sobremesas', emoji: '🍰' },
  { id: 'cn', label: 'Chinesa', emoji: '🥡' },
  { id: 'bbq', label: 'Churrasco', emoji: '🥩' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'th', label: 'Tailandesa', emoji: '🍜' },
  { id: 'in', label: 'Indiana', emoji: '🍛' },
  { id: 'ar', label: 'Árabe', emoji: '🧆' },
  { id: 'fr', label: 'Francesa', emoji: '🥐' },
  { id: 'pt', label: 'Portuguesa', emoji: '🐟' },
  { id: 'kr', label: 'Coreana', emoji: '🥢' },
  { id: 'vn', label: 'Vietnamita', emoji: '🍲' },
  { id: 'es', label: 'Espanhola / Tapas', emoji: '🥘' },
  { id: 'pe', label: 'Peruana', emoji: '🌶️' },
  { id: 'med', label: 'Mediterrânea', emoji: '🫒' },
  { id: 'fondue', label: 'Fondue', emoji: '🫕' },
  { id: 'de', label: 'Alemã', emoji: '🥨' },
];

export const DRINKS = [
  { id: 'wine', label: 'Vinho', emoji: '🍷' },
  { id: 'cocktail', label: 'Coquetéis', emoji: '🍸' },
  { id: 'caipirinha', label: 'Caipirinha', emoji: '🍹' },
  { id: 'beer', label: 'Cerveja Artesanal', emoji: '🍺' },
  { id: 'sparkling', label: 'Espumante', emoji: '🥂' },
  { id: 'coffee', label: 'Café', emoji: '☕' },
  { id: 'tea', label: 'Chá', emoji: '🍵' },
  { id: 'juice', label: 'Suco Natural', emoji: '🍊' },
  { id: 'whisky', label: 'Uísque', emoji: '🥃' },
  { id: 'gin', label: 'Gin Tônica', emoji: '🍋' },
  { id: 'kombucha', label: 'Kombucha', emoji: '🍶' },
  { id: 'milkshake', label: 'Milkshake', emoji: '🥤' },
  { id: 'soda', label: 'Refrigerante', emoji: '🧃' },
  { id: 'none', label: 'Sem Álcool', emoji: '🚫' },
];

export const ACTIVITIES = [
  { id: 'park', label: 'Caminhar no parque', emoji: '🌳' },
  { id: 'bowling', label: 'Jogar boliche', emoji: '🎳' },
  { id: 'museum', label: 'Ir a um museu', emoji: '🖼️' },
  { id: 'boardgames', label: 'Board games', emoji: '🎲' },
  { id: 'cook', label: 'Cozinhar juntos', emoji: '🍳' },
  { id: 'live', label: 'Show / música ao vivo', emoji: '🎶' },
  { id: 'beach', label: 'Praia / pôr do sol', emoji: '🏖️' },
  { id: 'karaoke', label: 'Karaokê', emoji: '🎤' },
];
