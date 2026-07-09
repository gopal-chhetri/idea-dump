import { OptionalProps } from '@mikro-orm/core';
import { User } from './user.entity';
import { OAuthProvider } from './enums';
export declare class OAuthAccount {
    [OptionalProps]?: 'id' | 'createdAt';
    id: string;
    user: User;
    provider: OAuthProvider;
    providerAccountId: string;
    createdAt: Date;
}
