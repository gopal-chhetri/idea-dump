import { Collection, OptionalProps } from '@mikro-orm/core';
import { OAuthAccount } from './oauth-account.entity';
import { RefreshToken } from './refresh-token.entity';
import { CvProfile } from './cv-profile.entity';
import { Idea } from './idea.entity';
import { Role } from './role.entity';
export declare class User {
    [OptionalProps]?: 'id' | 'createdAt' | 'passwordHash' | 'oauthAccounts' | 'refreshTokens' | 'cvProfile' | 'ideas';
    id: string;
    email: string;
    passwordHash?: string;
    role: Role;
    createdAt: Date;
    oauthAccounts: Collection<OAuthAccount, object>;
    refreshTokens: Collection<RefreshToken, object>;
    cvProfile?: CvProfile;
    ideas: Collection<Idea, object>;
}
