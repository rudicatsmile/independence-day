# Product Requirements Document (PRD) — Technical Deep Dive
## Aplikasi Mobile "Merdeka 81" – HUT RI ke-81

> Dokumen ini adalah pengembangan lebih rinci dari PRD awal, dengan tech stack final dan spesifikasi teknis siap-implementasi.

**Tech Stack:**
- **Framework:** Next.js 15 (App Router, React Server Components, Server Actions)
- **Bahasa:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend/DB/Realtime/Storage/Auth:** Supabase (PostgreSQL, Realtime, Storage, Auth)
- **State Management:** Zustand (client/UI state) + TanStack Query (server state & caching)
- **PWA:** Serwist (successor dari next-pwa, direkomendasikan untuk Next.js 15 App Router)
- **Hosting:** Vercel

**Keputusan Panitia (final, menggantikan open questions versi sebelumnya):**
1. Moderasi galeri: **auto-publish + post-moderation** (konten langsung tayang, admin bisa takedown belakangan)
2. Estimasi peserta simultan: **±200 orang**
3. Filter AR: **menggunakan aset custom** (logo & ornamen bertema kemerdekaan, perlu disiapkan tim desain)
4. Sertifikat digital: **tanpa tanda tangan digital/QR verifikasi keaslian** (cukup PDF otomatis)

---

## 1. Ringkasan Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (PWA)                          │
│  Next.js 15 App Router (RSC + Client Components)              │
│  ├── Zustand: UI state (modal, camera state, live-mode flag) │
│  ├── TanStack Query: server state (missions, gallery, poll)  │
│  └── Serwist Service Worker: cache, offline queue, install    │
└───────────────┬─────────────────────────────────────────────┘
                │ HTTPS / WSS
┌───────────────▼─────────────────────────────────────────────┐
│                         SUPABASE                              │
│  ├── Auth (Phone OTP / Magic Link / Anonymous+Claim)          │
│  ├── Postgres (RLS aktif di semua tabel)                      │
│  ├── Realtime (Postgres Changes: leaderboard, poll, gallery)  │
│  ├── Storage (bucket: selfies, videos, certificates)          │
│  └── Edge Functions (poin engine, sertifikat generator, dsb)  │
└───────────────┬─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│            Admin Dashboard (Next.js route group /admin)       │
│  Moderasi konten, kontrol poll, toggle Live Mode, statistik    │
└─────────────────────────────────────────────────────────────┘
```

**Kenapa Supabase cocok untuk kasus ini:**
- Realtime Postgres Changes → leaderboard & gallery update otomatis tanpa infra WebSocket custom.
- Row Level Security (RLS) → aman untuk aplikasi publik tanpa perlu backend terpisah.
- Storage terintegrasi → upload selfie/video langsung dari client dengan signed URL.
- Edge Functions → logika poin, anti-cheat, dan generate PDF sertifikat tanpa server tambahan.

---

## 2. Struktur Folder (Next.js 15 App Router)

```
merdeka81/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                 # Splash/Landing
│   │   │   ├── onboarding/page.tsx
│   │   │   ├── auth/
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── verify/page.tsx
│   │   │   ├── home/page.tsx
│   │   │   ├── missions/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [missionId]/page.tsx
│   │   │   ├── checkin/page.tsx
│   │   │   ├── quiz/[missionId]/page.tsx
│   │   │   ├── video-record/[missionId]/page.tsx
│   │   │   ├── gallery/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [itemId]/page.tsx
│   │   │   ├── leaderboard/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── passport/page.tsx
│   │   │   ├── live/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── yearbook/page.tsx
│   │   ├── (admin)/
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx           # guard: role=admin
│   │   │   │   ├── page.tsx             # statistik/dashboard
│   │   │   │   ├── moderation/page.tsx
│   │   │   │   ├── polls/page.tsx
│   │   │   │   ├── live-control/page.tsx
│   │   │   │   └── users/page.tsx
│   │   ├── api/
│   │   │   ├── checkin/route.ts
│   │   │   ├── missions/[id]/complete/route.ts
│   │   │   ├── poll/vote/route.ts
│   │   │   ├── certificate/generate/route.ts
│   │   │   └── webhook/supabase/route.ts
│   │   ├── manifest.ts                  # PWA manifest (Next 15 native)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                          # shadcn/ui generated components
│   │   ├── mission/
│   │   ├── gallery/
│   │   ├── leaderboard/
│   │   ├── camera/
│   │   ├── live/
│   │   └── shared/
│   ├── stores/                          # Zustand stores
│   │   ├── useUIStore.ts
│   │   ├── useCameraStore.ts
│   │   ├── useLiveStore.ts
│   │   └── useUploadQueueStore.ts
│   ├── hooks/                           # custom hooks berbasis TanStack Query
│   │   ├── useMissions.ts
│   │   ├── useLeaderboard.ts
│   │   ├── useGallery.ts
│   │   ├── usePoll.ts
│   │   └── useUserStats.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                # browser client
│   │   │   ├── server.ts                # server client (RSC/Server Actions)
│   │   │   └── middleware.ts
│   │   ├── query-client.ts
│   │   └── validators/                  # Zod schemas
│   ├── actions/                         # Server Actions
│   │   ├── mission.actions.ts
│   │   ├── checkin.actions.ts
│   │   ├── gallery.actions.ts
│   │   └── poll.actions.ts
│   ├── types/
│   │   └── database.types.ts            # generated via `supabase gen types`
│   └── sw.ts                            # Serwist service worker entry
├── middleware.ts                        # auth guard + admin guard
├── next.config.ts                       # withSerwist wrapper
└── public/
    └── icons/                           # PWA icons berbagai ukuran
