import { NextFunction, Request, Response } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { handleError } from "../utils/ErrorHandle";

type SchemaShape = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export function validate(schema: SchemaShape) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return handleError(res, 400, "Validation error", { issues: err.errors });
      }
      return handleError(res, 400, "Validation error");
    }
  };
}
