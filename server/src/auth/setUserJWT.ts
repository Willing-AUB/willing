import { verifyJWT } from '../services/jwt/index.ts';

import type { Database } from '../db/tables/index.ts';
import type { RequestHandler } from 'express';
import type { Kysely } from 'kysely';

const setUserJWT = (database: Kysely<Database>): RequestHandler => {
  return (async (req, _res, next) => {
    if (!req.headers.authorization) {
      next();
      return;
    }

    const token = req.headers.authorization!.split(' ')[1];
    if (!token) {
      next();
      return;
    }

    try {
      const payload = await verifyJWT(token);

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
      } else {
        _res.setHeader('x-jwt-status', 'invalid');
      }
    } catch {
      // If parsing the jwt failed, consider the user not logged in
      _res.setHeader('x-jwt-status', 'invalid');
    }

    next();
  }) as RequestHandler;
};

export default setUserJWT;
