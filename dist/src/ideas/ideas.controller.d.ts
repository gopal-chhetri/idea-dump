import type { Request } from 'express';
import { IdeasService } from './ideas.service';
import { ScoringService } from '../scoring/scoring.service';
import { RankingService } from '../ranking/ranking.service';
import { CreateIdeaDto, UpdateIdeaDto } from './dto/idea.dto';
import { UpdateRankDto } from '../ranking/dto/update-rank.dto';
export declare class IdeasController {
    private readonly ideasService;
    private readonly scoringService;
    private readonly rankingService;
    constructor(ideasService: IdeasService, scoringService: ScoringService, rankingService: RankingService);
    create(req: Request, dto: CreateIdeaDto): Promise<import("../entities").Idea>;
    findAll(req: Request): Promise<import("../entities").Idea[]>;
    findOne(req: Request, ideaId: string): Promise<import("../entities").Idea>;
    update(req: Request, ideaId: string, dto: UpdateIdeaDto): Promise<import("../entities").Idea>;
    remove(req: Request, ideaId: string): Promise<{
        deleted: boolean;
    }>;
    rescore(req: Request, ideaId: string): Promise<import("../entities").Idea>;
    updateRank(req: Request, ideaId: string, dto: UpdateRankDto): Promise<import("../entities").IdeaRankOverride>;
    clearRank(req: Request, ideaId: string): Promise<{
        cleared: boolean;
    }>;
}
