import { Mission, Badge, GalleryItem, Poll, Profile, TwibbonFrame, QuizQuestion, CosplayCategory, CosplayCriterion, CosplayParticipant } from './types';

export const MOCK_PROFILE: Profile = {
  id: 'user-001',
  full_name: 'Bagas Kencana',
  instansi: 'Sekretariat Negara / Garuda Muda',
  phone: '081234567890',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  role: 'participant',
  group_name: 'Tim Merah-Putih I',
  total_points: 350,
  onboarding_completed: true,
  rank: 4,
};

export const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q-1',
    question: 'Di kota manakah naskah Proklamasi Kemerdekaan Indonesia dibacakan oleh Ir. Soekarno pada 17 Agustus 1945?',
    options: [
      'Jalan Pegangsaan Timur No. 56, Jakarta',
      'Gedung Pancasila, Jakarta',
      'Rumah Laksamana Maeda, Jakarta',
      'Tugu Muda, Semarang'
    ],
    correct_answer_index: 0,
    explanation: 'Naskah Proklamasi dibacakan di kediaman Ir. Soekarno di Jalan Pegangsaan Timur No. 56, Jakarta Pusat.',
    order_index: 1,
    is_active: true,
  },
  {
    id: 'q-2',
    question: 'Siapakah tokoh yang merumuskan dan mengetik naskah Proklamasi Kemerdekaan Indonesia dengan mesin ketik?',
    options: [
      'Mohammad Hatta',
      'Sayuti Melik',
      'Achmad Soebardjo',
      'Sukarni'
    ],
    correct_answer_index: 1,
    explanation: 'Sayuti Melik adalah tokoh pemuda yang mengetik naskah asli Proklamasi yang telah disetujui.',
    order_index: 2,
    is_active: true,
  },
  {
    id: 'q-3',
    question: 'Siapakah ibu negara yang menjahit bendera pusaka Sang Saka Merah Putih pertama kali?',
    options: [
      'Ibu Kartini',
      'Ibu Cut Nyak Dien',
      'Ibu Fatmawati',
      'Ibu Dewi Sartika'
    ],
    correct_answer_index: 2,
    explanation: 'Ibu Fatmawati Soekarno menjahit bendera Sang Saka Merah Putih dari dua helai kain merah dan putih.',
    order_index: 3,
    is_active: true,
  },
  {
    id: 'q-4',
    question: 'Peristiwa diculiknya Soekarno dan Hatta oleh para pemuda ke luar kota sebelum Proklamasi dikenal dengan peristiwa...',
    options: [
      'Peristiwa Bandung Lautan Api',
      'Peristiwa Rengasdengklok',
      'Peristiwa 10 November',
      'Peristiwa Ambarawa'
    ],
    correct_answer_index: 1,
    explanation: 'Peristiwa Rengasdengklok terjadi pada 16 Agustus 1945 untuk mendesak penyegeraan Proklamasi Kemerdekaan.',
    order_index: 4,
    is_active: true,
  },
  {
    id: 'q-5',
    question: 'Siapakah pencipta lagu kebangsaan "Indonesia Raya" yang pertama kali diperdengarkan pada Sumpah Pemuda 1928?',
    options: [
      'Ismail Marzuki',
      'W.R. Soepratman',
      'C. Simanjuntak',
      'H. Mutahar'
    ],
    correct_answer_index: 1,
    explanation: 'Wage Rudolf Soepratman menciptakan dan memainkan lagu Indonesia Raya menggunakan biola.',
    order_index: 5,
    is_active: true,
  },
];

export const MOCK_TWIBBON_FRAMES: TwibbonFrame[] = [
  {
    id: 'f-1',
    name: 'Twibbon Versi 1',
    accent_color: '#F59E0B',
    title: 'YAYASAN AL-WATHONIYAH 9',
    subtitle: 'Nusantara Baru, Indonesia Maju',
    frame_image_url: '/twibbon-assets/twibbon-v1.png',
    is_active: true,
    order_index: 1,
  },
  {
    id: 'f-2',
    name: 'Twibbon Versi 2',
    accent_color: '#D9272D',
    title: 'GELORA MERDEKA 81',
    subtitle: '17 AGUSTUS 2026',
    frame_image_url: '/twibbon-assets/twibbon-v2.png',
    is_active: true,
    order_index: 2,
  },
  {
    id: 'f-3',
    name: 'Twibbon Versi 3',
    accent_color: '#10B981',
    title: 'INDONESIA MERDEKA 81',
    subtitle: 'Jiwa Raga Untuk Negeri',
    frame_image_url: '/twibbon-assets/twibbon-v3.png',
    is_active: true,
    order_index: 3,
  },
];

