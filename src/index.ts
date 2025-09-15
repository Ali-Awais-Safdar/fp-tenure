import express from 'express';
import router from './routes/reportRoutes';

const app = express();
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    `Tenure report endpoint: http://localhost:${PORT}/reports/tenure`
  );
});