```

---

## 3. Database Schema (Supabase / PostgreSQL)

Semua tabel menggunakan `uuid` sebagai primary key (`gen_random_uuid()`), `created_at`/`updated_at` timestamp default `now()`, dan **RLS aktif**.

### 3.1 `profiles`
Extend dari `auth.users` (1-to-1 via trigger saat sign up).

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK, FK → auth.users.id) | |
| full_name | text | |
| instansi | text | Instansi/kelompok |
| phone | text | unik |
| avatar_url | text | nullable |
| role | text | `participant` \| `admin` \| `media_team` (default `participant`) |
| group_id | uuid | FK → `groups.id`, nullable |
| total_points | int | default 0, di-update via trigger/RPC |
| onboarding_completed | boolean | default false |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 3.2 `groups`
| Kolom | Tipe |
|---|---|
| id | uuid PK |
| name | text |
| total_points | int (agregat, di-update via trigger) |
| created_at | timestamptz |

### 3.3 `missions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK |
| slug | text unik | `selfie-patriotik`, `jelajah-titik-merdeka`, dst |
| title | text |
| description | text |
| type | text | enum: `checkin` \| `qr_hunt` \| `quiz` \| `video` \| `referral` |
| points_reward | int | |
| config | jsonb | konfigurasi spesifik misi (mis. jumlah QR, soal quiz) |
| is_active | boolean | default true |
| order_index | int | urutan tampil |
| starts_at / ends_at | timestamptz | nullable, untuk misi terjadwal |

### 3.4 `user_missions`
Progres user per misi.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK |
| user_id | uuid FK → profiles.id |
| mission_id | uuid FK → missions.id |
| status | text | `not_started` \| `in_progress` \| `completed` |
| progress | jsonb | mis. `{ "qr_scanned": ["QR1","QR2"] }` |
| points_earned | int | |
| completed_at | timestamptz nullable | |
| UNIQUE(user_id, mission_id) | | |

### 3.5 `checkin_points` (QR Hunt lokasi)
| Kolom | Tipe |
|---|---|
| id | uuid PK |
| code | text unik (isi QR) |
| label | text (nama titik) |
| lat / lng | numeric nullable |

### 3.6 `stamps`
| Kolom | Tipe |
|---|---|
| id | uuid PK |
| user_id | uuid FK |
| mission_id | uuid FK |
| icon_url | text |
| earned_at | timestamptz |

### 3.7 `gallery_items`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK |
| user_id | uuid FK |
| type | text | `photo` \| `video` |
| storage_path | text | path di Supabase Storage |
| thumbnail_path | text nullable | |
| caption | text nullable | |
| mission_id | uuid FK nullable | |
| like_count | int default 0 |
| status | text | `approved` (default, auto-publish) \| `flagged` \| `removed` — lihat catatan post-moderation di bawah |
| flagged_reason | text nullable | diisi admin saat flag/takedown |
| moderated_by | uuid FK nullable |
| moderated_at | timestamptz nullable |
| report_count | int default 0 | jumlah laporan dari peserta lain (opsional, untuk prioritas review admin) |
| created_at | timestamptz |

> **Catatan model moderasi (auto-publish + post-moderation):** setiap item yang diunggah langsung berstatus `approved` dan tampil di galeri publik tanpa antrian approval. Admin/media_team memantau feed secara berjalan dan melakukan **takedown** (`status → removed`) bila ada konten tidak pantas. Ini menghilangkan friksi/latensi bagi peserta (foto langsung tampil di layar besar/wall), dengan trade-off risiko konten tidak pantas sempat tayang sesaat — dimitigasi lewat kombinasi (a) admin memantau real-time selama acara, (b) tombol "Laporkan" dari peserta lain untuk menaikkan prioritas review, dan (c) rate-limit upload per user untuk mencegah spam.

