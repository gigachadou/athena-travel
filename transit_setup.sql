-- Reyslar uchun jadval yaratish
CREATE TABLE IF NOT EXISTS transit_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- 'surkhandarya', 'uzbekistan', 'international'
  type TEXT NOT NULL, -- 'Poyezd', 'Parvoz', 'Afrosiyob' va h.k.
  number TEXT NOT NULL, -- Reys raqami
  route TEXT NOT NULL, -- Yo'nalish
  depart_time TEXT, -- Ketish vaqti
  arrive_time TEXT, -- Kelish vaqti
  platform TEXT, -- Platforma yoki Gate
  status TEXT DEFAULT 'On Time',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Surxondaryo reyslari
INSERT INTO transit_schedules (category, type, number, route, depart_time, arrive_time, platform, status) VALUES
('surkhandarya', 'Poyezd', '079F', 'Toshkent - Termiz', '19:40', '08:50', '2', 'On Time'),
('surkhandarya', 'Poyezd', '379F', 'Toshkent - Denov', '21:00', '10:15', '1', 'Boarding'),
('surkhandarya', 'Poyezd', '081F', 'Toshkent - Sariosiyo', '20:30', '09:20', '3', 'Scheduled'),
('surkhandarya', 'Parvoz', 'HY-065', 'Tashkent - Termiz', '09:30', '11:00', 'A12', 'Check-in'),
('surkhandarya', 'Parvoz', 'HY-067', 'Tashkent - Termiz', '18:10', '19:40', 'B05', 'On Time');

-- O'zbekiston reyslari
INSERT INTO transit_schedules (category, type, number, route, depart_time, arrive_time, platform, status) VALUES
('uzbekistan', 'Afrosiyob', '762F', 'Toshkent - Buxoro', '07:28', '11:19', '1', 'On Time'),
('uzbekistan', 'Afrosiyob', '760F', 'Toshkent - Samarqand', '08:00', '10:08', '2', 'Arrived'),
('uzbekistan', 'O''zbekiston', '060F', 'Toshkent - Andijon', '16:45', '22:30', '4', 'Delayed'),
('uzbekistan', 'Poyezd', '054F', 'Toshkent - Xiva', '21:00', '11:20', '2', 'Scheduled'),
('uzbekistan', 'Parvoz', 'HY-011', 'Tashkent - Nukus', '08:15', '10:05', 'A03', 'On Time');

-- Xalqaro reyslar
INSERT INTO transit_schedules (category, type, number, route, depart_time, arrive_time, platform, status) VALUES
('international', 'Parvoz', 'HY-601', 'Tashkent - Moscow', '14:20', '17:30', 'B12', 'Boarding'),
('international', 'Parvoz', 'TK-371', 'Istanbul - Tashkent', '18:30', '01:20', 'C02', 'Delayed'),
('international', 'Parvoz', 'HY-271', 'Tashkent - Seoul', '22:15', '06:10', 'A08', 'Scheduled');
