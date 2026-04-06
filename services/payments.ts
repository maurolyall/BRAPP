// MercadoPago integration — ready to implement
// Install: npm install mercadopago

interface CreatePreferenceParams {
  title: string
  price: number
  quantity: number
  buyerEmail: string
  externalReference: string
}

interface PreferenceResponse {
  id: string
  initPoint: string
  sandboxInitPoint: string
}

// TODO: initialize MercadoPago SDK with access token from env
// import MercadoPagoConfig, { Preference } from 'mercadopago'
// const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

export async function createPaymentPreference(
  _params: CreatePreferenceParams
): Promise<PreferenceResponse> {
  // TODO: implement preference creation
  throw new Error('MercadoPago not configured. Set MP_ACCESS_TOKEN in .env.local')
}

export async function handleWebhook(body: unknown): Promise<void> {
  // TODO: handle payment notifications from MercadoPago
  console.log('MercadoPago webhook received:', body)
}
