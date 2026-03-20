import { type MigrateUpArgs, type MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_content_status" AS ENUM('draft', 'in_review', 'published');
  CREATE TYPE "public"."enum_posts_content_status" AS ENUM('draft', 'in_review', 'published');
  ALTER TABLE "pages" ADD COLUMN "content_status" "enum_pages_content_status" DEFAULT 'draft' NOT NULL;
  ALTER TABLE "pages" ADD COLUMN "published_at" timestamp(3) with time zone;
  ALTER TABLE "posts" ADD COLUMN "content_status" "enum_posts_content_status" DEFAULT 'draft' NOT NULL;
  UPDATE "pages"
  SET
  	"content_status" = 'published',
  	"published_at" = COALESCE("created_at", "updated_at", now());
  
  UPDATE "posts"
  SET
  	"content_status" = 'published',
  	"published_at" = COALESCE("published_at", "created_at", "updated_at", now());
  CREATE INDEX "pages_content_status_idx" ON "pages" USING btree ("content_status");
  CREATE INDEX "pages_published_at_idx" ON "pages" USING btree ("published_at");
  CREATE INDEX "posts_content_status_idx" ON "posts" USING btree ("content_status");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "pages_content_status_idx";
  DROP INDEX "pages_published_at_idx";
  DROP INDEX "posts_content_status_idx";
  ALTER TABLE "pages" DROP COLUMN "content_status";
  ALTER TABLE "pages" DROP COLUMN "published_at";
  ALTER TABLE "posts" DROP COLUMN "content_status";
  DROP TYPE "public"."enum_pages_content_status";
  DROP TYPE "public"."enum_posts_content_status";`)
}