### 3.8 `gallery_likes`
| Kolom | Tipe |
|---|---|
| id | uuid PK |
| gallery_item_id | uuid FK |
| user_id | uuid FK |
| UNIQUE(gallery_item_id, user_id) |

### 3.9 `polls`
| Kolom | Tipe |
|---|---|
| id | uuid PK |
| question | text |
| options | jsonb | `[{ "id": "a", "label": "..." }, ...]` |
| is_active | boolean |
| results_visible | boolean | apakah hasil ditampilkan real-time ke peserta |
| created_at | timestamptz |
| closed_at | timestamptz nullable |

### 3.10 `poll_votes`
| Kolom | Tipe |
|---|---|
| id | uuid PK |
| poll_id | uuid FK |
| user_id | uuid FK |
| option_id | text |
| UNIQUE(poll_id, user_id) |

### 3.11 `live_events`
Event kolektif seperti "Hormat!" atau challenge "Merdeka!".

| Kolom | Tipe |
|---|---|
| id | uuid PK |
| type | text | `salute` \| `merdeka_challenge` |
| triggered_by | uuid FK (admin) |
| participant_count | int default 0 (agregat) |
| is_active | boolean |
| created_at | timestamptz |

### 3.12 `live_event_participations`
| Kolom | Tipe |
|---|---|
| id | uuid PK |
| live_event_id | uuid FK |
| user_id | uuid FK |
| UNIQUE(live_event_id, user_id) |

### 3.13 `certificates`
| Kolom | Tipe |
|---|---|
| id | uuid PK |
| user_id | uuid FK |
| pdf_url | text |
| issued_at | timestamptz |

> Sertifikat berupa PDF otomatis berisi nama peserta, instansi, dan poin/misi yang diselesaikan — **tanpa tanda tangan digital maupun QR verifikasi keaslian**. Cukup generate-and-store; tidak perlu Edge Function tambahan untuk signing atau endpoint verifikasi publik.

### 3.14 `notifications`
| Kolom | Tipe |
|---|---|
| id | uuid PK |
| user_id | uuid FK nullable (null = broadcast) |
| title | text |
| body | text |
| link | text nullable |
| is_read | boolean default false |
| created_at | timestamptz |

### 3.15 `referrals`
| Kolom | Tipe |
|---|---|
| id | uuid PK |
| referrer_id | uuid FK |
| referred_id | uuid FK unik | 1 user hanya bisa dirujuk sekali |
| created_at | timestamptz |

### Contoh RLS Policy (gallery_items) — model auto-publish + post-moderation
```sql
alter table gallery_items enable row level security;

-- Publik bisa lihat item yang berstatus approved (default saat insert)
create policy "public can view approved gallery"
on gallery_items for select
using (status = 'approved');

-- User selalu bisa lihat item miliknya sendiri apapun statusnya (mis. yang sudah di-takedown)
create policy "user can view own gallery item"
on gallery_items for select
using (auth.uid() = user_id);

-- User hanya bisa insert dengan status default 'approved' (auto-publish), tidak boleh set status lain
create policy "user can insert own gallery item"
on gallery_items for insert
with check (auth.uid() = user_id);

-- Hanya admin/media_team yang boleh mengubah status (takedown/flag) → post-moderation
create policy "moderator can update gallery status"
on gallery_items for update
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'media_team')
  )
);
```

**`gallery_reports`** (tabel pendukung tombol "Laporkan" dari peserta, opsional tapi direkomendasikan untuk model post-moderation):

| Kolom | Tipe |
|---|---|
| id | uuid PK |
| gallery_item_id | uuid FK |
| reported_by | uuid FK |
| reason | text nullable |
| created_at | timestamptz |
| UNIQUE(gallery_item_id, reported_by) | |

Trigger sederhana meng-increment `gallery_items.report_count` setiap insert baru di `gallery_reports`, sehingga admin dapat mengurutkan panel moderasi berdasarkan item dengan laporan terbanyak.

### Trigger poin (contoh)
```sql
create or replace function update_total_points()
returns trigger as $$
begin
  update profiles
  set total_points = (
    select coalesce(sum(points_earned), 0)
    from user_missions
    where user_id = new.user_id and status = 'completed'
  )
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_update_points
after insert or update on user_missions
for each row
when (new.status = 'completed')
execute function update_total_points();
```

---

## 4. API Design

Kombinasi **Server Actions** (untuk mutasi dari form/UI) dan **Route Handlers** (untuk kebutuhan eksternal: webhook, generate PDF, endpoint yang dipanggil dari service worker/background sync).

### 4.1 Server Actions (`src/actions/`)

