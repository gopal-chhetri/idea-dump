import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';
import { OAuthProvider } from '../entities';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly em;
    constructor(usersService: UsersService, jwtService: JwtService, em: EntityManager);
    register(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    }>;
    validateLocalUser(email: string, password: string): Promise<User>;
    login(user: User): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    }>;
    validateOAuthUser(provider: OAuthProvider, providerAccountId: string, email: string): Promise<User | null>;
    refresh(rawRefreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    }>;
    private issueTokens;
    private hashToken;
    private revokeAllUserTokens;
}
