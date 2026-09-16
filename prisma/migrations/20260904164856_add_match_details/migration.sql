-- AlterTable
ALTER TABLE "JobAnalysis" ADD COLUMN     "matchedRequirements" JSONB,
ADD COLUMN     "matchedSkills" JSONB,
ADD COLUMN     "missingRequirements" JSONB,
ADD COLUMN     "missingSkills" JSONB,
ADD COLUMN     "partialMatches" JSONB,
ADD COLUMN     "recommendation" TEXT,
ADD COLUMN     "recommendations" JSONB,
ADD COLUMN     "strengths" JSONB;
