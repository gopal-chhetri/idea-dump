/**
 * MikroORM 7 and uuid 14 ship ESM only, which Jest's CommonJS runtime can't
 * load. Unit specs never touch a real database, so stand in for the few
 * runtime values the services and entities import: decorators become no-ops
 * and EntityManager is only a DI token / type here.
 */
import { randomUUID } from 'node:crypto';

const noopDecorator = () => () => undefined;

jest.mock(
  '@mikro-orm/decorators/legacy',
  () => new Proxy({}, { get: () => noopDecorator }),
);
jest.mock('@mikro-orm/core', () => ({
  Collection: class {
    getItems() {
      return [];
    }
  },
  OptionalProps: Symbol('OptionalProps'),
}));
jest.mock('@mikro-orm/postgresql', () => ({ EntityManager: class {} }));
jest.mock('uuid', () => ({ v4: () => randomUUID() }));