| Action | File | Deskripsi |
|---|---|---|
| `registerUser(input)` | auth.actions.ts | Registrasi + create profile |
| `completeOnboarding()` | auth.actions.ts | Set `onboarding_completed = true` |
| `checkinUser(qrCode, selfiePath)` | checkin.actions.ts | Validasi QR, simpan selfie, trigger mission `selfie-patriotik` |
| `scanQrHuntPoint(code)` | mission.actions.ts | Update progress `jelajah-titik-merdeka` |
| `submitQuizAnswer(missionId, answers)` | mission.actions.ts | Hitung skor, tandai completed jika lulus |
| `submitVideoMission(missionId, storagePath)` | mission.actions.ts | Simpan video, tandai completed |
| `submitReferral(code)` | mission.actions.ts | Validasi & catat referral |
| `uploadGalleryItem(file, caption, missionId?)` | gallery.actions.ts | Upload ke Storage + insert row |
| `likeGalleryItem(itemId)` | gallery.actions.ts | Toggle like |
| `moderateGalleryItem(itemId, status)` | gallery.actions.ts (admin) | Approve/reject |
| `voteOnPoll(pollId, optionId)` | poll.actions.ts | Insert vote, cegah duplikat |
| `createPoll(input)` / `closePoll(id)` | poll.actions.ts (admin) | Kontrol poll |
| `triggerLiveEvent(type)` | live.actions.ts (admin) | Mulai event "Hormat!"/"Merdeka!" |
| `joinLiveEvent(eventId)` | live.actions.ts | Partisipasi user |
| `requestCertificate()` | certificate.actions.ts | Cek syarat lulus → generate PDF sederhana (tanpa signature/QR) |

### 4.2 Route Handlers (`src/app/api/`)

| Endpoint | Method | Deskripsi |
|---|---|---|
| `/api/checkin` | POST | Alternatif REST untuk check-in (dipakai background sync saat offline→online) |
| `/api/missions/[id]/complete` | POST | Idempotent endpoint untuk sinkronisasi progres offline |
| `/api/poll/vote` | POST | Vote via REST (fallback jika Server Action gagal dari SW) |
| `/api/certificate/generate` | POST | Panggil Edge Function generate PDF, return signed URL |
| `/api/certificate/[userId]` | GET | Cek status sertifikat |
| `/api/admin/stats` | GET | Statistik agregat untuk dashboard admin |
| `/api/webhook/supabase` | POST | (opsional) terima event dari Supabase untuk push notification |

### 4.3 Realtime Channels (Supabase Realtime)

| Channel | Sumber | Dipakai di |
|---|---|---|
| `leaderboard-changes` | postgres_changes on `profiles` (order by total_points) | Leaderboard page, Home widget |
| `gallery-feed` | postgres_changes on `gallery_items` (status=approved) | Gallery / Wall of Merdeka |
| `poll-{pollId}` | postgres_changes on `poll_votes` | Live Poll komponen |
| `live-event-{eventId}` | postgres_changes on `live_event_participations` | Tombol "Hormat!", Challenge Merdeka |
| `notifications-{userId}` | postgres_changes on `notifications` | Notification bell |

---

## 5. State Management

### 5.1 Pembagian tanggung jawab
- **TanStack Query** → semua data yang berasal dari server/Supabase (missions, gallery, leaderboard, poll, profile). Menangani caching, invalidation, optimistic update, dan background refetch.
- **Zustand** → state UI murni yang tidak perlu persist ke server: status kamera aktif, modal terbuka, mode Live aktif/tidak, antrian upload offline, filter galeri yang dipilih user.

### 5.2 Contoh Zustand Store

```typescript
// src/stores/useLiveStore.ts
import { create } from 'zustand';

interface LiveState {
  isLiveMode: boolean;
  activePollId: string | null;
  activeLiveEventId: string | null;
  setLiveMode: (v: boolean) => void;
  setActivePoll: (id: string | null) => void;
  setActiveLiveEvent: (id: string | null) => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  isLiveMode: false,
  activePollId: null,
  activeLiveEventId: null,
  setLiveMode: (v) => set({ isLiveMode: v }),
  setActivePoll: (id) => set({ activePollId: id }),
  setActiveLiveEvent: (id) => set({ activeLiveEventId: id }),
}));
```

```typescript
// src/stores/useUploadQueueStore.ts
// Antrian upload untuk mendukung offline capability
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface QueuedUpload {
  id: string;
  type: 'photo' | 'video';
  blobKey: string;      // key ke IndexedDB tempat blob disimpan
  caption?: string;
  missionId?: string;
  createdAt: number;
  status: 'queued' | 'uploading' | 'failed' | 'done';
}

interface UploadQueueState {
  queue: QueuedUpload[];
  addToQueue: (item: QueuedUpload) => void;
  updateStatus: (id: string, status: QueuedUpload['status']) => void;
  removeFromQueue: (id: string) => void;
}

export const useUploadQueueStore = create<UploadQueueState>()(
  persist(
    (set) => ({
      queue: [],
      addToQueue: (item) => set((s) => ({ queue: [...s.queue, item] })),
      updateStatus: (id, status) =>
        set((s) => ({
          queue: s.queue.map((q) => (q.id === id ? { ...q, status } : q)),
        })),
      removeFromQueue: (id) =>
        set((s) => ({ queue: s.queue.filter((q) => q.id !== id) })),
    }),
    { name: 'upload-queue', storage: createJSONStorage(() => localStorage) }
  )
);
```

