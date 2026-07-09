import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    }>;
    login(req: Request): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    }>;
    refresh(dto: RefreshDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    }>;
    googleLogin(): void;
    googleCallback(req: Request, res: Response): Promise<void>;
    githubLogin(): void;
    githubCallback(req: Request, res: Response): Promise<void>;
}
