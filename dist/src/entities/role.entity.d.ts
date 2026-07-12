import { Collection, OptionalProps } from '@mikro-orm/core';
import { User } from './user.entity';
export declare class Role {
    [OptionalProps]?: 'id' | 'name' | 'isDefault' | 'createdAt' | 'users';
    id: string;
    value: string;
    name?: string;
    isDefault: boolean;
    createdAt: Date;
    users: Collection<User, object>;
}
