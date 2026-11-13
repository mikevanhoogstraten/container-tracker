# Container Tracker — React + Supabase

Een eerste werkende databaseversie, zonder echte bedrijfsgegevens. Alle gebruikers met toegang zien dezelfde containers.

## 1. Supabase instellen
1. Maak een Supabase-project aan (kies een EU-regio indien passend bij jullie beleid).
2. Open SQL Editor en voer `supabase/schema.sql` uit.
3. Schakel onder Authentication e-mail/wachtwoord in. Zet publieke registratie uit. Maak gebruikers via Authentication > Users aan (of nodig ze uit).
4. Kopieer de `User UID` van iedere toegestane gebruiker en voer in SQL Editor uit:
   `insert into public.app_users(user_id) values ('USER-UUID-HIER');`
5. Kopieer de Project URL en de **publishable/anon** key uit de projectinstellingen. Gebruik NOOIT de `service_role` key in de webapp.

## 2. Lokaal testen
Installeer Node.js 20+ en voer uit:
```
npm install
cp .env.example .env
```
Vul in `.env` de URL en publishable key in en start `npm run dev`.

## 3. GitHub Pages
1. Maak een GitHub-repository en upload de projectbestanden. Upload **niet** `.env`.
2. Stel in GitHub > Settings > Secrets and variables > Actions de repository secrets `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` in.
3. Zet Pages > Source op **GitHub Actions**.
4. Push naar `main`; de workflow bouwt en publiceert de website.
5. Stel in Supabase > Authentication > URL Configuration de GitHub Pages-URL in als Site URL en voeg die toe aan Redirect URLs.

## Veiligheid en aandachtspunten
- GitHub Pages is publiek bereikbaar; de data zijn beschermd via Supabase Auth en Row Level Security. Alle **goedgekeurde** gebruikers hebben momenteel toegang tot alle bedrijfsgegevens. Voor gescheiden afdelingen zijn extra rollen nodig.
- Schakel publieke registratie uit en beheer toegang via `app_users`. Zet MFA aan waar mogelijk.
- Gebruik een private repository voor de broncode; GitHub Pages-publicatie en planvoorwaarden kunnen verschillen.
- Configureer back-ups, retentie en gegevensverwerking voordat echte bedrijfsgegevens worden ingevoerd.
- Deze eerste versie biedt toevoegen en statuswijzigingen, maar nog geen uitgebreide validatie, bewerken/verwijderen van artikelregels, auditlog of Excel-import. Test eerst met fictieve data.
