-- Fase 2: Cursos, Eventos, Agenda, Desafios

-- CourseModule
CREATE TABLE IF NOT EXISTS "course_modules" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "position"  INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "course_modules_productId_idx" ON "course_modules"("productId");

ALTER TABLE "course_modules"
  ADD CONSTRAINT "course_modules_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "marketplace_products"("id") ON DELETE CASCADE;

-- CourseLesson
CREATE TABLE IF NOT EXISTS "course_lessons" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "moduleId"  TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "videoUrl"  TEXT,
  "duration"  INTEGER,
  "position"  INTEGER NOT NULL DEFAULT 0,
  "isPreview" BOOLEAN NOT NULL DEFAULT false,
  "content"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "course_lessons_moduleId_idx" ON "course_lessons"("moduleId");

ALTER TABLE "course_lessons"
  ADD CONSTRAINT "course_lessons_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "course_modules"("id") ON DELETE CASCADE;

-- CourseLessonProgress
CREATE TABLE IF NOT EXISTS "course_lesson_progress" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "lessonId"    TEXT NOT NULL,
  "athleteId"   TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("lessonId", "athleteId")
);

ALTER TABLE "course_lesson_progress"
  ADD CONSTRAINT "course_lesson_progress_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "course_lessons"("id") ON DELETE CASCADE;

ALTER TABLE "course_lesson_progress"
  ADD CONSTRAINT "course_lesson_progress_athleteId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "athletes"("id");

-- EventRegistration
CREATE TABLE IF NOT EXISTS "event_registrations" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "productId"    TEXT NOT NULL,
  "athleteId"    TEXT NOT NULL,
  "orderId"      TEXT,
  "status"       TEXT NOT NULL DEFAULT 'CONFIRMED',
  "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("productId", "athleteId")
);

CREATE INDEX IF NOT EXISTS "event_registrations_productId_idx" ON "event_registrations"("productId");

ALTER TABLE "event_registrations"
  ADD CONSTRAINT "event_registrations_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "marketplace_products"("id");

ALTER TABLE "event_registrations"
  ADD CONSTRAINT "event_registrations_athleteId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "athletes"("id");

-- CoachAvailability
CREATE TABLE IF NOT EXISTS "coach_availability" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "coachId"     TEXT NOT NULL,
  "dayOfWeek"   INTEGER NOT NULL,
  "startTime"   TEXT NOT NULL,
  "endTime"     TEXT NOT NULL,
  "slotMinutes" INTEGER NOT NULL DEFAULT 60,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "coach_availability_coachId_idx" ON "coach_availability"("coachId");

ALTER TABLE "coach_availability"
  ADD CONSTRAINT "coach_availability_coachId_fkey"
  FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE CASCADE;

-- Appointment
CREATE TABLE IF NOT EXISTS "appointments" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "coachId"      TEXT NOT NULL,
  "athleteId"    TEXT NOT NULL,
  "productId"    TEXT,
  "scheduledAt"  TIMESTAMP(3) NOT NULL,
  "durationMin"  INTEGER NOT NULL DEFAULT 60,
  "status"       TEXT NOT NULL DEFAULT 'PENDING',
  "notes"        TEXT,
  "meetUrl"      TEXT,
  "athleteNotes" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "appointments_coachId_idx" ON "appointments"("coachId");
CREATE INDEX IF NOT EXISTS "appointments_athleteId_idx" ON "appointments"("athleteId");

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_coachId_fkey"
  FOREIGN KEY ("coachId") REFERENCES "coaches"("id");

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_athleteId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "athletes"("id");

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "marketplace_products"("id");

-- Challenge
CREATE TABLE IF NOT EXISTS "challenges" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "coachId"     TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type"        TEXT NOT NULL DEFAULT 'DISTANCIA',
  "targetValue" DOUBLE PRECISION,
  "targetUnit"  TEXT,
  "sport"       TEXT NOT NULL DEFAULT 'CORRIDA',
  "startDate"   TIMESTAMP(3) NOT NULL,
  "endDate"     TIMESTAMP(3) NOT NULL,
  "isPublic"    BOOLEAN NOT NULL DEFAULT false,
  "bannerUrl"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "challenges_coachId_idx" ON "challenges"("coachId");

ALTER TABLE "challenges"
  ADD CONSTRAINT "challenges_coachId_fkey"
  FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE CASCADE;

-- ChallengeParticipant
CREATE TABLE IF NOT EXISTS "challenge_participants" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "challengeId" TEXT NOT NULL,
  "athleteId"   TEXT NOT NULL,
  "progress"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "joinedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("challengeId", "athleteId")
);

CREATE INDEX IF NOT EXISTS "challenge_participants_challengeId_idx" ON "challenge_participants"("challengeId");

ALTER TABLE "challenge_participants"
  ADD CONSTRAINT "challenge_participants_challengeId_fkey"
  FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE;

ALTER TABLE "challenge_participants"
  ADD CONSTRAINT "challenge_participants_athleteId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "athletes"("id");
