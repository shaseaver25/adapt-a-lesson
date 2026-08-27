-- Data-bearing diagrams need a visible long description in addition to alt text
-- (WCAG 2.1 SC 1.1.1): alt alone cannot carry the content of a chart or process
-- diagram. Generated alongside the image and rendered as the figure caption.
alter table public.lesson_images
  add column if not exists long_description text;

comment on column public.lesson_images.long_description is
  'Visible long description shown near the image for data-bearing diagrams. Null for simple illustrative images.';
