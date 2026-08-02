import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('your-project-id')) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diisi di .env.local!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: WebSocket,
  },
});

async function main() {
  console.log('🚀 Memulai Seeding Data ke Supabase Cloud:', supabaseUrl);

  // 1. Seed Live Event State & Polls
  console.log('🫡 Seeding Live Salute & Polling...');
  const { error: saluteErr } = await supabase
    .from('live_event_state')
    .upsert({ id: 'main', salute_count: 1945, event_title: 'Perayaan HUT RI ke-81' });

  if (saluteErr) {
    console.warn('⚠️ Warning on live_event_state insert:', saluteErr.message);
  } else {
    console.log('✅ Live Salute Counter (1945) berhasil di-seed!');
  }

  const initialPoll = {
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

  const { data: existingPolls } = await supabase.from('polls').select('id');
  if (!existingPolls || existingPolls.length === 0) {
    const { error: pollErr } = await supabase.from('polls').insert(initialPoll);
    if (pollErr) {
      console.warn('⚠️ Warning inserting polls:', pollErr.message);
    } else {
      console.log('✅ Polling Live awal berhasil di-seed!');
    }
  }

  // 2. Seed Quiz Questions Table
  console.log('❓ Seeding 5 Soal Kuis Trivia Sejarah...');
  const quizQuestions = [
    {
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

  const { data: existingQ } = await supabase.from('quiz_questions').select('id');
  if (!existingQ || existingQ.length === 0) {
    const { error: quizInsertErr } = await supabase.from('quiz_questions').insert(quizQuestions);
    if (quizInsertErr) {
      console.warn('⚠️ Warning inserting quiz_questions:', quizInsertErr.message);
    } else {
      console.log('✅ 5 Soal Kuis Sejarah berhasil di-insert ke Supabase Cloud!');
    }
  }

  // 3. Seed Twibbon Frames Table
  console.log('🖼️ Seeding Twibbon Frames...');
  const twibbonFrames = [
    {
      name: 'Garuda Emas 81',
      accent_color: '#F59E0B',
      title: 'HUT RI KE-81',
      subtitle: 'Nusantara Baru, Indonesia Maju',
      is_active: true,
      order_index: 1,
    },
    {
      name: 'Merah Putih Patriot',
      accent_color: '#D9272D',
      title: 'GELORA MERDEKA',
      subtitle: '17 AGUSTUS 2026',
      is_active: true,
      order_index: 2,
    },
    {
      name: 'Kemerdekaan Modern',
      accent_color: '#10B981',
      title: 'INDONESIA 81',
      subtitle: 'Jiwa Raga Untuk Negeri',
      is_active: true,
      order_index: 3,
    },
  ];

  const { data: existingFrames } = await supabase.from('twibbon_frames').select('id');
  if (!existingFrames || existingFrames.length === 0) {
    const { error: framesInsertErr } = await supabase.from('twibbon_frames').insert(twibbonFrames);
    if (framesInsertErr) {
      console.warn('⚠️ Warning inserting twibbon_frames:', framesInsertErr.message);
    } else {
      console.log('✅ 3 Bingkai Twibbon awal berhasil di-insert ke Supabase Cloud!');
    }
  }

  // 4. Seed Missions Table
  console.log('📦 Seeding Misi Kemerdekaan...');
  const missions = [
    {
      slug: 'selfie-patriotik',
      title: 'Selfie Patriotik 17-an',
      description: 'Ambil foto selfie terbaikmu dengan busana adat / pakaian tema Merah Putih!',
      type: 'checkin',
      points_reward: 100,
      icon_name: 'Camera',
      is_active: true,
      order_index: 1,
    },
    {
      slug: 'titik-panggung-utama',
      title: 'Jelajah QR: Panggung Utama',
      description: 'Temukan dan scan QR Code di area Panggung Utama Perayaan HUT RI ke-81.',
      type: 'qr_hunt',
      points_reward: 75,
      icon_name: 'QrCode',
      is_active: true,
      order_index: 2,
    },
    {
      slug: 'titik-bazar-umkm',
      title: 'Jelajah QR: Bazar Kuliner Nusantara',
      description: 'Temukan banner QR Code di booth Bazar UMKM Kemerdekaan.',
      type: 'qr_hunt',
      points_reward: 75,
      icon_name: 'MapPin',
      is_active: true,
      order_index: 3,
    },
    {
      slug: 'quiz-kemerdekaan',
      title: 'Kuis Trivia Kemerdekaan RI',
      description: 'Uji pengetahuan sejarah seputar Kemerdekaan Indonesia ke-81 (5 Soal).',
      type: 'quiz',
      points_reward: 100,
      icon_name: 'HelpCircle',
      is_active: true,
      order_index: 4,
    },
    {
      slug: 'video-gelora-merdeka',
      title: 'Video Pekik "Merdeka!"',
      description: 'Rekam video singkat (maks 15 detik) menyuarakan pesan Kemerdekaan 81.',
      type: 'video',
      points_reward: 125,
      icon_name: 'Video',
      is_active: true,
      order_index: 5,
    },
  ];

  const { error: missionsError } = await supabase.from('missions').upsert(missions, { onConflict: 'slug' });
  if (missionsError) {
    console.warn('⚠️ Warning on missions insert:', missionsError.message);
  } else {
    console.log('✅ 5 Misi Kemerdekaan berhasil di-seed!');
  }

  // 5. Seed Badges Table
  console.log('🏅 Seeding Badges Achievement...');
  const badges = [
    {
      code: 'pahlawan_tercepat',
      name: 'Pahlawan Tercepat',
      description: 'Diberikan kepada 10 peserta pertama yang melakukan check-in perayaan.',
      icon: '⚡',
      rarity: 'legendary',
    },
    {
      code: 'raja_trivia',
      name: 'Raja Trivia Sejarah',
      description: 'Menjawab 100% benar pada Kuis Kemerdekaan tanpa salah.',
      icon: '👑',
      rarity: 'rare',
    },
    {
      code: 'penjelajah_nusantara',
      name: 'Penjelajah Nusantara',
      description: 'Berhasil memindai seluruh titik lokasi QR Hunt di lokasi acara.',
      icon: '🧭',
      rarity: 'rare',
    },
    {
      code: 'fotografer_patriot',
      name: 'Fotografer Patriot',
      description: 'Mengunggah 3+ foto keseruan 17-an di Wall of Merdeka.',
      icon: '📸',
      rarity: 'common',
    },
  ];

  const { error: badgesError } = await supabase.from('badges').upsert(badges, { onConflict: 'code' });
  if (badgesError) {
    console.warn('⚠️ Warning on badges insert:', badgesError.message);
  } else {
    console.log('✅ 4 Lencana Achievement berhasil di-seed!');
  }

  // 6. Create Demo Auth Users
  console.log('👥 Mendaftarkan Akun Demo Auth...');

  const demoUsers = [
    {
      email: 'admin@merdeka81.id',
      password: 'Merdeka81#Admin',
      fullName: 'Panitia Utama HUT RI 81',
      role: 'admin',
      instansi: 'Panitia Nasional / Garuda 81',
    },
    {
      email: 'peserta@merdeka81.id',
      password: 'Merdeka81#Peserta',
      fullName: 'Bagas Kencana (Peserta Demo)',
      role: 'participant',
      instansi: 'Sekretariat Negara / Garuda Muda',
    },
  ];

  let participantId = null;

  for (const user of demoUsers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        role: user.role,
        instansi: user.instansi,
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        console.log(`ℹ️ User ${user.email} sudah terdaftar di Supabase Auth.`);
      } else {
        console.warn(`⚠️ Warning creating user ${user.email}:`, error.message);
      }
    } else {
      console.log(`✅ User Demo berhasil dibuat di Supabase Auth: ${user.email} (${user.role})`);
      if (data.user) {
        if (user.role === 'participant') participantId = data.user.id;
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: user.fullName,
          role: user.role,
          instansi: user.instansi,
          total_points: user.role === 'participant' ? 350 : 0,
          onboarding_completed: true,
        });
      }
    }
  }

  // 7. Seed Sample Gallery Items
  console.log('📸 Seeding Sample Galeri Foto Wall of Merdeka...');
  if (participantId) {
    const sampleGallery = [
      {
        user_id: participantId,
        type: 'photo',
        image_url: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=800',
        caption: 'Semangat Kemerdekaan ke-81! Kebaya Merah Putih menyatu dengan alam Indonesia 🇮🇩✨ #Merdeka81',
        status: 'approved',
        like_count: 42,
        report_count: 0,
      },
      {
        user_id: participantId,
        type: 'photo',
        image_url: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&q=80&w=800',
        caption: 'Pengibaran Sang Saka Merah Putih di Panggung Utama HUT RI 81. Merdeka! 🔥',
        status: 'approved',
        like_count: 89,
        report_count: 0,
      },
    ];

    const { data: existingGallery } = await supabase.from('gallery_items').select('id');
    if (!existingGallery || existingGallery.length === 0) {
      await supabase.from('gallery_items').insert(sampleGallery);
      console.log('✅ Sample foto Galeri berhasil di-seed!');
    }
  }

  console.log('\n🎉 SEEDING DATA KE SUPABASE CLOUD SELESAI!');
}

main().catch((err) => {
  console.error('❌ Error executing seed:', err);
  process.exit(1);
});
