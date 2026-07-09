import { Strategy, Profile } from 'passport-github2';
import { AuthService } from '../auth.service';
type DoneCallback = (err: Error | null, user?: Express.User) => void;
declare const GithubStrategy_base: new (...args: [options: import("passport-github2").StrategyOptionsWithRequest] | [options: import("passport-github2").StrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class GithubStrategy extends GithubStrategy_base {
    private readonly authService;
    constructor(authService: AuthService);
    validate(_accessToken: string, _refreshToken: string, profile: Profile, done: DoneCallback): Promise<void>;
}
export {};
