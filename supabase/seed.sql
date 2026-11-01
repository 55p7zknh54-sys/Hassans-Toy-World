-- =====================================================================
-- Hassan's Toys World sample data (generated from data/catalog.json by scripts/generate-seed-sql.mjs).
-- Run AFTER schema.sql. Prices are IQD DEMONSTRATION values — edit them in the admin dashboard.
-- Delivery fees are placeholders too: set your real courier prices under Admin → Delivery.
-- =====================================================================

-- Delivery fees (all 19 governorates; Halabja is the newest governorate — hide it in Admin → Delivery if you do not serve it)
insert into public.delivery_fees (code, name_en, name_ar, fee_iqd, sort_order) values
  ('baghdad', 'Baghdad', 'بغداد', 5000, 1),
  ('basra', 'Basra', 'البصرة', 6000, 2),
  ('nineveh', 'Nineveh', 'نينوى', 7000, 3),
  ('erbil', 'Erbil', 'أربيل', 7000, 4),
  ('sulaymaniyah', 'Sulaymaniyah', 'السليمانية', 7500, 5),
  ('duhok', 'Duhok', 'دهوك', 8000, 6),
  ('kirkuk', 'Kirkuk', 'كركوك', 6500, 7),
  ('anbar', 'Anbar', 'الأنبار', 7000, 8),
  ('najaf', 'Najaf', 'النجف', 6000, 9),
  ('karbala', 'Karbala', 'كربلاء', 6000, 10),
  ('babil', 'Babil', 'بابل', 5500, 11),
  ('wasit', 'Wasit', 'واسط', 6000, 12),
  ('diyala', 'Diyala', 'ديالى', 6000, 13),
  ('salah-al-din', 'Salah al-Din', 'صلاح الدين', 6500, 14),
  ('dhi-qar', 'Dhi Qar', 'ذي قار', 6500, 15),
  ('maysan', 'Maysan', 'ميسان', 7000, 16),
  ('muthanna', 'Muthanna', 'المثنى', 7000, 17),
  ('qadisiyyah', 'Qadisiyyah', 'القادسية', 6000, 18),
  ('halabja', 'Halabja', 'حلبجة', 8000, 19);

-- Categories
insert into public.categories (slug, name_en, name_ar, description_en, description_ar, image_url, color, sort_order) values
  ('squishies', 'Squishies', 'سكويشي', 'Soft, squeezy and impossible to put down.', 'ناعمة وطرية ومن الصعب تتركها من إيدك.', null, 'pink', 1),
  ('plushies', 'Plushies', 'دمى قطنية', 'Cuddly friends and cute keychains.', 'دمى ناعمة للحضن وميداليات لطيفة.', null, 'yellow', 2),
  ('collectibles', 'Collectibles', 'مقتنيات', 'Little figures to collect and display.', 'مجسّمات صغيرة للجمع والعرض.', null, 'purple', 3),
  ('fidget-toys', 'Fidget Toys', 'ألعاب الفيدجت', 'Click, pop, spin and squeeze.', 'اضغط، فرقع، لفّ واعصر.', null, 'blue', 4),
  ('mystery-boxes', 'Mystery Boxes', 'صناديق المفاجآت', 'Open it and find out. Every box is a surprise!', 'افتحه واكتشف. كل صندوق مفاجأة!', null, 'pink', 5);

-- Products