### 5.3 Contoh TanStack Query Hook

```typescript
// src/hooks/useLeaderboard.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useLeaderboard(scope: 'individual' | 'group' = 'individual') {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['leaderboard', scope],
    queryFn: async () => {
      const table = scope === 'individual' ? 'profiles' : 'groups';
      const { data, error } = await supabase
        .from(table)
        .select('id, full_name, total_points, avatar_url')
        .order('total_points', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    staleTime: 10_000,
  });

  // Subscribe realtime → invalidate query saat ada perubahan poin
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: scope === 'individual' ? 'profiles' : 'groups' },
        () => queryClient.invalidateQueries({ queryKey: ['leaderboard', scope] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scope, supabase, queryClient]);

  return query;
}
```

### 5.4 Query Key Convention
```
['profile', userId]
['missions']
['mission', missionId]
['user-missions', userId]
['gallery', { sort: 'latest' | 'popular' | 'mine', page }]
['leaderboard', 'individual' | 'group']
['poll', pollId]
['notifications', userId]
['certificate', userId]
```

---

## 6. Konfigurasi PWA (Serwist)

**Alasan memilih Serwist:** `next-pwa` lama tidak lagi dikembangkan aktif dan kurang kompatibel dengan App Router + Turbopack; Serwist adalah fork yang dipelihara aktif dan didesain untuk Next.js 15.

```typescript
// next.config.ts
import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default withSerwist(nextConfig);
```

```typescript
// src/sw.ts
import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      // Cache list misi agar tetap tampil saat offline
      matcher: ({ url }) => url.pathname.startsWith('/api/missions'),
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'missions-cache' },
    },
    {
      // Gambar galeri: cache-first agar hemat data
      matcher: ({ request }) => request.destination === 'image',
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 3 },
      },
    },
  ],
});

serwist.addEventListeners();
```

```typescript
// src/app/manifest.ts (Next.js 15 native manifest route)
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Merdeka 81 – HUT RI ke-81',
    short_name: 'Merdeka 81',
    description: 'Aplikasi partisipasi upacara HUT RI ke-81',
    start_url: '/home',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#D9272D',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
```

### 6.1 Strategi Offline Capability
| Fitur | Strategi |
|---|---|
| Lihat daftar misi | Precache + StaleWhileRevalidate, fallback ke cache jika offline |
| Check-in | Simpan aksi di IndexedDB (via `useUploadQueueStore` + `idb-keyval`), sinkron otomatis lewat **Background Sync API** saat online kembali |
| Upload foto/video | Simpan blob sementara di IndexedDB, badge "Menunggu koneksi" di UI, auto-retry saat online |
| Leaderboard/Gallery real-time | Tidak tersedia offline; tampilkan snapshot terakhir dari cache dengan label "Terakhir diperbarui: ..." |
| Halaman statis (Passport, Profile) | Precache penuh |

---

## 7. Komponen UI Utama & State

### 7.1 `<CheckinCamera />`
- **State lokal (Zustand `useCameraStore`):** `isCameraReady`, `capturedImage`, `arFilterId`, `facingMode`
- **Alur:** minta izin kamera → render `<video>` + overlay AR (canvas) → capture ke blob → preview → confirm → panggil `checkinUser()` Server Action atau masuk `useUploadQueueStore` bila offline
- Menggunakan `getUserMedia` + canvas overlay ringan (bukan model ML berat, demi performa di lapangan) untuk komposit **aset AR custom** (logo HUT RI ke-81, bingkai/ornamen merah-putih-emas, watermark tanggal) di atas frame video
- **Kebutuhan aset dari tim desain** (blocking dependency, siapkan lebih awal): PNG transparan resolusi tinggi untuk tiap varian filter — minimal 1 varian bingkai penuh (frame) + 1 varian overlay logo pojok (ringan, tidak menutupi wajah), masing-masing dalam rasio 9:16 (portrait) dan disediakan 2x/3x density untuk ketajaman di berbagai device
- Aset disimpan di `public/ar-assets/` atau Supabase Storage bucket `ar-assets` (jika ingin bisa diganti tanpa redeploy), dimuat lazy saat halaman check-in dibuka

