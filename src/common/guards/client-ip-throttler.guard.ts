import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Throttles per real client. Behind Cloudflare + Traefik `req.ip` is the
 * proxy's address, which would put every visitor in one shared bucket, so
 * prefer Cloudflare's CF-Connecting-IP header when present.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const headers = req.headers as Record<string, string | undefined>;
    return Promise.resolve(headers['cf-connecting-ip'] || (req.ip as string));
  }
}
