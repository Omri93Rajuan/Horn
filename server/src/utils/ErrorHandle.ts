export function handleError(res: any, status: number, message: string, extra?: Record<string, unknown>) {
  const error = { message, status, ...(extra || {}) };
  return res.status(status).json({ success: false, error });
}
