/// <reference types="next" />

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_SOCKET_URL: string;
    NEXT_PUBLIC_LISTING_SERVICE_URL?: string;
    NEXT_PUBLIC_ORDERS_SERVICE_URL?: string;
    NEXT_PUBLIC_ADMIN_SERVICE_URL?: string;
    NEXT_PUBLIC_XYOPS_URL?: string;
  }
}
