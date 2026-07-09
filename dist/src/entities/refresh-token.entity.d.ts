import { OptionalProps } from '@mikro-orm/core';
import { User } from './user.entity';
export declare class RefreshToken {
    [OptionalProps]?: 'id' | 'revokedAt' | 'createdAt';
    id: string;
    user: User;
    tokenHash: string;
    expiresAt: Date;
    revokedAt?: Date;
    createdAt: Date;
}
