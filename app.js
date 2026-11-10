const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Atlas Bağlantısı
const url = 'mongodb+srv://kizkabannn7_db_user:s7LNGsFR2mz8jLPg@cluster0.u7m77pw.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(url);
const dbName = 'okulOdeviDB';
const collectionName = 'kayitlar';

let koleksiyon;

async function dbBaglan() {
  try {
    await client.connect();
    console.log('MongoDB Atlas veritabanina basariyla baglanildi!');
    const db = client.db(dbName);
    koleksiyon = db.collection(collectionName);
  } catch (err) {
    console.error('Baglanti hatasi:', err);
  }
}
dbBaglan();

// 1. LİSTELEME
app.get('/api/kayitlar', async (req, res) => {
  try {
    const veriler = await koleksiyon.find({}).toArray();
    res.json(veriler);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
});

// 2. EKLEME
app.post('/api/kayitlar', async (req, res) => {
  try {
    const yeniVeri = {
      baslik: req.body.baslik,
      aciklama: req.body.aciklama,
      fiyat: Number(req.body.fiyat),
      tarih: new Date()
    };
    const sonuc = await koleksiyon.insertOne(yeniVeri);
    res.status(201).json(sonuc);
  } catch (err) {
    res.status(400).json({ hata: err.message });
  }
});

// 3. GÜNCELLEME
app.put('/api/kayitlar/:id', async (req, res) => {
  try {
    const sorgu = { _id: new ObjectId(req.params.id) };
    const yeniDegerler = {
      $set: {
        baslik: req.body.baslik,
        aciklama: req.body.aciklama,
        fiyat: Number(req.body.fiyat)
      }
    };
    const sonuc = await koleksiyon.updateOne(sorgu, yeniDegerler);
    res.json(sonuc);
  } catch (err) {
    res.status(400).json({ hata: err.message });
  }
});

// 4. SİLME
app.delete('/api/kayitlar/:id', async (req, res) => {
  try {
    const sorgu = { _id: new ObjectId(req.params.id) };
    const sonuc = await koleksiyon.deleteOne(sorgu);
    res.json({ mesaj: 'Kayit basariyla silindi', sonuc });
  } catch (err) {
    res.status(400).json({ hata: err.message });
  }
});

// 5. TEST ARAYÜZÜ (HTML) - TEK DOSYA İÇİNDE
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>NodeJS - MongoDB CRUD</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 30px auto; padding: 0 15px; }
        input, button { padding: 8px; margin: 5px 0; width: 100%; box-sizing: border-box; }
        .item { border: 1px solid #ccc; padding: 10px; margin-top: 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
        .btns button { width: auto; margin-left: 5px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h2>MongoDB Native Driver (Ekle - Sil - Guncelle)</h2>
      <input type="text" id="baslik" placeholder="Baslik" />
      <input type="text" id="aciklama" placeholder="Aciklama" />
      <input type="number" id="fiyat" placeholder="Fiyat" />
      <button onclick="ekle()">Ekle (insertOne)</button>
      <hr/>
      <div id="liste"></div>

      <script>
        async function listele() {
          const res = await fetch('/api/kayitlar');
          const veriler = await res.json();
          const div = document.getElementById('liste');
          div.innerHTML = veriler.map(k => \`
            <div class="item">
              <div>
                <strong>\${k.baslik}</strong> - \${k.fiyat} TL<br/>
                <small>\${k.aciklama}</small>
              </div>
              <div class="btns">
                <button onclick="guncelle('\${k._id}', '\${k.baslik}', '\${k.aciklama}', \${k.fiyat})">Guncelle</button>
                <button onclick="sil('\${k._id}')">Sil</button>
              </div>
            </div>
          \`).join('');
        }

        async function ekle() {
          const baslik = document.getElementById('baslik').value;
          const aciklama = document.getElementById('aciklama').value;
          const fiyat = document.getElementById('fiyat').value;
          if (!baslik || !aciklama || !fiyat) return alert('Alanlari doldurun!');
          
          await fetch('/api/kayitlar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ baslik, aciklama, fiyat })
          });
          
          document.getElementById('baslik').value = '';
          document.getElementById('aciklama').value = '';
          document.getElementById('fiyat').value = '';
          listele();
        }

        async function sil(id) {
          await fetch('/api/kayitlar/' + id, { method: 'DELETE' });
          listele();
        }

        async function guncelle(id, eskiBaslik, eskiAciklama, eskiFiyat) {
          const baslik = prompt('Yeni Baslik:', eskiBaslik);
          const aciklama = prompt('Yeni Aciklama:', eskiAciklama);
          const fiyat = prompt('Yeni Fiyat:', eskiFiyat);
          if (baslik && aciklama && fiyat) {
            await fetch('/api/kayitlar/' + id, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ baslik, aciklama, fiyat: Number(fiyat) })
            });
            listele();
          }
        }

        listele();
      </script>
    </body>
    </html>
  `);
});

// Sunucuyu Başlat
app.listen(3000, () => {
  console.log('Sunucu http://localhost:3000 adresinde calisiyor.');
});