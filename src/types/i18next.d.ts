import 'i18next';
import 'express';

declare module 'express' {
  interface Request {
    t: i18next.TFunction;
  }
} 