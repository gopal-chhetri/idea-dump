import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface ResponseEnvelope<T> {
    data: T;
    statusCode: number;
    timestamp: string;
}
export declare class ResponseInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T>> {
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ResponseEnvelope<T>>;
}
