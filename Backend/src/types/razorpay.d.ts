declare module 'razorpay' {
  interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  interface OrderOptions {
    amount: number;
    currency: string;
    receipt: string;
    notes?: { [key: string]: string };
  }

  interface OrderResponse {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
    notes: { [key: string]: string };
  }

  interface PaymentResponse {
    id: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    order_id: string;
  }

  interface RefundOptions {
    amount?: number;
    notes?: { [key: string]: string };
  }

  interface RefundResponse {
    id: string;
    payment_id: string;
    amount: number;
    status: string;
  }

  class Razorpay {
    constructor(options: RazorpayOptions);
    orders: {
      create(params: OrderOptions): Promise<OrderResponse>;
      fetch(orderId: string): Promise<OrderResponse>;
    };
    payments: {
      fetch(paymentId: string): Promise<PaymentResponse>;
      refund(paymentId: string, options?: RefundOptions): Promise<RefundResponse>;
    };
  }

  export default Razorpay;
}