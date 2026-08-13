/**
 * Mercado Pago PIX helpers
 */

const MP_API = "https://api.mercadopago.com";

export const PRO_PRICE = 12.9;
export const PRO_MONTHS = 6;
export const PRO_DESCRIPTION = "Paga Juntos Pro — 6 meses";

export type PixPaymentResult = {
  id: number | string;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl?: string;
  expiresAt?: string;
};

function getAccessToken(): string | null {
  return process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || null;
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(getAccessToken());
}

export async function createPixPayment(params: {
  email: string;
  name: string;
  userId: string;
  externalReference?: string;
}): Promise<PixPaymentResult> {
  const token = getAccessToken();

  if (!token) {
    const mockId = `mock_${Date.now()}`;
    return {
      id: mockId,
      status: "pending",
      qrCode:
        "00020126580014br.gov.bcb.pix0136pagajuntos-mock-pix-dev520400005303986540512.905802BR5912Paga Juntos6009SAO PAULO62070503***6304ABCD",
      qrCodeBase64: "",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  const idempotencyKey = `pix-${params.userId}-${Date.now()}`;

  const body = {
    transaction_amount: PRO_PRICE,
    description: PRO_DESCRIPTION,
    payment_method_id: "pix",
    external_reference: params.externalReference || params.userId,
    payer: {
      email: params.email,
      first_name: params.name.split(" ")[0] || params.name,
      last_name: params.name.split(" ").slice(1).join(" ") || "Cliente",
    },
  };

  const res = await fetch(`${MP_API}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("[MP] create payment error", data);
    throw new Error(data.message || data.error || "Erro ao criar pagamento PIX");
  }

  const tx = data.point_of_interaction?.transaction_data || {};

  return {
    id: data.id,
    status: data.status,
    qrCode: tx.qr_code || "",
    qrCodeBase64: tx.qr_code_base64 || "",
    ticketUrl: tx.ticket_url,
    expiresAt: data.date_of_expiration || undefined,
  };
}

export async function getPaymentStatus(paymentId: string | number): Promise<{
  id: string | number;
  status: string;
  statusDetail?: string;
  externalReference?: string;
}> {
  const token = getAccessToken();

  if (!token) {
    return {
      id: paymentId,
      status: "pending",
      externalReference: undefined,
    };
  }

  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Erro ao consultar pagamento");
  }

  return {
    id: data.id,
    status: data.status,
    statusDetail: data.status_detail,
    externalReference: data.external_reference,
  };
}