export const MOCK_MISSIONS: Mission[] = [
  {
    id: 'm-01',
    slug: 'selfie-patriotik',
    title: 'Buat Twibbon Photobooth',
    description: 'Buat twibbon dengan foto terbaik dan upload ke layar utama',
    type: 'checkin',
    points_reward: 100,
    icon_name: 'Camera',
    is_active: true,
    order_index: 1,
  },
  {
    id: 'm-02',
    slug: 'jelajah-qr-lokasi',
    title: 'Jelajah QR & Peta Lokasi Perayaan',
    description: 'Temukan dan scan banner QR Code di berbagai titik lokasi perayaan HUT RI ke-81 (Panggung Utama, Bazar UMKM, dll).',
    type: 'qr_hunt',
    points_reward: 150,
    icon_name: 'MapPin',
    is_active: false,
    order_index: 2,
    location_name: 'Area Perayaan HUT RI ke-81',
    coordinates: { lat: -6.175392, lng: 106.827153 },
    radius_meters: 50,
  },
  {
    id: 'm-04',
    slug: 'quiz-kemerdekaan',
    title: 'Kuis Trivia Kemerdekaan RI',
    description: 'Uji pengetahuan sejarah seputar Kemerdekaan Indonesia ke-81 (5 Soal).',
    type: 'quiz',
    points_reward: 100,
    icon_name: 'HelpCircle',
    is_active: true,
    order_index: 3,
  },
  {
    id: 'm-05',
    slug: 'video-gelora-merdeka',
    title: 'Hormat Bendera & Polling Perayaan',
    description: 'Suarakan rasa hormatmu dan ikuti voting polling interaktif di lokasi acara.',
    type: 'video',
    points_reward: 125,
    icon_name: 'Radio',
    is_active: true,
    order_index: 4,
  },
  {
    id: 'm-06',
    slug: 'selfie-guru',
    title: 'Selfie kebersamaan',
    description: 'Pilih teman favoritmu, jepret foto selfie bersama, dan dapatkan tambahan +150 PTS!',
    type: 'checkin',
    points_reward: 150,
    icon_name: 'GraduationCap',
    is_active: true,
    order_index: 5,
  },
  {
    id: 'm-07',
    slug: 'tap-battle',
    title: 'Tap Battle Hormat',
    description: 'Adu cepat! Ketuk tombol hormat sebanyak-banyaknya dalam 60 detik.',
    type: 'checkin',
    points_reward: 200,
    icon_name: 'Activity',
    is_active: true,
    order_index: 6,
  },
];

export const MOCK_BADGES: Badge[] = [
  {
    id: 'b-01',
    code: 'fotografer_patriot',
    name: 'Fotografer Patriot',
    description: 'Membuat dan membagikan semangat kemerdekaan melalui Twibbon Merdeka.',
    icon: '📸',
    rarity: 'common',
  },
  {
    id: 'b-02',
    code: 'raja_trivia',
    name: 'Raja Trivia Sejarah',
    description: 'Menjawab 100% benar pada Kuis Kemerdekaan tanpa salah.',
    icon: '👑',
    rarity: 'rare',
  },
  {
    id: 'b-03',
    code: 'suara_kemerdekaan',
    name: 'Suara Kemerdekaan',
    description: 'Memberikan hormat kebangsaan dan berpartisipasi dalam polling interaktif.',
    icon: '📢',
    rarity: 'legendary',
  },
  {
    id: 'b-04',
    code: 'bestie_merdeka',
    name: 'Bestie Kemerdekaan',
    description: 'Berhasil mengabadikan momen selfie bersama tokoh bestie guru.',
    icon: '🤳',
    rarity: 'rare',
  },
];

export const MOCK_POLL: Poll = {
  id: 'poll-01',
  question: 'Pertunjukan Seni Budaya mana yang paling memukau di HUT RI ke-81?',
  options: [
    { id: 'opt-1', label: 'Tari Colossal Nusantara', votes: 142 },
    { id: 'opt-2', label: 'Atraksi Marching Band Garuda', votes: 198 },
    { id: 'opt-3', label: 'Drama Kolosal Perjuangan 1945', votes: 115 },
    { id: 'opt-4', label: 'Konser Musik Kemerdekaan', votes: 87 },
  ],
  is_active: true,
  total_votes: 542,
};

