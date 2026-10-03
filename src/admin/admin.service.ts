import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EntityManager } from '@mikro-orm/postgresql';
import * as crypto from 'node:crypto';
import { User } from '../entities/user.entity';
import { Idea } from '../entities/idea.entity';
import { Role } from '../entities/role.entity';
import { SystemSetting } from '../entities/system-setting.entity';
import { ScoringService } from '../scoring/scoring.service';
import { encryptionKey } from '../config/secrets';
import { UserRole } from '../entities/enums';
import { CreateUserDto, UpdateUserDto } from './dto/admin.dto';

const SALT_ROUNDS = 12;

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
function deriveKey(raw: string): Buffer {
  return crypto.scryptSync(raw, 'idea-dump-salt', 32);
}

@Injectable()
export class AdminService {
  /** Derived once at startup, so a missing key fails boot, not first use. */
  private readonly cipherKey = deriveKey(encryptionKey());

  constructor(
    private readonly em: EntityManager,
    private readonly scoringService: ScoringService,
  ) {}

  async getStats() {
    const userCount = await this.em.count(User, {});
    const ideaCount = await this.em.count(Idea, {});
    const adminCount = await this.em.count(User, {
      role: { value: UserRole.ADMIN },
    });
    return { userCount, adminCount, ideaCount };
  }

  // ── Users ───────────────────────────────────────────────

  async listUsers(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [users, total] = await this.em.findAndCount(
      User,
      {},
      {
        populate: ['role'],
        orderBy: { createdAt: 'DESC' },
        limit,
        offset,
      },
    );
    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role.value,
        createdAt: u.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getUser(userId: string) {
    const user = await this.em.findOneOrFail(
      User,
      { id: userId },
      { populate: ['role'] },
    );
    return {
      id: user.id,
      email: user.email,
      role: user.role.value,
      createdAt: user.createdAt,
    };
  }

  async createUser(data: CreateUserDto) {
    const existing = await this.em.findOne(User, { email: data.email });
    if (existing) throw new ConflictException('Email already in use');
    const role = await this.findRole(data.role ?? UserRole.USER);
    const user = this.em.create(User, {
      email: data.email,
      passwordHash: data.password
        ? await bcrypt.hash(data.password, SALT_ROUNDS)
        : undefined,
      role,
    });
    this.em.persist(user);
    await this.em.flush();
    return this.toUserResponse(user);
  }

  async updateUser(actorId: string, userId: string, data: UpdateUserDto) {
    const user = await this.em.findOneOrFail(
      User,
      { id: userId },
      { populate: ['role'] },
    );
    if (data.email !== undefined && data.email !== user.email) {
      const taken = await this.em.findOne(User, { email: data.email });
      if (taken) throw new ConflictException('Email already in use');
      user.email = data.email;
    }
    if (
      data.role !== undefined &&
      data.role !== (user.role.value as UserRole)
    ) {
      if (data.role !== UserRole.ADMIN) {
        await this.assertNotLastAdminChange(actorId, user, 'demote');
      }
      user.role = await this.findRole(data.role);
    }
    await this.em.flush();
    return this.toUserResponse(user);
  }

  async deleteUser(actorId: string, userId: string) {
    const user = await this.em.findOneOrFail(
      User,
      { id: userId },
      { populate: ['role'] },
    );
    await this.assertNotLastAdminChange(actorId, user, 'delete');
    this.em.remove(user);
    await this.em.flush();
    return { deleted: true };
  }

  /**
   * Admins can't demote or delete themselves, and nobody can remove the last
   * admin; either would lock the platform out of its admin panel.
   */
  private async assertNotLastAdminChange(
    actorId: string,
    target: User,
    action: 'demote' | 'delete',
  ): Promise<void> {
    if (target.id === actorId) {
      throw new BadRequestException(`You cannot ${action} your own account`);
    }
    if ((target.role.value as UserRole) === UserRole.ADMIN) {
      const admins = await this.em.count(User, {
        role: { value: UserRole.ADMIN },
      });
      if (admins <= 1) {
        throw new BadRequestException(`Cannot ${action} the last admin`);
      }
    }
  }

  private async findRole(value: string): Promise<Role> {
    const role = await this.em.findOne(Role, { value });
    if (!role) throw new BadRequestException(`Unknown role: ${value}`);
    return role;
  }

  private toUserResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role.value,
      createdAt: user.createdAt,
    };
  }

  // ── Ideas ───────────────────────────────────────────────

  async listIdeas(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [ideas, total] = await this.em.findAndCount(
      Idea,
      {},
      {
        populate: ['scores', 'rankOverride', 'user', 'status'],
        orderBy: { createdAt: 'DESC' },
        limit,
        offset,
      },
    );
    return {
      ideas: ideas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        status: idea.status.value,
        user: idea.user ? { id: idea.user.id, email: idea.user.email } : null,
        scores:
          idea.scores && idea.scores.length
            ? idea.scores.map((s) => ({
                finalScore: s.finalScore,
                fitScore: s.fitScore,
                effortScore: s.effortScore,
                noveltyScore: s.noveltyScore,
                scoringMethod: s.scoringMethod,
              }))
            : [],
        createdAt: idea.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async deleteIdea(ideaId: string) {
    const idea = await this.em.findOneOrFail(Idea, { id: ideaId });
    this.em.remove(idea);
    await this.em.flush();
    return { deleted: true };
  }

  async rescoreIdea(ideaId: string) {
    const idea = await this.em.findOneOrFail(Idea, { id: ideaId });
    const userId = idea.user.id;
    return this.scoringService.scoreIdea(ideaId, userId);
  }

  async rescoreAll() {
    const ideas = await this.em.find(Idea, {}, { fields: ['id', 'user'] });
    for (const idea of ideas) {
      const userId = idea.user.id;
      await this.scoringService.scoreIdea(idea.id, userId);
    }
    return { rescored: ideas.length };
  }

  // ── Settings ────────────────────────────────────────────

  async listSettings() {
    const settings = await this.em.find(SystemSetting, {});
    return settings.map((s) => ({
      key: s.key,
      value: this.decrypt(s.value),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  async upsertSetting(key: string, value: string) {
    const encrypted = this.encrypt(value);
    let setting = await this.em.findOne(SystemSetting, { key });
    if (setting) {
      setting.value = encrypted;
      setting.updatedAt = new Date();
    } else {
      setting = this.em.create(SystemSetting, { key, value: encrypted });
      this.em.persist(setting);
    }
    await this.em.flush();
    return { key, updatedAt: setting.updatedAt };
  }

  // ── Encryption ──────────────────────────────────────────

  private encrypt(plaintext: string): string {
    const key = this.cipherKey;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decrypt(ciphertext: string): string {
    const key = this.cipherKey;
    const parts = ciphertext.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
