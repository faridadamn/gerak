import { project } from "gerak";

const p = project({
  title: "Muse Masuk WhatsApp + Bonus 1B Token (Benchmark Edition)",
  preset: "reels",
  fps: 30,
  background: "#070c18"
});

const W = p.width; // 1080
const H = p.height; // 1920

// Color Palette
const BG_DARK = "#070c18";
const CYAN = "#00e5ff";
const GREEN_NEON = "#00ff88";
const GOLD = "#ffd600";
const RED = "#ff4d61";
const WHITE = "#ffffff";
const PURPLE = "#a855f7";

// Helper: Ambient camera drift
function applyCameraDrift(scene) {
  scene.camera.push({ zoom: 1.05 });
}

// ==========================================
// SCENE 1: HOOK (8.7s = 261 frames)
// ==========================================
const s1 = p.scene("Hook", { duration: "8.7s", background: BG_DARK });
applyCameraDrift(s1);

// Atmospheric Tech Canvas
const s1_bg = s1.layer("BgTech", { x: W / 2, y: H / 2 });
s1_bg.image("/home/ubuntu/assets/images/bg_control.png", 0, 0, { width: W, height: H, anchor: "center", opacity: 0.65 });

// Big Hook Header at Top (2 Lines, High Contrast, Zero Box Clutter)
const s1_head = s1.layer("Header", { fixed: true });
s1_head.text("MUSE AI SEKARANG BISA,", W / 2, 220, {
  size: 72,
  weight: 900,
  color: WHITE,
  align: "center",
  valign: "middle",
  letterSpacing: 2,
  anim: { type: "words", effect: "pop", at: 2, stagger: 4, dur: 10 }
});
s1_head.text("MASUK KE WHATSAPP LU?!", W / 2, 320, {
  size: 76,
  weight: 900,
  color: GREEN_NEON,
  align: "center",
  valign: "middle",
  letterSpacing: 2,
  anim: { type: "words", effect: "pop", at: 14, stagger: 4, dur: 10 }
});

// Center Hero 3D Cutout: Smartphone with Chat
const s1_phone = s1.layer("PhoneHero", { x: W / 2, y: 820 });
s1_phone.image("/home/ubuntu/assets/images/phone-chat-cutout.png", 0, 0, { width: 440, anchor: "center" });
s1_phone.pop(4, { dur: 14 });
s1_phone.float({ amp: 14, period: 2.4 });

// Floating Robot Mascot next to phone
const s1_robot = s1.layer("RobotFloat", { x: W / 2 - 320, y: 680, rotation: -10 });
s1_robot.image("/home/ubuntu/assets/images/ai-robot-cutout.png", 0, 0, { width: 300, anchor: "center" });
s1_robot.pop(10, { dur: 14 });
s1_robot.float({ amp: 12, period: 2.0 });

// Bottom Dynamic Subtitle
const s1_sub = s1.layer("Subtitles", { fixed: true });
s1_sub.text("Muse AI sekarang bisa nongkrong di WhatsApp,", W / 2, 1480, {
  size: 44,
  weight: 700,
  color: WHITE,
  align: "center",
  valign: "middle",
  maxWidth: 960
});
s1_sub.text("PLUS BONUS 1 MILIAR TOKEN GRATIS!", W / 2, 1560, {
  size: 52,
  weight: 900,
  color: GOLD,
  align: "center",
  valign: "middle",
  anim: { type: "words", effect: "pop", at: 65, stagger: 4 }
});

s1.sfx("whoosh", { at: 0, volume: -10 });
s1.sfx("pop", { at: 14, volume: -12 });

// ==========================================
// SCENE 2: LANGKAH 1 - HP VIRTUAL AIRTAP (9.2s = 276 frames)
// ==========================================
const s2 = p.scene("Langkah1", {
  duration: "9.2s",
  background: BG_DARK,
  transition: { type: "push-left", duration: 10 }
});
applyCameraDrift(s2);

const s2_bg = s2.layer("BgPattern", { x: W / 2, y: H / 2 });
s2_bg.image("/home/ubuntu/assets/images/bg_pattern.png", 0, 0, { width: W, height: H, anchor: "center", opacity: 0.5 });

