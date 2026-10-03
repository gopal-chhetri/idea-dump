import {
  BadRequestException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import { HttpExceptionFilter } from './http-exception.filter';

class Dto {
  @IsString()
  title!: string;
}

describe('HttpExceptionFilter.messageOf', () => {
  it('surfaces ValidationPipe field errors', async () => {
    const pipe = new ValidationPipe();
    const err: unknown = await pipe
      .transform({}, { type: 'body', metatype: Dto })
      .catch((e: BadRequestException) => e);
    expect(HttpExceptionFilter.messageOf(err as BadRequestException)).toBe(
      'title must be a string',
    );
  });

  it('keeps plain exception messages', () => {
    expect(
      HttpExceptionFilter.messageOf(new NotFoundException('Idea not found')),
    ).toBe('Idea not found');
  });
});
