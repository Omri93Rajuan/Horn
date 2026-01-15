import { Prisma } from "@prisma/client";

export function mapPrismaError(err: unknown, fallbackMessage: string, fallbackStatus = 500) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const error: any = new Error("Duplicate entry");
      error.status = 400;
      return error;
    }
    if (err.code === "P2025") {
      const error: any = new Error("Record not found");
      error.status = 404;
      return error;
    }
  }

  if (err instanceof Error && (err as any).status) {
    return err;
  }

  const error: any = new Error(fallbackMessage);
  error.status = fallbackStatus;
  return error;
}
