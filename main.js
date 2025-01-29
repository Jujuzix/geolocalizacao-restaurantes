import { openDB } from 'idb';
import L from 'leaflet';

// Configuração do Banco de Dados
async function createDB() {
  return await openDB('restaurantesDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('restaurantes')) {
        db.createObjectStore('restaurantes', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

async function salvarRestaurante(nome, latitude, longitude) {
  const db = await createDB();
  const tx = db.transaction('restaurantes', 'readwrite');
  const store = tx.objectStore('restaurantes');
  await store.add({ nome, latitude, longitude });
  await tx.done;
}

async function listarRestaurantes() {
  const db = await createDB();
  return await db.getAll('restaurantes');
}

// Configuração do Mapa
document.addEventListener('DOMContentLoaded', () => {
  const mapElement = document.getElementById('map');
  if (!mapElement) {
    console.error('Elemento #map não encontrado na página.');
    return;
  }

  // Inicializa o mapa e o centraliza em coordenadas padrão
  const map = L.map('map').setView([-23.5505, -46.6333], 13); // Coordenadas padrão (São Paulo)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  // Redimensiona o mapa corretamente ao carregar
  setTimeout(() => {
    map.invalidateSize();
  }, 0);

  let selectedLatLng = null;

  // Evento ao clicar no mapa
  map.on('click', function (e) {
    selectedLatLng = e.latlng;
    document.getElementById('latitude').textContent = selectedLatLng.lat.toFixed(6);
    document.getElementById('longitude').textContent = selectedLatLng.lng.toFixed(6);
  });

  // Função para salvar restaurante
  async function salvarDados() {
    const nome = document.getElementById('nomeRestaurante').value;
    const latitude = parseFloat(document.getElementById('latitude').textContent);
    const longitude = parseFloat(document.getElementById('longitude').textContent);

    if (!nome || isNaN(latitude) || isNaN(longitude)) {
      alert('Por favor, selecione um local no mapa e insira o nome do restaurante.');
      return;
    }

    await salvarRestaurante(nome, latitude, longitude);
    alert('Restaurante salvo com sucesso!');
    listarEExibirRestaurantes();

    // Adiciona marcador no mapa
    L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(nome)
      .openPopup();
  }

  // Função para listar restaurantes
  async function listarEExibirRestaurantes() {
    const restaurantes = await listarRestaurantes();
    const lista = document.getElementById('listaRestaurantes');
    lista.innerHTML = '';

    restaurantes.forEach((restaurante) => {
      const item = document.createElement('li');
      item.textContent = `Nome: ${restaurante.nome}, Latitude: ${restaurante.latitude}, Longitude: ${restaurante.longitude}`;
      lista.appendChild(item);
    });
  }

  // Eventos na página
  document.getElementById('salvarRestaurante').addEventListener('click', salvarDados);
  listarEExibirRestaurantes();
});
