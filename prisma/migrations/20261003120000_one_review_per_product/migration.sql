-- Возвращаем «один отзыв на товар от одного человека».
-- Обратная к 20260818135628_allow_many_reviews: тогда правило сняли, но
-- рейтинг считается простым средним, и один покупатель с 19 отзывами
-- единолично определял оценку товара.
--
-- IF EXISTS / IF NOT EXISTS намеренно: первая попытка этой миграции упала на
-- дублях уже ПОСЛЕ удаления старого индекса, и повтор спотыкался о его
-- отсутствие. Миграция должна переживать повторный запуск.

-- DropIndex
DROP INDEX IF EXISTS "Review_productId_userId_idx";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Review_productId_userId_key" ON "Review"("productId", "userId");
