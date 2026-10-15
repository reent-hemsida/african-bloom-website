// Supabase Edge Function: send-approval
// Sends a "your account is approved" e-mail to a customer. Called from admin.html
// when an admin presses Approve (or "Send approval e-mail").
//
// Secrets to set in Supabase (Edge Functions > Secrets):
//   SMTP_HOST   e.g. mailcluster.loopia.se
//   SMTP_PORT   465
//   SMTP_USER   info@africane.se
//   SMTP_PASS   the mailbox password
//   SMTP_FROM   Africane Bloom <info@africane.se>
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const LOGIN = "https://www.africane.se/login.html";
const TEXT: Record<string, { subject: string; hello: string; body: string; button: string; foot: string }> = {
  en: {
    subject: "Your Africane Bloom account is approved",
    hello: "Hello",
    body: "Your customer account at africane.se has been approved. You can now log in to see prices and send order requests.",
    button: "Log in",
    foot: "Questions? Reply to this e-mail or write to info@africane.se.",
  },
  sv: {
    subject: "Ditt konto hos Africane Bloom \u00e4r godk\u00e4nt",
    hello: "Hej",
    body: "Ditt kundkonto p\u00e5 africane.se \u00e4r nu godk\u00e4nt. Du kan logga in f\u00f6r att se priser och skicka orderf\u00f6rfr\u00e5gningar.",
    button: "Logga in",
    foot: "Fr\u00e5gor? Svara p\u00e5 det h\u00e4r mejlet eller skriv till info@africane.se.",
  },
  es: {
    subject: "Su cuenta de Africane Bloom ha sido aprobada",
    hello: "Hola",
    body: "Su cuenta de cliente en africane.se ha sido aprobada. Ya puede iniciar sesi\u00f3n para ver precios y enviar solicitudes de pedido.",
    button: "Iniciar sesi\u00f3n",
    foot: "\u00bfPreguntas? Responda a este correo o escriba a info@africane.se.",
  },
  ru: {
    subject: "\u0412\u0430\u0448\u0430 \u0443\u0447\u0451\u0442\u043d\u0430\u044f \u0437\u0430\u043f\u0438\u0441\u044c Africane Bloom \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0430",
    hello: "\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435",
    body: "\u0412\u0430\u0448\u0430 \u0443\u0447\u0451\u0442\u043d\u0430\u044f \u0437\u0430\u043f\u0438\u0441\u044c \u043a\u043b\u0438\u0435\u043d\u0442\u0430 \u043d\u0430 africane.se \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0430. \u0422\u0435\u043f\u0435\u0440\u044c \u0432\u044b \u043c\u043e\u0436\u0435\u0442\u0435 \u0432\u043e\u0439\u0442\u0438, \u0447\u0442\u043e\u0431\u044b \u0432\u0438\u0434\u0435\u0442\u044c \u0446\u0435\u043d\u044b \u0438 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u044f\u0442\u044c \u0437\u0430\u044f\u0432\u043a\u0438 \u043d\u0430 \u0437\u0430\u043a\u0430\u0437.",
    button: "\u0412\u043e\u0439\u0442\u0438",
    foot: "\u0412\u043e\u043f\u0440\u043e\u0441\u044b? \u041e\u0442\u0432\u0435\u0442\u044c\u0442\u0435 \u043d\u0430 \u044d\u0442\u043e \u043f\u0438\u0441\u044c\u043c\u043e \u0438\u043b\u0438 \u043d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u043d\u0430 info@africane.se.",
  },
};

function build(lang: string, name: string) {
  const t = TEXT[lang] ?? TEXT.en;
  const n = esc(name || "");
  const html = `<div style="background:#FAF4E8;padding:24px 12px;font-family:Georgia,'Times New Roman',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #D9C7B3;">
<tr><td style="padding:22px 32px;border-bottom:1px solid #241E17;font-size:18px;letter-spacing:.14em;color:#201C1A;">AFRICANE BLOOM</td></tr>
<tr><td style="padding:28px 32px 24px;">
<h2 style="font-family:Georgia,serif;font-weight:normal;font-size:22px;margin:0 0 12px;color:#201C1A;">${t.hello} ${n},</h2>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3A342E;">${t.body}</p>
<p style="margin:0 0 20px;"><a href="${LOGIN}" style="display:inline-block;background:#8A4A1E;color:#ffffff;text-decoration:none;padding:12px 24px;font-size:14px;letter-spacing:.06em;">${t.button}</a></p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#6E6660;">${t.foot}</p>
</td></tr>
<tr><td style="padding:16px 32px 22px;font-size:12px;color:#6E6660;border-top:1px solid #E4DFD8;">Africane Bloom &middot; info@africane.se &middot; www.africane.se</td></tr>
</table></div>`;
  const text = `${t.hello} ${name || ""},\n\n${t.body}\n\n${t.button}: ${LOGIN}\n\n${t.foot}\n\nAfricane Bloom`;
  return { subject: t.subject, html, text };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Who is calling? Must be a logged-in admin.
    const { data: u, error: ue } = await admin.auth.getUser(token);
    if (ue || !u?.user) return json({ error: "not_logged_in" }, 401);
    const { data: me } = await admin.from("profiles").select("is_admin").eq("id", u.user.id).maybeSingle();
    if (!me?.is_admin) return json({ error: "not_admin" }, 403);

    // 2. Which customer? Must be approved.
    const { customer_id } = await req.json();
    if (!customer_id) return json({ error: "missing_customer_id" }, 400);
    const { data: p } = await admin.from("profiles").select("email,contact_name,lang,status").eq("id", customer_id).maybeSingle();
    if (!p || p.status !== "approved" || !p.email) return json({ error: "customer_not_approved" }, 400);

    // 3. Send.
    const m = build(p.lang, p.contact_name);
    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get("SMTP_HOST")!,
        port: Number(Deno.env.get("SMTP_PORT") ?? "465"),
        tls: true,
        auth: { username: Deno.env.get("SMTP_USER")!, password: Deno.env.get("SMTP_PASS")! },
      },
    });
    await client.send({ from: Deno.env.get("SMTP_FROM") ?? "Africane Bloom <info@africane.se>", to: p.email, subject: m.subject, content: m.text, html: m.html });
    await client.close();
    return json({ sent: true, to: p.email });
  } catch (e) {
    return json({ error: "send_failed", detail: String(e?.message ?? e) }, 500);
  }
});
