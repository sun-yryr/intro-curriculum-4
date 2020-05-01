import { Request, Response, NextFunction } from "express";

export function ensure(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login?from=' + req.originalUrl);
}
