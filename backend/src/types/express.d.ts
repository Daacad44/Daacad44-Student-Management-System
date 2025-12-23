import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface AuthUser {
    id: number;
    email: string;
    roles: string[];
  }

  interface Request {
    user?: AuthUser;
  }
}
