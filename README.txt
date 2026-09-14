PrayerClock Web V4 — PWA

Nouveau lieu :
Evere — Chaussée de Louvain 1028
Latitude : 50.8603896
Longitude : 4.4207985
Fuseau : Europe/Brussels

La V4 est prête pour être publiée comme PWA :
- calcul solaire embarqué localement ;
- plus de dépendance au CDN SunCalc ;
- fonctionnement hors connexion après installation ;
- manifest ;
- service worker ;
- icônes 192 et 512 px ;
- bouton Installer quand le navigateur le permet.

Pour tester simplement : ouvrir index.html.
Pour tester l'installation PWA, il faut publier les fichiers en HTTPS
(par exemple GitHub Pages) ou utiliser localhost.


ADHAN
- adhan.mp3 est inclus dans le package.
- Dans l'application, cliquer une fois sur « Activer l’adhan ».
- L'adhan est déclenché à Fajr, Dhuhr, Asr, Maghrib et Isha lorsque la PWA/page est active.
- Imsak, lever du soleil et Midnight ne déclenchent pas l'adhan.
- Boutons Tester et Arrêter disponibles.
- Les navigateurs peuvent limiter l'exécution/audio lorsqu'une page ou PWA est totalement fermée.


V4.2 MOBILE
- Corrige le débordement horizontal / déplacement gauche-droite.
- Le libellé VILLE reste entièrement visible.
- Le sélecteur de ville s'adapte à la largeur de l'écran.
- Horloge et compte à rebours légèrement compactés sur smartphone.
- La disposition ordinateur (> 899 px) reste inchangée.
