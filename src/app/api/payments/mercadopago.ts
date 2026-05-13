import { MercadoPagoConfig, Preference } from 'mercadopago';

// Cliente oficial inicializado con tu Access Token de Vercel
export const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 } 
});