export const MOCK_GALLERY: GalleryItem[] = [
  {
    id: 'g-1',
    user_id: 'user-002',
    user_name: 'Siti Nurhaliza',
    user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    instansi: 'Kontingen Jakarta Selatan',
    type: 'photo',
    image_url: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=800',
    caption: 'Semangat Kemerdekaan ke-81! Kebaya Merah Putih menyatu dengan alam Indonesia 🇮🇩✨ #Merdeka81',
    like_count: 42,
    report_count: 0,
    status: 'approved',
    created_at: '10 menit lalu',
  },
  {
    id: 'g-2',
    user_id: 'user-003',
    user_name: 'Rian Hidayat',
    user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    instansi: 'Tim Paskibra Nasional',
    type: 'photo',
    image_url: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&q=80&w=800',
    caption: 'Pengibaran Sang Saka Merah Putih di Panggung Utama HUT RI 81. Merdeka! 🔥',
    like_count: 89,
    report_count: 0,
    status: 'approved',
    created_at: '25 menit lalu',
  },
  {
    id: 'g-3',
    user_id: 'user-004',
    user_name: 'Dewi Sartika',
    user_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    instansi: 'Keluarga Besar Garuda',
    type: 'photo',
    image_url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800',
    caption: 'Keseruan lomba balap karung anak-anak perayaan 17-an. Maju terus Indonesia! 🎉',
    like_count: 31,
    report_count: 0,
    status: 'approved',
    created_at: '1 jam lalu',
  },
];

export const MOCK_LEADERBOARD: Profile[] = [
  {
    id: 'user-101',
    full_name: 'Bagas Kencana',
    instansi: 'Sekretariat Negara / Garuda Muda',
    phone: '',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    total_points: 675,
    role: 'participant',
    rank: 1,
    onboarding_completed: true,
  },
  {
    id: 'user-102',
    full_name: 'Titi Wijaya',
    instansi: 'SD AL-Wathoniyah 9',
    phone: '',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    total_points: 550,
    role: 'participant',
    rank: 2,
    onboarding_completed: true,
  },
  {
    id: 'user-103',
    full_name: 'Rudi Kurniawan, ST',
    instansi: 'Yayasan Merdeka',
    phone: '',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    total_points: 425,
    role: 'participant',
    rank: 3,
    onboarding_completed: true,
  },
  {
    id: 'user-104',
    full_name: 'Tata',
    instansi: 'SMP Al-Wathoniyah 9',
    phone: '',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    total_points: 300,
    role: 'participant',
    rank: 4,
    onboarding_completed: true,
  },
  {
    id: 'user-105',
    full_name: 'Toto M',
    instansi: 'TK Al-Wathoniyah 9',
    phone: '',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    total_points: 210,
    role: 'participant',
    rank: 5,
    onboarding_completed: true,
  },
];

export const COSPLAY_JUDGES = [
  'Bapak Sofyan Jamaludin,S.H.I.',
  'Bapak H. Mulyana, S.H., M.M.',
];

export const COSPLAY_CRITERIA_MAP: Record<CosplayCategory, CosplayCriterion[]> = {
  usia_dini: [
    { key: 'kostum', label: 'Kesesuaian Kostum', indicator: 'Kostum dan aksesori sesuai dengan tokoh yang diperankan', weight: 0.30 },
    { key: 'ekspresi', label: 'Ekspresi dan Keceriaan', indicator: 'Menampilkan ekspresi yang sesuai dan menyenangkan', weight: 0.25 },
    { key: 'keberanian', label: 'Keberanian', indicator: 'Berani tampil di depan penonton', weight: 0.20 },
    { key: 'kreativitas', label: 'Kreativitas', indicator: 'Ada unsur kreatif dalam kostum atau penampilan', weight: 0.15 },
    { key: 'pengenalan', label: 'Pengenalan Tokoh', indicator: 'Mampu menyebutkan nama dan mengenali tokoh yang diperankan', weight: 0.10 },
  ],
  usia_menengah: [
    { key: 'kesesuaian_tokoh', label: 'Kesesuaian Tokoh dan Kostum', indicator: 'Kostum, aksesori, dan penampilan mencerminkan karakteristik tokoh', weight: 0.25 },
    { key: 'penghayatan', label: 'Penghayatan dan Ekspresi', indicator: 'Mampu menampilkan karakter tokoh dengan ekspresif', weight: 0.20 },
    { key: 'keberanian_diri', label: 'Keberanian dan Percaya Diri', indicator: 'Tampil dengan percaya diri dan mampu berinteraksi dengan penonton', weight: 0.20 },
    { key: 'keteladanan', label: 'Nilai Keteladanan', indicator: 'Mampu menyampaikan nilai positif dari tokoh', weight: 0.20 },
    { key: 'kreativitas', label: 'Kreativitas', indicator: 'Memiliki ide kreatif dalam kostum dan cara penyajian', weight: 0.15 },
  ],
  usia_atas: [
    { key: 'kostum_properti', label: 'Kesesuaian Kostum dan Properti', indicator: 'Detail kostum dan properti mendukung karakter tokoh', weight: 0.20 },
    { key: 'pemahaman_akurasi', label: 'Pemahaman dan Akurasi Tokoh', indicator: 'Menguasai latar belakang, perjuangan, karya, dan kontribusi tokoh', weight: 0.20 },
    { key: 'pendalaman_karakter', label: 'Pendalaman Karakter', indicator: 'Mampu menghidupkan karakter melalui gestur, ekspresi, dan sikap', weight: 0.20 },
    { key: 'komunikasi', label: 'Kemampuan Komunikasi', indicator: 'Artikulasi, intonasi, pilihan kata, dan kemampuan menjawab pertanyaan', weight: 0.15 },
    { key: 'kreativitas_orisinalitas', label: 'Kreativitas dan Orisinalitas', indicator: 'Konsep penampilan unik, kreatif, dan memiliki nilai tambah', weight: 0.15 },
    { key: 'penguasaan_panggung', label: 'Penguasaan Panggung', indicator: 'Percaya diri, komunikatif, dan mampu menarik perhatian audiens', weight: 0.10 },
  ],
};

