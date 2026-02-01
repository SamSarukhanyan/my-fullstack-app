import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const PORT = Number(process.env.PORT) || 4004;

// API-маршруты подключаются до статики
// app.use('/api', apiRouter);

// Опционально: раздача статики из client/dist (если не отдаётся через Nginx)
const clientDist = path.resolve(__dirname, '../client/dist');
// app.use(express.static(clientDist));

// SPA fallback: для клиентского роутинга отдаём index.html на неизвестные пути
app.get('/', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});


app.get("/api/get", async (req,res)=>{
  res.send({success: true,message:"Server is running Sam jan"})
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});



app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

