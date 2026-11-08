# HZ: The Roleplay

HZ: The Roleplay adalah prototype game roleplay 3D berbasis web yang dikembangkan dengan **Three.js**, **JavaScript**, **GitHub Pages**, dan **Supabase**.

## Fitur prototype saat ini

- Scene kota 3D awal dengan kamera third-person.
- Karakter sederhana yang bisa bergerak menggunakan WASD / tombol arah.
- Kontrol sentuh dasar untuk perangkat mobile.
- Registrasi dan login akun menggunakan Supabase Auth.
- Global chat menggunakan Supabase Database dan Realtime.
- Row Level Security (RLS) untuk membatasi pengiriman chat ke akun yang sedang login.

## Menjalankan project

Project ini menggunakan browser ES modules dan CDN, jadi tidak memerlukan proses build.

1. Buka repository di GitHub.
2. Masuk ke **Settings → Pages**.
3. Pada **Build and deployment**, pilih **Deploy from a branch**.
4. Pilih branch `main` dan folder `/(root)`, lalu simpan.
5. Buka URL GitHub Pages setelah proses deploy selesai.

## Supabase

Project Supabase: `bekmfbkuagqseophchcr`

Frontend memakai URL project dan **publishable key**. Publishable key memang boleh digunakan di browser; jangan pernah menaruh `service_role` atau secret key di frontend.

Tabel `public.global_chat` dan kebijakan RLS telah dibuat melalui migration Supabase. Realtime juga telah ditambahkan ke publication `supabase_realtime`.

## Catatan pengembangan

Ini masih tahap awal, bukan game open-world final. Model karakter, kendaraan, sistem pekerjaan, inventori, penyimpanan karakter, optimasi mobile, dan multiplayer posisi pemain akan dikembangkan bertahap. Jangan menganggap data game kompetitif aman hanya dari validasi client; aturan ekonomi dan aksi penting nantinya perlu divalidasi server-side.