// Top Clean Point Header
const s2_head = s2.layer("Header", { fixed: true });
s2_head.circle(130, 220, 48, { fill: CYAN });
s2_head.text("1", 130, 220, { size: 48, weight: 900, color: BG_DARK, align: "center", valign: "middle" });
s2_head.text("DAFTAR VIA HP VIRTUAL", 210, 220, {
  size: 56,
  weight: 900,
  color: WHITE,
  valign: "middle",
  anim: { type: "words", effect: "pop", at: 4, stagger: 3 }
});

s2_head.text("• Buka airtap.ai di browser tanpa ganti HP", 210, 310, { size: 38, weight: 700, color: GOLD });
s2_head.text("• Pasang aplikasi Muse lewat Play Store", 210, 370, { size: 38, weight: 700, color: CYAN });

// Center Hero Cutout: 3D AI Robot Jumbo
const s2_hero = s2.layer("RobotHero", { x: W / 2, y: 840 });
s2_hero.image("/home/ubuntu/assets/images/ai-robot-cutout.png", 0, 0, { width: 540, anchor: "center" });
s2_hero.pop(4, { dur: 14 });
s2_hero.float({ amp: 14, period: 2.2 });

// Bottom Subtitle
const s2_sub = s2.layer("Subtitles", { fixed: true });
s2_sub.text("Nggak perlu repot ganti perangkat,", W / 2, 1480, {
  size: 46,
  weight: 700,
  color: WHITE,
  align: "center",
  valign: "middle"
});
s2_sub.text("buka airtap titik ai dan instal Muse!", W / 2, 1560, {
  size: 52,
  weight: 900,
  color: CYAN,
  align: "center",
  valign: "middle",
  anim: { type: "words", effect: "pop", at: 70, stagger: 4 }
});

s2.sfx("swipe", { at: 0, volume: -10 });

// ==========================================
// SCENE 3: LANGKAH 2 - CONNECT WHATSAPP & KODE (10.0s = 300 frames)
// ==========================================
const s3 = p.scene("Langkah2", {
  duration: "10.0s",
  background: BG_DARK,
  transition: { type: "push-left", duration: 10 }
});
applyCameraDrift(s3);

const s3_bg = s3.layer("BgTech", { x: W / 2, y: H / 2 });
s3_bg.image("/home/ubuntu/assets/images/bg_control.png", 0, 0, { width: W, height: H, anchor: "center", opacity: 0.6 });

const s3_head = s3.layer("Header", { fixed: true });
s3_head.circle(130, 220, 48, { fill: PURPLE });
s3_head.text("2", 130, 220, { size: 48, weight: 900, color: WHITE, align: "center", valign: "middle" });
s3_head.text("CONNECT WHATSAPP & REDEEM", 210, 220, {
  size: 52,
  weight: 900,
  color: WHITE,
  valign: "middle",
  anim: { type: "words", effect: "pop", at: 4, stagger: 3 }
});

s3_head.text("• Menu Connect WhatsApp langsung aktif", 210, 310, { size: 38, weight: 700, color: GREEN_NEON });
s3_head.text("• Redeem Kode: OX5FO8 (1B Token)", 210, 370, { size: 42, weight: 900, color: GOLD });

// Center Hero Cutout: 3D Golden Gift Box Overflowing Coins
const s3_gift = s3.layer("GiftHero", { x: W / 2, y: 840 });
s3_gift.image("/home/ubuntu/assets/images/gift-token-cutout.png", 0, 0, { width: 540, anchor: "center" });
s3_gift.pop(4, { dur: 14 });
s3_gift.float({ amp: 14, period: 2.3 });

// Bottom Subtitle
const s3_sub = s3.layer("Subtitles", { fixed: true });
s3_sub.text("Sambungkan WhatsApp lu lalu redeem kode,", W / 2, 1480, {
  size: 46,
  weight: 700,
  color: WHITE,
  align: "center",
  valign: "middle"
});
s3_sub.text("KODE: OX5FO8 BUAT BONUS 1 MILIAR TOKEN!", W / 2, 1560, {
  size: 52,
  weight: 900,
  color: GREEN_NEON,
  align: "center",
  valign: "middle",
  anim: { type: "words", effect: "pop", at: 75, stagger: 4 }
});

s3.sfx("swipe", { at: 0, volume: -10 });
s3.sfx("pop", { at: 30, volume: -12 });

// ==========================================
// SCENE 4: LANGKAH 3 - PERINGATAN & 9ROUTER (8.8s = 264 frames)
// ==========================================
const s4 = p.scene("Langkah3", {
  duration: "8.8s",
  background: BG_DARK,
  transition: { type: "push-left", duration: 10 }
});
applyCameraDrift(s4);

