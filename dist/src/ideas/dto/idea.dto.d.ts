export declare class CreateIdeaDto {
    title: string;
    description: string;
    features?: string[];
    useCase: string;
}
export declare class UpdateIdeaDto {
    title?: string;
    description?: string;
    features?: string[];
    useCase?: string;
    status?: string;
}