export const MOCK_COSPLAY_PARTICIPANTS: CosplayParticipant[] = [
  // Usia Dini (TK / PAUD)
  { id: 'cp-dini-1', name: 'Ahmad Hafiz', class_level: 'A', character_name: 'Ir. Soekarno', category: 'usia_dini' },
  { id: 'cp-dini-2', name: 'Aisyah Putri', class_level: 'A', character_name: 'R.A. Kartini', category: 'usia_dini' },
  { id: 'cp-dini-3', name: 'Bilal Ramadhan', class_level: 'B1', character_name: 'Jenderal Soedirman', category: 'usia_dini' },
  { id: 'cp-dini-4', name: 'Fatimah Az-Zahra', class_level: 'B1', character_name: 'Cut Nyak Dhien', category: 'usia_dini' },
  { id: 'cp-dini-5', name: 'Kenzo Pratama', class_level: 'B2', character_name: 'Bung Tomo', category: 'usia_dini' },
  { id: 'cp-dini-6', name: 'Zahra Amelia', class_level: 'B2', character_name: 'Dewi Sartika', category: 'usia_dini' },

  // Usia Menengah (SD / SMP)
  { id: 'cp-mngh-1', name: 'Bagas Kencana', class_level: 'SD', character_name: 'Ir. Soekarno', category: 'usia_menengah' },
  { id: 'cp-mngh-2', name: 'Siti Nurhaliza', class_level: 'SD', character_name: 'R.A. Kartini', category: 'usia_menengah' },
  { id: 'cp-mngh-3', name: 'Rian Hidayat', class_level: 'SD', character_name: 'Pangeran Diponegoro', category: 'usia_menengah' },
  { id: 'cp-mngh-4', name: 'Fajar Pratama', class_level: 'SMP', character_name: 'Bung Hatta', category: 'usia_menengah' },
  { id: 'cp-mngh-5', name: 'Dian Sastro', class_level: 'SMP', character_name: 'Cut Nyak Dhien', category: 'usia_menengah' },
  { id: 'cp-mngh-6', name: 'Taufik Hidayat', class_level: 'SMP', character_name: 'Jenderal Soedirman', category: 'usia_menengah' },

  // Usia Atas (SMA / SMK / DP)
  { id: 'cp-atas-1', name: 'Nikita Wulandari', class_level: 'DP-1', character_name: 'Malayahati', category: 'usia_atas' },
  { id: 'cp-atas-2', name: 'Dewi Sartika', class_level: 'DP-1', character_name: 'R.A. Kartini', category: 'usia_atas' },
  { id: 'cp-atas-3', name: 'Andi Wijaya', class_level: 'DP-1', character_name: 'Bung Hatta', category: 'usia_atas' },
  { id: 'cp-atas-4', name: 'Reza Rahadian', class_level: 'DP-2', character_name: 'Jenderal Soedirman', category: 'usia_atas' },
  { id: 'cp-atas-5', name: 'Maya Putri', class_level: 'DP-2', character_name: 'Cut Meutia', category: 'usia_atas' },
  { id: 'cp-atas-6', name: 'Farhan Ali', class_level: 'DP-2', character_name: 'Pangeran Diponegoro', category: 'usia_atas' },
];
