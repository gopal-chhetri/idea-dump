import { OptionalProps } from '@mikro-orm/core';
export declare class SystemSetting {
    [OptionalProps]?: 'id' | 'createdAt' | 'updatedAt';
    id: string;
    key: string;
    value: string;
    createdAt: Date;
    updatedAt: Date;
}
