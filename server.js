const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json());

// ===== Утилиты для работы с JSON =====
function readJSON(file) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]');
}

function writeJSON(file, data) {
  const filePath = path.join(DATA_DIR, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ===== Middleware: проверка API-ключа =====
function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Неверный или отсутствующий API-ключ' });
  }
  next();
}

// Применяем проверку ко всем /api-роутам
app.use('/api', requireApiKey);

// ===== Категории =====
app.get('/api/categories', (req, res) => {
  res.json(readJSON('categories.json'));
});

app.get('/api/categories/:id', (req, res) => {
  const id = Number(req.params.id);
  const category = readJSON('categories.json').find(c => c.id === id);
  if (!category) return res.status(404).json({ error: 'Категория не найдена' });
  res.json(category);
});

// ===== Товары =====
app.get('/api/products', (req, res) => {
  let products = readJSON('products.json');
  const { categoryId, search } = req.query;

  if (categoryId) {
    products = products.filter(p => p.categoryId === Number(categoryId));
  }
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q));
  }

  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = readJSON('products.json').find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'Товар не найден' });

  // Добавляем информацию о категории (связь)
  const category = readJSON('categories.json').find(c => c.id === product.categoryId);
  res.json({ ...product, category: category || null });
});

// ===== Корневой роут (проверка работы) =====
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Shop API работает' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Shop API запущен на порту ${PORT}`);
});