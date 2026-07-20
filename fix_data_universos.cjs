const fs = require('fs');
let code = fs.readFileSync('src/data.ts', 'utf8');

const newUniversos = `export const OBRAS_INICIAIS: Obra[] = [
  {
    id: 'marvel',
    titulo: 'Universo Marvel',
    tipo: 'filme',
    ano: 2024,
    generos: ['Ação', 'Heróis'],
    sinopse: 'Todos os reacts relacionados ao universo Marvel.',
    banner: 'https://images.unsplash.com/photo-1612036782180-6f0b6ce846ce?q=80&w=1600&auto=format&fit=crop',
    poster: 'https://images.unsplash.com/photo-1612036782180-6f0b6ce846ce?q=80&w=600&auto=format&fit=crop',
    trailerUrl: ''
  },
  {
    id: 'harry-potter',
    titulo: 'Harry Potter',
    tipo: 'filme',
    ano: 2024,
    generos: ['Fantasia', 'Magia'],
    sinopse: 'Reacts do universo de Harry Potter.',
    banner: 'https://images.unsplash.com/photo-1618944913480-b67ee16d7b77?q=80&w=1600&auto=format&fit=crop',
    poster: 'https://images.unsplash.com/photo-1618944913480-b67ee16d7b77?q=80&w=600&auto=format&fit=crop',
    trailerUrl: ''
  },
  {
    id: 'gta',
    titulo: 'GTA',
    tipo: 'jogo',
    ano: 2024,
    generos: ['Ação', 'Mundo Aberto'],
    sinopse: 'Reacts da franquia Grand Theft Auto.',
    banner: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=1600&auto=format&fit=crop',
    poster: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=600&auto=format&fit=crop',
    trailerUrl: ''
  },
  {
    id: 'one-piece',
    titulo: 'One Piece',
    tipo: 'anime',
    ano: 2024,
    generos: ['Aventura', 'Ação'],
    sinopse: 'Reacts do anime One Piece.',
    banner: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1600&auto=format&fit=crop',
    poster: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=600&auto=format&fit=crop',
    trailerUrl: ''
  },
  {
    id: 'the-last-of-us',
    titulo: 'The Last of Us',
    tipo: 'jogo',
    ano: 2024,
    generos: ['Ação', 'Terror'],
    sinopse: 'Reacts de The Last of Us.',
    banner: 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1600&auto=format&fit=crop',
    poster: 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=600&auto=format&fit=crop',
    trailerUrl: ''
  },`;

code = code.replace(/export const OBRAS_INICIAIS: Obra\[\] = \[/, newUniversos);
fs.writeFileSync('src/data.ts', code);