### 7.2 `<MissionCard />` & `<MissionList />`
- Data dari `useMissions()` (TanStack Query, key `['missions']`, join dengan `['user-missions', userId]`)
- Props: status (`locked` \| `available` \| `in_progress` \| `completed`), progress bar untuk misi bertahap (mis. QR Hunt 2/3)

### 7.3 `<QuizFlow />`
- State lokal komponen (useState/useReducer cukup, tidak perlu Zustand karena scope sempit): `currentQuestionIndex`, `selectedAnswers`, `timeLeft`
- Timer 60 detik pakai `setInterval` + cleanup; auto-submit saat waktu habis
- Submit final → `submitQuizAnswer()` Server Action

### 7.4 `<GalleryFeed />`
- `useGallery({ sort })` — TanStack Query dengan **infinite query** (`useInfiniteQuery`) untuk pagination/scroll
- Realtime insert baru → `queryClient.setQueryData` prepend item baru (optimistic merge) alih-alih full refetch
- Sub-komponen: `<GalleryItemCard />` (lazy-loaded image via `next/image`), `<LikeButton />` (optimistic update)

### 7.5 `<Leaderboard />`
- `useLeaderboard(scope)` seperti contoh di atas
- Highlight baris user saat ini (scroll-into-view otomatis saat mount)
- Tab switch individu/kelompok via Zustand `useUIStore.leaderboardTab`

### 7.6 `<LivePollWidget />`
- `usePoll(pollId)` — subscribe realtime vote count
- State lokal: `hasVoted` (dicek dari `poll_votes` user), pilihan disabled setelah vote
- Hasil ditampilkan sebagai bar chart sederhana (shadcn/ui + `recharts` opsional)

### 7.7 `<SaluteButton />` (Tombol "Hormat!")
- Zustand `useLiveStore.activeLiveEventId` menentukan apakah tombol aktif
- Tap → `joinLiveEvent()` → animasi confetti/haptic feedback → counter partisipasi real-time via subscribe `live_event_participations`

### 7.8 `<DigitalPassport />`
- Grid stamp dari `useUserStamps(userId)`, stamp yang belum didapat ditampilkan silhouette abu-abu
- Progress bar syarat sertifikat (mis. "4/5 misi selesai")

### 7.9 `<AdminModerationPanel />` (route group `/admin`) — Post-Moderation
- Menampilkan **feed live** seluruh item `approved` (bukan antrian pending), diurutkan default berdasarkan `created_at` terbaru, dengan opsi sort "Paling banyak dilaporkan" (`report_count`)
- Aksi per item: **Takedown** (status → `removed`, wajib isi `flagged_reason` singkat) — optimistic mutation, item langsung hilang dari galeri publik via realtime
- Badge merah pada item dengan `report_count > 0` agar mudah diprioritaskan saat memantau
- Guard di `layout.tsx` admin: cek `profile.role === 'admin' | 'media_team'` via middleware + server-side check
- Rekomendasi operasional: minimal 1-2 orang tim media memantau panel ini aktif selama durasi upacara, karena tidak ada jeda approval sebelum konten tayang

---

## 8. Autentikasi & Middleware

- **Metode:** Supabase Auth dengan OTP via nomor HP (SMS) — sesuai target user lapangan yang mungkin tidak selalu punya email aktif. Alternatif: Magic Link email untuk ASN/komunitas yang lebih formal.
- **Session:** Supabase menyimpan session via cookies (`@supabase/ssr`), dibaca di Server Components & middleware.
- **`middleware.ts`:**
  - Refresh session token di setiap request
  - Redirect ke `/auth/register` jika belum login dan mengakses route terproteksi
  - Redirect ke `/home` jika mencoba akses `/admin` tanpa role admin/media_team

```typescript
// middleware.ts (ringkas)
import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { supabase, response } = await updateSession(request);
  const { data: { user } } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isProtected = !['/auth', '/'].some((p) => request.nextUrl.pathname.startsWith(p));

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/auth/register', request.url));
  }

  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || !['admin', 'media_team'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest).*)'],
};
```

---

## 9. Analytics & Event Tracking

Gunakan Vercel Analytics / Supabase table `analytics_events` (atau kirim ke tool eksternal seperti PostHog bila dibutuhkan funnel lebih dalam).

| Event | Trigger | Payload |
|---|---|---|
| `checkin_success` | Selesai check-in | `{ user_id, method: 'qr' }` |
| `mission_start` | User membuka detail misi | `{ mission_id }` |
| `mission_complete` | Misi selesai | `{ mission_id, points_earned }` |
| `poll_vote` | Vote poll | `{ poll_id, option_id }` |
| `gallery_upload` | Upload foto/video | `{ type, mission_id? }` |
| `live_event_join` | Partisipasi Hormat!/Merdeka! | `{ live_event_id, type }` |
| `certificate_download` | Unduh sertifikat | `{ user_id }` |
| `session_duration` | Dihitung di client saat unload/visibility change | `{ duration_seconds }` |

