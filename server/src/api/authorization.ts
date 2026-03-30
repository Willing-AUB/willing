import { type RequestHandler } from 'express';
import * as jose from 'jose';

import config from '../config.ts';
import database from '../db/index.ts';
import { type UserJWT } from '../types.ts';

export const authorizeOnly = (...roles: ('admin' | 'organization' | 'volunteer')[]) => {
  return ((req, res, next) => {
    if (!req.userJWT || !roles.includes(req.userJWT.role)) {
      res.status(403);
      next(new Error ('Unauthorized'));
    } else {
      next();
    }
  }) as RequestHandler;
};

export const setUserJWT = (async (req, _res, next) => {
  if (!req.headers.authorization) {
    next();
    return;
  };

  const token = req.headers.authorization!.split(' ')[1];
  if (!token) {
    next();
    return;
  }

  try {
    const { payload } = await jose.jwtVerify<UserJWT>(token, new TextEncoder().encode(config.JWT_SECRET));

    const accountTable = {
      admin: 'admin_account',
      organization: 'organization_account',
      volunteer: 'volunteer_account',
    }[payload.role] as 'admin_account' | 'organization_account' | 'volunteer_account';

    const row = await database
      .selectFrom(accountTable)
      .select('token_version')
      .where('id', '=', payload.id)
      .executeTakeFirst();

    if (row && row.token_version === payload.token_version) {
      req.userJWT = payload;
    }
  } catch {
    // If parsing the jwt failed, consider the user not logged in
    // Notify client so it can clear invalid stored token.
    _res.setHeader('x-jwt-status', 'invalid');
  }

  next();
}) as RequestHandler;
