# Générateur de Slides Instagram - Chaoui Engagé

Ce projet est un outil web simple (HTML/CSS/JS) permettant de créer des slides Instagram au format carré (1:1) avec une charte graphique spécifique (Noir/Or/Blanc).

## Comment utiliser

1.  Ouvrez le fichier `public/index.html` dans votre navigateur web (Chrome, Firefox, Safari, etc.).
2.  Utilisez le panneau de gauche pour :
    *   Changer le type de slide (Titre, Contenu, Citation, Conclusion).
    *   Modifier le texte principal et secondaire.
    *   Surligner des mots clés (ils apparaîtront en Or).
    *   Afficher/Masquer le logo ou en charger un nouveau.
    *   Charger une image de fond (ex: Assemblée Nationale) et ajuster son opacité.
3.  Utilisez le bouton **"Charger Exemple Marine Le Pen"** pour voir une démo avec les données sur le vote du SMIC.
4.  Cliquez sur **"Télécharger l'image"** pour sauvegarder le slide actuel en image PNG.
5.  Copiez la bio générée pour votre post Instagram.

## Fichiers

*   `public/index.html` : La structure de la page.
*   `public/style.css` : Le design (Couleurs, Polices, Mise en page).
*   `public/script.js` : La logique (Prévisualisation, Export image, Données exemple).
*   `public/html2canvas.min.js` : Librairie pour l'export d'image.
*   `public/logo_default.jpg` : Votre logo par défaut.

## Note technique

L'application fonctionne entièrement dans le navigateur sans besoin de serveur backend complexe. L'export d'image utilise `html2canvas`.
