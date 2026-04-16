-- Add unique constraint on (title, publication) to prevent duplicate seeding
ALTER TABLE literary_publications
  ADD CONSTRAINT literary_publications_title_publication_unique
  UNIQUE (title, publication);