---

## 10. Non-Functional & Performance Checklist

| Area | Target | Implementasi |
|---|---|---|
| Load time awal | < 3 detik di 4G | RSC untuk halaman non-interaktif, `next/image`, code-splitting per route, precache Serwist |
| Bundle size | Minimalkan client JS | Server Components default, Client Component hanya untuk kamera/quiz/realtime widget |
| Real-time load | Stabil untuk ±200 koneksi simultan (skala moderat) | Tier Supabase Pro sudah cukup (default limit 500 concurrent realtime connections, jauh di atas 200); tetap gunakan filter per channel (bukan broadcast semua tabel) dan debounce update leaderboard UI (mis. batch tiap 2 detik) untuk hemat bandwidth di lapangan |
| Aksesibilitas | Kontras tinggi, teks scalable | Tailwind design tokens sesuai tema merah-putih, `rem` unit, uji dengan Lighthouse Accessibility |
| Keamanan | RLS penuh, tidak ada service_role key di client | Semua akses sensitif lewat Server Action/Route Handler |
| Skalabilitas storage | Foto/video dari ±200 peserta (potensi 2-3 upload/orang → ~400-600 file) | Kompresi gambar client-side sebelum upload (mis. `browser-image-compression`), video dibatasi 15 detik & resolusi maks 720p; volume ini nyaman ditangani free/pro tier Supabase Storage |
| Kapasitas sistem hari-H | ±200 peserta simultan, puncak trafik saat check-in massal di awal acara | Load test khusus skenario "200 user check-in dalam rentang 5-10 menit" (bukan beban harian web biasa); Server Actions untuk check-in idealnya idempotent agar aman dari double-tap/retry jaringan lapangan |

---

## 11. Rencana Deployment (Vercel)

1. **Environment Variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, untuk Edge Function/Route Handler admin), `SUPABASE_JWT_SECRET`
2. **Preview Deployment:** setiap PR → preview URL untuk UAT tim media/panitia
3. **Load Testing:** simulasikan ±200 user check-in serentak dalam window 5-10 menit (mis. k6/Artillery), khususnya endpoint check-in & upload galeri — skala ini realistis diuji penuh (bukan hanya sampel) mengingat jumlahnya moderat
4. **Rollback plan:** gunakan Vercel instant rollback ke deployment stabil sebelumnya jika terjadi masalah saat acara berlangsung
5. **Monitoring hari-H:** Vercel Analytics + Supabase Dashboard (query performance, realtime connection count) dipantau tim teknis selama upacara

---

## 12. Milestone Implementasi (Saran)

| Fase | Cakupan | Estimasi |
|---|---|---|
| 1. Setup & Auth | Project scaffolding, Supabase schema, Auth flow, onboarding | 1 minggu |
| 2. Core Missions | Check-in, QR Hunt, Quiz, Video mission, Passport | 1.5 minggu |
| 3. Realtime & Social | Gallery, Leaderboard, Like, Notifications | 1 minggu |
| 4. Live Mode | Poll, Salute Button, Merdeka Challenge, Admin live control | 1 minggu |
| 5. PWA & Offline | Serwist setup, offline queue, background sync, install prompt | 3-4 hari |
| 6. Admin Dashboard | Moderasi, statistik, kontrol poll/live | 4-5 hari |
| 7. Polish & Load Test | Certificate generator, Yearbook, QA, load test, aksesibilitas | 1 minggu |

---

## 13. Keputusan yang Sudah Difinalkan

| Pertanyaan | Keputusan | Dampak teknis |
|---|---|---|
| Moderasi galeri | Auto-publish + post-moderation | `gallery_items.status` default `approved`; admin melakukan takedown, bukan approval; ditambahkan `gallery_reports` untuk crowd-flagging |
| Estimasi peserta simultan | ±200 orang | Cukup dengan tier Supabase Pro standar; load test difokuskan pada skenario check-in massal 200 user, bukan skala ribuan |
| Aset AR filter | Custom (logo & ornamen) | Menjadi **dependency dari tim desain** — perlu disiapkan sebelum fase implementasi Check-in Camera dimulai (lihat §7.1) |
| Sertifikat digital | Tanpa tanda tangan/QR verifikasi | Menyederhanakan `certificate.actions.ts` — cukup generate PDF & simpan ke Storage, tanpa Edge Function signing atau endpoint verifikasi publik |
| Twibbon & Social Share | Twibbon & Photobooth Generator instan | Client-side Canvas rendering + auto-compression, 1-klik share ke WA Status & IG Story |
| Titik QR Hunt & Map | Peta Denah Interaktif + Geofencing GPS | Menampilkan visual peta titik di area acara + validasi radius GPS untuk mencegah fraud scan via WA foto |
| Stage Display Panggung | Stage Display View + SFX Audio-Visual | Mode full-screen proyektor panggung (`/stage-display`) dengan Live Salute visualizer, slideshow galeri realtime, & SFX terompet/sirine |
| Badges & Gelar | System Badge & Gelar Achievement Patriotik | Lencana prestasi ('Pahlawan Tercepat', 'Raja Trivia', 'Penjelajah Nusantara') yang terintegrasi di Digital Passport & Sertifikat PDF |
| Estetika UI/UX | Futuristic Indonesian Heritage | Palette Merah-Putih & Aksen Emas Glossy, Glassmorphism, animasi smooth, & haptic feedback di HP |