const s4_bg = s4.layer("BgPattern", { x: W / 2, y: H / 2 });
s4_bg.image("/home/ubuntu/assets/images/bg_pattern.png", 0, 0, { width: W, height: H, anchor: "center", opacity: 0.5 });

const s4_head = s4.layer("Header", { fixed: true });
s4_head.text("HATI-HATI!", W / 2, 200, {
  size: 80,
  weight: 900,
  color: RED,
  align: "center",
  valign: "middle",
  letterSpacing: 2,
  anim: { type: "words", effect: "pop", at: 2 }
});
s4_head.text("KODE BISA HANGUS SEWAKTU-WAKTU", W / 2, 290, {
  size: 52,
  weight: 900,
  color: WHITE,
  align: "center",
  valign: "middle",
  anim: { type: "words", effect: "pop", at: 10, stagger: 3 }
});
s4_head.text("Opsi mandiri: 9Router AI Gateway (Self-Host)", W / 2, 360, {
  size: 38,
  weight: 700,
  color: CYAN,
  align: "center",
  valign: "middle"
});

// Center Hero Cutout: 3D Cyber Shield Lock
const s4_shield = s4.layer("ShieldHero", { x: W / 2, y: 840 });
s4_shield.image("/home/ubuntu/assets/images/ai-shield-cutout.png", 0, 0, { width: 530, anchor: "center" });
s4_shield.pop(4, { dur: 14 });
s4_shield.float({ amp: 14, period: 2.1 });

// Bottom Subtitle
const s4_sub = s4.layer("Subtitles", { fixed: true });
s4_sub.text("Promo bisa kedaluwarsa kapan aja,", W / 2, 1480, {
  size: 46,
  weight: 700,
  color: WHITE,
  align: "center",
  valign: "middle"
});
s4_sub.text("atau pakai sembilan router buat self-host!", W / 2, 1560, {
  size: 50,
  weight: 900,
  color: RED,
  align: "center",
  valign: "middle",
  anim: { type: "words", effect: "pop", at: 65, stagger: 4 }
});

s4.sfx("swipe", { at: 0, volume: -10 });

// ==========================================
// SCENE 5: CTA & REKAP (8.5s = 255 frames)
// ==========================================
const s5 = p.scene("CTA", {
  duration: "8.5s",
  background: BG_DARK,
  transition: { type: "zoom", duration: 12 }
});
applyCameraDrift(s5);

const s5_bg = s5.layer("BgTech", { x: W / 2, y: H / 2 });
s5_bg.image("/home/ubuntu/assets/images/bg_control.png", 0, 0, { width: W, height: H, anchor: "center", opacity: 0.65 });

// Big Outro Title
const s5_head = s5.layer("Header", { fixed: true });
s5_head.text("ASISTEN AI DI WHATSAPP!", W / 2, 220, {
  size: 74,
  weight: 900,
  color: GOLD,
  align: "center",
  valign: "middle",
  anim: { type: "words", effect: "pop", at: 2, stagger: 3 }
});
s5_head.text("HP Virtual + 1B Token Bonus", W / 2, 310, {
  size: 46,
  weight: 800,
  color: WHITE,
  align: "center",
  valign: "middle"
});

// Center Hero Cutout: 3D Phone + Robot Outro
const s5_robot = s5.layer("RobotOutro", { x: W / 2, y: 780 });
s5_robot.image("/home/ubuntu/assets/images/ai-robot-cutout.png", 0, 0, { width: 500, anchor: "center" });
s5_robot.pop(3, { dur: 14 });
s5_robot.float({ amp: 14, period: 2.2 });

// Big Punchy CTA
const s5_cta = s5.layer("CTABottom", { fixed: true });
s5_cta.text("SIMPAN BIAR NGGAK LUPA!", W / 2, 1380, {
  size: 64,
  weight: 900,
  color: GREEN_NEON,
  align: "center",
  valign: "middle",
  anim: { type: "words", effect: "pop", at: 15, stagger: 4 }
});

s5_cta.text("Follow @FaridAdam-t5d untuk trik AI lainnya", W / 2, 1500, {
  size: 38,
  weight: 700,
  color: WHITE,
  align: "center",
  valign: "middle"
});

s5.sfx("whoosh", { at: 0, volume: -10 });

export default p;
