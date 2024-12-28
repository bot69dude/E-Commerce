import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './lib/database'; // Assuming you have a file for database connection
import authRoute from './routes/authRoute'; // Assuming you have an auth route
import productRoute from './routes/productRoute';
import cartRoute from './routes/cartRoute'; // Assuming you have a cart route
import couponRoute from './routes/couponRoute';
import paymentRoute from './routes/paymentRoute';
import anayticalRoute from './routes/analyticalRoute';
import cors from 'cors';

dotenv.config();
const app = express();

app.use(cookieParser());
const PORT = process.env.PORT || 5000;


app.use(cors());

app.use(express.json());
app.use('/api/auth', authRoute);
app.use('/api/products', productRoute);
app.use('/api/cart', cartRoute);
app.use('/api/coupon', couponRoute);
app.use('/api/payment', paymentRoute);
app.use('/api/analytics', anayticalRoute);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to the database:', error);
  });