---

## 14. Rekomendasi Fitur Unggulan (Hasil Alignment Grill-Me)

### 14.1 Twibbon & Social Story Generator
- **Deskripsi:** Modul generator bingkai foto instan di mana peserta dapat mengunggah/mengambil foto, memilih varian bingkai Twibbon HUT RI ke-81 (Merah-Putih-Emas), dan mengunduh hasil gambar dengan rasio 9:16 atau 1:1.
- **Teknis:** Menggunakan Canvas HTML5 client-side rendering dengan kompresi `browser-image-compression` ke target ukuran < 300KB. Menyediakan Web Share API (`navigator.share`) untuk 1-klik share langsung ke WhatsApp Status & Instagram Story.
- **Rute:** `src/app/(public)/twibbon/page.tsx` & komponen `<TwibbonGenerator />`.

### 14.2 Peta Denah Interaktif Titik Merdeka + GPS Geofencing
- **Deskripsi:** Peta denah visual lokasi acara yang menampilkan pin-pin lokasi QR Hunt ("Jelajah Titik Merdeka").
- **Anti-Cheat Geofencing:** Saat peserta melakukan scan QR, aplikasi mengecek `navigator.geolocation` peserta terhadap koordinat `lat`/`lng` titik target dengan toleransi radius `radius_meters` (misal 30 meter). Jika posisi peserta di luar radius, scan ditolak untuk mencegah pemindaian QR ilegal via foto grup WhatsApp.
- **Rute:** `src/app/(public)/map/page.tsx` & komponen `<InteractiveMap />`.

### 14.3 Stage Display View (Layar Proyektor Panggung) + SFX
- **Deskripsi:** Tampilan antarmuka khusus full-screen tanpa navigasi yang dirancang untuk di-project ke layar TV/Proyektor Panggung Utama.
- **Fitur Stage Display:**
  1. **Live Salute Visualizer:** Efek gelombang animasi bendera Merah-Putih yang berkibar semakin cepat & tinggi seiring bertambahnya partisipasi tombol "Hormat!".
  2. **Wall of Merdeka Auto-Slideshow:** Carousel otomatis foto-foto keseruan peserta yang baru di-approve/publish secara real-time.
  3. **Live Leaderboard Top 5:** Papan peringkat 5 besar individu & kelompok yang beranimasi saat ada perubahan skor.
  4. **Audio SFX perayaan:** Efek suara terompet 17-an / sirine kemerdekaan saat event live dipicu oleh admin panggung.
- **Rute:** `src/app/(admin)/stage-display/page.tsx`.

### 14.4 System Badge & Gelar Achievement Patriotik
- **Deskripsi:** Lencana penghargaan digital yang secara otomatis dibuka oleh peserta saat memenuhi pencapaian tertentu:
  - 🏅 *Pahlawan Tercepat*: Check-in 10 peserta pertama.
  - 🧠 *Raja Trivia*: Lulus Quiz Sejarah dengan skor sempurna 100%.
  - 🗺️ *Penjelajah Nusantara*: Menyelesaikan seluruh titik QR Hunt.
  - 📸 *Fotografer Patriot*: Upload 3+ foto di Wall of Merdeka.
- **Integrasi:** Tampil berkilau emas di `<DigitalPassport />` dan otomatis dicetak sebagai stempel kehormatan pada dokumen Sertifikat PDF Digital.

### 14.5 Desain Estetika: Futuristic Indonesian Heritage
- **Desain System:**
  - Color Tokens: Primary Red (`#D9272D`), Crimson Red (`#B01C22`), Gold Glossy Accent (`#F59E0B`), Slate Glassmorphism (`rgba(15, 23, 42, 0.75)`).
  - Typography: Google Font *Plus Jakarta Sans* / *Outfit*.
  - Haptic Feedback: `navigator.vibrate([30, 50, 30])` saat menekan tombol "Hormat!", scan QR berhasil, dan membuka Badge baru.

