# DRIFT.md – överlämning och arbetssätt (Africane Bloom)

Den här filen beskriver hur webbplatsen och webbshopen på africane.se fungerar och hur man arbetar med den
från en annan dator (Windows). **Inga lösenord eller nycklar ska någonsin skrivas i den här filen eller i repot
(repot är publikt).**

## 1. Hur allt hänger ihop

| Del | Var | Hur ändras det |
|---|---|---|
| Webbplatsens kod (HTML, JS, bilder) | GitHub: `reent-hemsida/african-bloom-website` | Ändra filer, merga till `main` |
| Publicering | Vercel, automatiskt när `main` ändras | Inget manuellt steg |
| Kunder, ordrar, priser, inställningar | Supabase (projekt `zvufchkevyugiojyzeok`, Stockholm) | `africane.se/admin.html` (inloggad som admin) |
| Databasstruktur | `supabase/schema.sql` (kan köras om utan skada) | Klistra in i Supabase SQL Editor |
| Godkännandemejl | Supabase Edge Function `send-approval` (kod i `supabase/functions/send-approval/index.ts`) | Deploya via Supabase dashboard |
| Mejlmallar för registrering/lösenord | Supabase → Authentication → Emails → Templates | Klistra in HTML |
| Orderavisering till ägaren | FormSubmit (`notifyEndpoint` i `shop-config.js`) | – |

Sidor: `index/about/collection/ordering/faq/contact.html` (5 språk: en, es, ru, sv, hu, i samma fil, `data-lang`-block; engelska är standard),
`login.html`, `shop.html`, `admin.html`, `privacy.html` (delar `shop-core.js` och `shop.css`).
Sorter och bilder: `varieties-data.js` (en rad per sort: `Namn|kategori|sub|färgindex|bildfil`).

## 2. Komma igång på en Windows-dator

1. Installera **Git for Windows** (https://git-scm.com/download/win) och **Claude-appen** (logga in med samma konto).
2. Hämta projektet (PowerShell):
   ```powershell
   cd $HOME\Documents
   git clone https://github.com/reent-hemsida/african-bloom-website.git
   cd african-bloom-website
   ```
3. Skapa en **fine-grained personal access token** på GitHub (konto `reent-hemsida`): *Settings → Developer settings →
   Personal access tokens → Fine-grained*. Välj bara detta repo och *Contents: Read and write*.
   Git for Windows frågar efter inloggning vid första push: ange användarnamn och klistra in token som lösenord.
   Den sparas i Windows Credential Manager. Klistra aldrig token i chatten eller i filer.
4. Öppna mappen i Claude-appen (Code → välj mapp).
5. Valfritt för lokal förhandsgranskning: `py -m http.server 8123` i projektmappen, öppna `http://localhost:8123`.
   Webbshopen går att testa utan riktiga data med `?demo=1` (till exempel `login.html?demo=1`,
   admin: `admin@demo.test` / `demo1234`, lagras bara i webbläsaren).
6. Windows: sätt `git config core.autocrlf true` så att radslut inte ändras i onödan.

## 3. Arbetsflöde

```powershell
git checkout main
git pull origin main
git checkout -b mitt-arbete        # ny gren för varje ändring
# ... ändra filer ...
git add <filer>
git commit -m "Beskrivning"
git push -u origin mitt-arbete
```

Publicera genom att slå ihop med `main` (Vercel publicerar inom 1–2 minuter):
```powershell
git checkout main
git pull origin main
git merge mitt-arbete
git push origin main
```
Kontrollera efteråt med hård omladdning (Ctrl + Shift + R). Ändra inte på båda datorerna samtidigt utan
att först ha pushat och dragit (`git pull`).

## 4. Priser (viktigt)

* **Priser finns bara i databasen**, aldrig i repot. De läggs in via *Admin → Price list* med två CSV-filer.
  **Uppladdningen ersätter allt**, så ladda alltid upp kompletta filer.
  * Priser: `price_group,head_size,length_cm,tier_qty,price_ex_vat,price_inc_vat`
  * Kopplingar: `variety,price_group`
* Prisgrupper: `red, white, pink, yellow, orange, peach, spray, special_spray` (Prislista 2026, med huvudstorlekar)
  samt egna prislistor per sort som heter `v:<sortnamn>` (alltid `head_size=standard`).
* Volymnivåer 5 000 / 10 000 / 20 000 stjälkar. Priset bestäms av **summan av alla längder för samma sort** i ordern.
  Under lägsta nivån: pris på förfrågan. Minsta order: inställning i admin (standard 1 000).
* **Moms:** `vat_percent` (25) räknas på nettosumman. Kolumnen `price_inc_vat` används inte för totalsummor.
* Beslut ägaren tagit: **Prislista 2026 gäller där den finns**; övriga sorter prissätts från den interna listan
  (högsta pris bland varianter per längd och volymnivå); inga farm-namn, kostnader eller leverantörsuppgifter får visas
  eller sparas i repot/databasen; rosor i lila, lavendel, tvåfärgad och bronze samt rosor utan färg är pris på förfrågan.
* Priserna visas bara för inloggade, godkända kunder (Row Level Security i databasen, priset räknas på servern i
  `place_order`).
* Supabase begränsar svar till 1 000 rader. `shop-core.js` läser därför stora tabeller sida för sida.

Interna prislistor (PDF med farm-namn och kostnadsunderlag) är konfidentiella och hör inte hemma i repot.

## 5. Supabase

* Projekt-URL och publicerbar nyckel står i `shop-config.js` (publika värden). **Aldrig** `service_role`-nyckeln eller
  databaslösenordet i repot eller i chatten.
* Första admin sattes med SQL: `update public.profiles set is_admin = true, status = 'approved' where email = '…';`
* Godkännande av kunder sker i *Admin → Customers*. Språket per kund kan ändras där (styr mejlspråket).
* Edge Function `send-approval` kräver secrets i *Edge Functions → Secrets*: `SMTP_HOST`, `SMTP_PORT` (465),
  `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. *Verify JWT with legacy secret* ska vara **av** (funktionen kontrollerar själv).
* Mejlmallar innehåller svenska/spanska/ryska/ungerska tecken som HTML-entiteter (`&#…;`) för att klistras in utan teckenfel.
  Använd `Get-Content fil.html | Set-Clipboard` i PowerShell om du kopierar filer till urklipp.

## 6. Kända öppna punkter

* Modersmålsgranskning av spanska, ryska och ungerska texter, och juridisk granskning av `privacy.html`, innan fler kunder bjuds in.
* Sorter utan pris visas som "pris på förfrågan" tills priser finns.
* Nya leverantörer/sorter: lägg raden i `varieties-data.js`, lägg priserna som en egen grupp `v:<sortnamn>` i prisfilen (ladda alltid upp den *kompletta* sammanslagna filen, uppladdningen ersätter allt) och länka sorten i kopplingsfilen. Leverantörsnamn och inköpspriser får aldrig in i repot.
* Nya sorter från prislistan har liknande befintliga bilder tills egna foton finns (byt `bildfil` i `varieties-data.js`).
* 0 % moms för EU-företag med giltigt momsnummer är inte inbyggt (momsen visas alltid med standardsats).

## 7. Samarbetsstil

Ägaren skriver svenska och är inte tekniskt van: ge en sak i taget, kopiera kommandon till urklipp, be om skärmdumpar,
och be aldrig om lösenord. Kontrollera alltid att ändringar är live (hämta sidan efter publicering) innan du säger att
något är klart.
